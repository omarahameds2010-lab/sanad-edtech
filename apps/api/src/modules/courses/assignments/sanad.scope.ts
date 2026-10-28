/**
 * SANAD knowledge scope for the unified "اللغة العربية" subject.
 *
 * One subject, many branches: the LMS never trusts the client for scope.
 * Branch buttons in the UI resolve HERE to explicit SANAD source_ids;
<<<<<<< Updated upstream
 * "all" searches the 17 genuine banks only (filler was quarantined out of
=======
 * "all" searches the 39 genuine banks only (filler was quarantined out of
>>>>>>> Stashed changes
 * the SANAD index and is absent from this map by design).
 *
 * When new banks are ingested into SANAD, extend the matching branch list.
 * Branches with no genuine content yet (e.g. hadith) stay ABSENT — the UI
 * renders no button for them instead of returning empty evidence.
 */

export const ARABIC_BRANCH_SOURCES: Record<string, string[]> = {
  nahw: [
    "gen_fixed_irab_v1",
    "nahw_advanced_v1",
    "nahw_edaadi_v1",
    "nahw_thanaweya_v1",
<<<<<<< Updated upstream
    "exam_bank_nahw_v1",
    "alfiyya_study_v1",
    "huruf_maani_v1",
  ],
  sarf: ["gen_sarf_tables_p1_v1", "gen_sarf_tables_p2_v1"],
  balagha: ["balagha_deep_v1", "exam_bank_balagha_v1"],
  arood: ["arood_qawafi_v1"],
  lugha: ["gen_vocab_bank_v1", "fiqh_lugha_v1", "quran_vocab_v1"],
  quran: ["juzamma_tafsir_v1"],
  sira: ["seera_nabaweya_v1"],
=======
    "opensource_nazm_ajurrumiyya_v1",
    "sibawayh_kitab_v1",
  ],
  sarf: [
    "gen_sarf_tables_p1_v1",
    "gen_sarf_tables_p2_v1",
    "sarf_emlaa_v1",
  ],
  balagha: [
    "balagha_deep_v1",
    "balagha_v1",
    "exam_bank_balagha_v1",
    "fonoun_radd_v1",
    "nahj_selections_v1",
  ],
  arood: ["arood_qawafi_v1", "muallaqat_study_v1"],
  adab: [
    "aalam_adab_v1",
    "amthal_hikam_v1",
    "diwan_selections_v1",
    "insha_models_v1",
    "nosous_qiraa_bank_v1",
    "qiraa_nosous_v1",
    "taabeer_styles_v1",
    "taabeer_v1",
    "tahleel_egaba_v1",
    "jahiz_bayan_v1",
  ],
  lugha: [
    "fiqh_lugha_v1",
    "gen_vocab_bank_v1",
    "ibn_manzur_lisan_v1",
    "quran_vocab_v1",
    "zabidi_taj_v1",
  ],
  quran: ["duaa_quran_bank_v1", "juzamma_tafsir_v1"],
  sira: ["seera_nabaweya_v1", "tarikh_masr_v1"],
>>>>>>> Stashed changes
};

export const ARABIC_BRANCH_LABELS: Record<string, string> = {
  nahw: "النحو والإعراب",
  sarf: "الصرف والإملاء",
  balagha: "البلاغة والنقد",
  arood: "العروض وميزان الشعر",
  lugha: "اللغة والمفردات",
  quran: "القرآن وعلومه",
  sira: "السيرة والتاريخ",
};

export const ALL_ARABIC_SOURCES: string[] = Object.values(
  ARABIC_BRANCH_SOURCES,
).flat();

export function resolveBranchSources(branch?: string): string[] {
  if (!branch || branch === "all") return ALL_ARABIC_SOURCES;
  return ARABIC_BRANCH_SOURCES[branch] ?? [];
}
