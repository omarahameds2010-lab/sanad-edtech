import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";

/**
 * SANAD AI Evaluation Engine — typed server-to-server HTTP client.
 *
 * SANAD runs as an INDEPENDENT FastAPI service (default http://localhost:8000).
 * The browser never calls SANAD directly; only this LMS backend does,
 * authenticated with X-API-Key. No shared DB, no code copying.
 *
 * Verified live against SANAD contracts (2026-10):
 * - POST /ingest {source_id<=200ch, text 1..200000ch, metadata, chunker_type}
 * - POST /query/extractive {question, top_k 1..20, chunker_type,
 *   enable_reranking, enable_query_expansion, source_ids[<=50], branch}
 *   -> {passages[{chunk_id, source_id, branch, text, score}], cited_chunk_ids}
 * - POST /evaluate/submission (rubric-aware grading):
 *   request_id/submission_id/question_id MUST be UUIDs (else HTTP 422),
 *   sum(criteria.max_score) MUST equal max_score (else HTTP 422).
 *   Never retried on 4xx (except 429); retried with backoff on 429/5xx.
 */

export interface SanadCriterion {
  id: string;
  description: string;
  max_score: number;
}

export interface SanadGrading {
  reference_answer: string;
  max_score: number;
  rubric_version: string;
  criteria: SanadCriterion[];
}

export interface SanadEvaluationConfig {
  chunker_type?: "arabic" | "baseline" | "hierarchical";
  enable_reranking?: boolean;
  enable_query_expansion?: boolean;
  top_k?: number;
}

export interface SanadCriterionResult {
  criterion_id: string;
  earned: number;
  max: number;
  evidence: string | null;
  evidence_type: "SUPPORTED" | "PARTIAL" | "ABSENT";
  feedback_ar: string;
}

export interface SanadEvaluationResult {
  evaluation_id: string;
  request_id: string;
  /** LMS submission UUID generated for this call (persist to correlate). */
  sanad_submission_id: string;
  status: string;
  suggested_score: number;
  max_score: number;
  criteria: SanadCriterionResult[];
  feedback_ar: string;
  review_signal: number;
  needs_teacher_review: boolean;
  knowledge_gaps: string[];
  provenance: Record<string, unknown>;
  usage: Record<string, unknown>;
}

export interface SanadExtractPassage {
  chunk_id: string;
  source_id: string;
  branch: string;
  text: string;
  score: number;
}

export class SanadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(message);
    this.name = "SanadError";
  }
}

const DEFAULT_CONFIG: Required<SanadEvaluationConfig> = {
  chunker_type: "hierarchical",
  enable_reranking: true,
  enable_query_expansion: true,
  top_k: 5,
};

@Injectable()
export class SanadClient {
  private readonly logger = new Logger(SanadClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries = 3;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      configService.get<string>("SANAD_BASE_URL") || "http://localhost:8000";
    this.apiKey = configService.get<string>("SANAD_API_KEY") || "";
    this.timeoutMs = Number(
      configService.get<string>("SANAD_TIMEOUT_MS") || "60000",
    );
  }

  // ---------------------------------------------------------------- health

  async health(): Promise<{
    status: string;
    qdrant_ok: boolean;
    db_ok: boolean;
  }> {
    return this.request("GET", "/health");
  }

  // ---------------------------------------------------------------- ingest

  async ingestMaterial(
    sourceId: string,
    text: string,
    metadata: Record<string, unknown> = {},
    chunkerType: "arabic" | "baseline" | "hierarchical" = "hierarchical",
  ): Promise<{ source_id: string; n_chunks: number }> {
    return this.request("POST", "/ingest", {
      source_id: sourceId,
      text,
      metadata,
      chunker_type: chunkerType,
    });
  }

  // ------------------------------------------------- extractive evidence

  async queryExtract(
    question: string,
    opts: {
      topK?: number;
      branch?: string;
      sourceIds?: string[];
      chunkerType?: "arabic" | "baseline" | "hierarchical";
    } = {},
  ): Promise<{
    passages: SanadExtractPassage[];
    cited_chunk_ids: string[];
    retrieval_ms: number;
  }> {
    return this.request("POST", "/query/extractive", {
      question,
      top_k: opts.topK ?? 5,
      chunker_type: opts.chunkerType ?? "arabic",
      ...(opts.branch ? { branch: opts.branch } : {}),
      ...(opts.sourceIds ? { source_ids: opts.sourceIds } : {}),
    });
  }

  // ------------------------------------------------- guarded judgement

  async evaluateSubmission(args: {
    tenantId: string;
    questionId?: string;
    questionText: string;
    questionType?: "ESSAY" | "SHORT_ANSWER";
    studentAnswer: string;
    grading: SanadGrading;
    sourceIds: string[];
    knowledgeVersion?: string;
    config?: SanadEvaluationConfig;
  }): Promise<SanadEvaluationResult> {
    const criteriaSum = args.grading.criteria.reduce(
      (s, c) => s + c.max_score,
      0,
    );
    if (criteriaSum !== args.grading.max_score) {
      throw new SanadError(
        `Rubric invalid: criteria sum (${criteriaSum}) != max_score (${args.grading.max_score})`,
        422,
        "client-side rubric check",
      );
    }
    if (!args.sourceIds.length) {
      throw new SanadError(
        "sourceIds must not be empty",
        422,
        "client-side check",
      );
    }
    const sanadSubmissionId = randomUUID();
    const body = await this.request("POST", "/evaluate/submission", {
      request_id: randomUUID(),
      submission_id: sanadSubmissionId,
      tenant_id: args.tenantId,
      question_id: args.questionId ?? randomUUID(),
      question: { text: args.questionText, type: args.questionType ?? "ESSAY" },
      student_answer: { text: args.studentAnswer },
      grading: {
        reference_answer: args.grading.reference_answer,
        max_score: args.grading.max_score,
        rubric_version: args.grading.rubric_version,
        criteria: args.grading.criteria.map((c) => ({
          id: c.id,
          description: c.description,
          max_score: c.max_score,
        })),
      },
      knowledge: {
        source_ids: args.sourceIds,
        version: args.knowledgeVersion ?? "v1",
      },
      config: { ...DEFAULT_CONFIG, ...(args.config ?? {}) },
    });
    return { ...body, sanad_submission_id: sanadSubmissionId };
  }

  // ---------------------------------------------------------------- core

  private async request(
    method: "GET" | "POST",
    path: string,
    json?: unknown,
  ): Promise<any> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey ? { "X-API-Key": this.apiKey } : {}),
          },
          body: json === undefined ? undefined : JSON.stringify(json),
          signal: ctrl.signal,
        });
        const text = await res.text();
        if (res.status === 401) {
          throw new SanadError(
            "SANAD auth failed — check SANAD_API_KEY",
            401,
            text.slice(0, 200),
          );
        }
        if (res.status === 422) {
          throw new SanadError(
            "SANAD rejected the payload",
            422,
            text.slice(0, 500),
          );
        }
        if (res.status === 429 || res.status >= 500) {
          lastError = new SanadError(
            `SANAD unavailable (${res.status})`,
            res.status,
            text.slice(0, 200),
          );
        } else if (!res.ok) {
          throw new SanadError(
            `SANAD error (${res.status})`,
            res.status,
            text.slice(0, 200),
          );
        } else {
          return text ? JSON.parse(text) : {};
        }
      } catch (e) {
        if (e instanceof SanadError && (e.status === 401 || e.status === 422))
          throw e;
        lastError = e;
        this.logger.warn(
          `SANAD ${method} ${path} attempt ${attempt + 1} failed`,
        );
      } finally {
        clearTimeout(timer);
      }
      if (attempt < this.maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(
          `SANAD ${method} ${path} failed after ${this.maxRetries} attempts`,
        );
  }
}
