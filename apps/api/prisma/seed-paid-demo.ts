/**
 * Paid demo data — one published course behind checkout plus one voucher.
 *
 * This is intentionally separate from `seed-path2.ts` (which owns users,
 * passwords, the free course and the 90-second judge path). Run it only when
 * you want the paid enrollment guard + voucher checkout to be reachable.
 *
 * Usage (local demo database):
 *   $env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/learning_platform?schema=public"
 *   pnpm --filter api seed:paid-demo
 *
 * Env overrides:
 *   DEMO_PAID_COURSE_SLUG  default arabic-3-prep
 *   DEMO_PAID_COURSE_PRICE default 199.00
 *   DEMO_VOUCHER_CODE      default SANAD-2026
 *
 * Safe to re-run: the course price is updated, and the voucher is upserted by
 * its hash instead of creating a duplicate row.
 */

import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

const COURSE_SLUG = process.env.DEMO_PAID_COURSE_SLUG ?? "arabic-3-prep";
const PRICE = process.env.DEMO_PAID_COURSE_PRICE ?? "199.00";
const VOUCHER_CODE = process.env.DEMO_VOUCHER_CODE ?? "SANAD-2026";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required. Set it to the local demo database before running this script.",
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: "sanad-demo" },
    select: { id: true, name: true },
  });
  if (!tenant) throw new Error("Tenant sanad-demo was not found.");

  const course = await prisma.course.findFirst({
    where: { tenantId: tenant.id, slug: COURSE_SLUG },
    select: { id: true, title: true, slug: true },
  });
  if (!course) throw new Error(`Course ${COURSE_SLUG} was not found.`);

  await prisma.course.update({
    where: { id: course.id },
    data: { price: PRICE, currency: "EGP", status: "PUBLISHED" },
  });

  const codeHash = crypto
    .createHash("sha256")
    .update(VOUCHER_CODE)
    .digest("hex");

  await prisma.voucher.upsert({
    where: {
      tenantId_codeHash: { tenantId: tenant.id, codeHash },
    },
    create: {
      tenantId: tenant.id,
      codeHash,
      discountType: "FIXED_AMOUNT",
      discountValue: Math.round(Number(PRICE) * 100),
      maxUses: 100,
      courseId: course.id,
      expiresAt: new Date("2027-12-31T23:59:59.000Z"),
      metadata: {
        demo: true,
        purpose: "paid-course-checkout",
        courseSlug: course.slug,
      },
    },
    update: {
      courseId: course.id,
      disabledAt: null,
      expiresAt: new Date("2027-12-31T23:59:59.000Z"),
      metadata: {
        demo: true,
        purpose: "paid-course-checkout",
        courseSlug: course.slug,
      },
    },
  });

  console.log(
    `Paid demo ready: ${course.title} (${course.slug}) = ${PRICE} EGP; voucher ${VOUCHER_CODE}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
