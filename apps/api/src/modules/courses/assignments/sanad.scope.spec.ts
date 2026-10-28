import {
  ALL_ARABIC_SOURCES,
  ARABIC_BRANCH_LABELS,
  ARABIC_BRANCH_SOURCES,
  resolveBranchSources,
} from "./sanad.scope";

const EXPECTED_BRANCHES = [
  "adab",
  "arood",
  "balagha",
  "lugha",
  "nahw",
  "quran",
  "sarf",
  "sira",
];

describe("SANAD Arabic scope", () => {
  it("covers all 39 genuine sources exactly once", () => {
    expect(ALL_ARABIC_SOURCES).toHaveLength(39);
    expect(new Set(ALL_ARABIC_SOURCES).size).toBe(39);
  });

  it("has the eight user-facing branches, all non-empty and labelled", () => {
    expect(Object.keys(ARABIC_BRANCH_SOURCES).sort()).toEqual(EXPECTED_BRANCHES);
    expect(Object.keys(ARABIC_BRANCH_LABELS).sort()).toEqual(EXPECTED_BRANCHES);
    for (const branch of EXPECTED_BRANCHES) {
      expect(ARABIC_BRANCH_SOURCES[branch].length).toBeGreaterThan(0);
      expect(ARABIC_BRANCH_LABELS[branch]).toBeTruthy();
    }
  });

  it("includes the 12 new-wave sources in the right branches", () => {
    expect(resolveBranchSources("adab")).toEqual(
      expect.arrayContaining([
        "aalam_adab_v1",
        "amthal_hikam_v1",
        "diwan_selections_v1",
        "insha_models_v1",
        "nosous_qiraa_bank_v1",
      ]),
    );
    expect(resolveBranchSources("nahw")).toContain(
      "opensource_nazm_ajurrumiyya_v1",
    );
    expect(resolveBranchSources("quran")).toContain("duaa_quran_bank_v1");
    expect(resolveBranchSources("sarf")).toContain("sarf_emlaa_v1");
    expect(resolveBranchSources("balagha")).toContain("nahj_selections_v1");
    expect(resolveBranchSources("sira")).toContain("tarikh_masr_v1");
  });

  it("maps the four heritage books to their Arabic branches", () => {
    expect(resolveBranchSources("nahw")).toContain("sibawayh_kitab_v1");
    expect(resolveBranchSources("adab")).toContain("jahiz_bayan_v1");
    expect(resolveBranchSources("lugha")).toEqual(
      expect.arrayContaining(["ibn_manzur_lisan_v1", "zabidi_taj_v1"]),
    );
  });

  it("returns all sources for all/undefined and none for unknown", () => {
    expect(resolveBranchSources("all")).toEqual(ALL_ARABIC_SOURCES);
    expect(resolveBranchSources()).toEqual(ALL_ARABIC_SOURCES);
    expect(resolveBranchSources("hadith")).toEqual([]);
  });
});
