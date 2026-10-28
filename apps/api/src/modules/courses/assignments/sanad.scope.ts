/**
 * SANAD EdTech LMS - Course Assignment Scoping
 *
 * One subject, many branches: the LMS never trusts the client for scope.
 * Branch buttons in the UI resolve HERE to explicit SANAD source_ids;
 * "all" searches the 39 genuine banks only (filler was quarantined out of
 * the SANAD index and is absent from this map by design).
 *
 * When new banks are ingested into SANAD, extend the matching branch list.
 */
export const ARABIC_BRANCH_SOURCES: Record<string, string[]> = {
  arabic: [
    "nahw_advanced_v1",
    "nahw_edaadi_v1",
    "nahw_thanaweya_v1",
    "exam_bank_nahw_v1",
    "alfiyya_study_v1",
    "huruf_maani_v1",
  ],
  sarf: ["gen_sarf_tables_p1_v1", "gen_sarf_tables_p2_v1"],
  balagha: ["balagha_deep_v1", "exam_bank_balagha_v1"],
  arood: ["arood_qawafi_v1"],
  lugha: ["gen_vocab_bank_v1", "fiqh_lugha_v1", "quran_vocab_v1"],
};