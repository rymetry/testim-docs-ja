# Upstream patch review — 2026-10-23

Refs #449. Review base: `d99f9bb3` (main).

## Outcome

All 32 registered patch patterns still occur in the current upstream HTML; this review established no safe retirement. Live HTML fetched on 2026-10-23 returned HTTP 200 for all 32 unique slugs and was byte-identical to the committed snapshots. Every one of the 39 patch/page pairs matched after the normal pre-patch HTML normalization; runtime patch coverage reported 39 matched hits and zero mismatches. No patch or slug scope was removed. Original review dates remain overdue. Matching proves the patterns persist, not that every patch is indispensable under every possible extractor implementation.

The review inspected the existing find/replace fragments against the fresh HTML, including all five Salesforce typo pages, all five UD-009 Grid pages, and the CRLF-sensitive UD-016/018/019/020 fragments. These exact artifacts persist; a successful fetch or an exit code of zero from the non-blocking recovery command is not evidence of recovery.

## Evidence by page

SHA-256 values below cover the unmodified `#mc-main-content` extraction, including CRLF. Each digest also matches `snapshots/en/content/<slug>.html` at the review base. Short patch IDs map to the full IDs in the authoritative JSON registry.

| Official source | SHA-256 | Patch IDs and hits |
| --- | --- | --- |
| [administration/subscription-plans](https://docs.tricentis.com/testim/content/administration/subscription-plans/index.htm) | `87a626443b4775585c85aec46d8e78c7623456f464c8ab96735b67d3c72217fe` | UD-016A: 1, UD-016B: 1 |
| [advanced-editing/api-testing](https://docs.tricentis.com/testim/content/advanced-editing/api-testing.htm) | `d7f051411b10aba9f41572d48ee710b1e52b690636090a3f43138acd81f0f780` | UD-017: 1 |
| [advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor](https://docs.tricentis.com/testim/content/advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor.htm) | `317b50883f8193d4df070f498901fc151e9e4a807349519697861c56d4d2b07a` | UD-012: 1 |
| [advanced-editing/hooks](https://docs.tricentis.com/testim/content/advanced-editing/hooks.htm) | `95f061a56e749fd8b40900235f7188609b5035701a835f0f50782ac9a947696f` | UD-005A: 1, UD-005B: 1 |
| [advanced-editing/parameters](https://docs.tricentis.com/testim/content/advanced-editing/parameters/index.htm) | `96c304afb2270f34fea71175d3d6a9a91d02ff0e2bdede035cb8cadd5439d4bc` | UD-005C: 1 |
| [advanced-editing/parameters/hidden-parameters](https://docs.tricentis.com/testim/content/advanced-editing/parameters/hidden-parameters.htm) | `209e142067a5ceb68eeb268b0ebe44ba2cb42600e778cd31c128c3fc651e1cdb` | UD-013: 1 |
| [advanced-editing/parameters/parameter-override-rules](https://docs.tricentis.com/testim/content/advanced-editing/parameters/parameter-override-rules.htm) | `e967e507c988cd80939b09838ccacb2c094c978de78c537127b6e06fb4420b6c` | UD-005D: 1, UD-005E: 1, UD-005F: 1 |
| [advanced-editing/parameters/parameters-for-groups](https://docs.tricentis.com/testim/content/advanced-editing/parameters/parameters-for-groups.htm) | `8f4788ecf9d1c11d5d6b4ba2bc990cd69c22b0906932442dc870667bc75db045` | UD-010B: 1 |
| [advanced-editing/validations/validate-download](https://docs.tricentis.com/testim/content/advanced-editing/validations/validate-download.htm) | `966b1f0e67eadb0be6c4205e09c590519fe53383cf4a505799a61718892f3f75` | UD-021: 1 |
| [editing-tests/groups/auto-grouping](https://docs.tricentis.com/testim/content/editing-tests/groups/auto-grouping.htm) | `2e2070187f4c9f2f4a8ae1bbd4838dc21eb53b899afbfa95e91eb71839247752` | UD-014: 1 |
| [editing-tests/search-within-a-test](https://docs.tricentis.com/testim/content/editing-tests/search-within-a-test.htm) | `b9bf0557753653df0c2c3874bf6ae6bc1b7c45402938f677270fd38ff999d8cd` | UD-006: 1 |
| [guides/generate-random-data-with-js](https://docs.tricentis.com/testim/content/guides/generate-random-data-with-js.htm) | `aa6f748cd2567be0a50089977d4b3c5fd7cd1ec147fd27106d3f12216c5c54ce` | UD-007: 1 |
| [integrations/grid-management/browserstack-integration](https://docs.tricentis.com/testim/content/integrations/grid-management/browserstack-integration.htm) | `067981be6dc84a1a0809de72c8aa4eea341cc09a8f339d019d2a38853e9b3c97` | UD-009: 1 |
| [integrations/grid-management/custom-grid](https://docs.tricentis.com/testim/content/integrations/grid-management/custom-grid.htm) | `9300d5d3432bf2cb168fb92d311f74c41dfb45a04c9dade8d9e4e25349d50195` | UD-009: 1 |
| [integrations/grid-management/headspin-integration](https://docs.tricentis.com/testim/content/integrations/grid-management/headspin-integration.htm) | `77ee81b9d48644860f443c2a50168aa77500491910df92799436b99fe876598a` | UD-009: 1 |
| [integrations/grid-management/lambdatest-integration](https://docs.tricentis.com/testim/content/integrations/grid-management/lambdatest-integration.htm) | `fb9333d8c3e3ac6b3d2ae4602878fb75215ebf8f551235629c92ce7660677173` | UD-009: 1 |
| [integrations/grid-management/saucelabs-integration](https://docs.tricentis.com/testim/content/integrations/grid-management/saucelabs-integration.htm) | `3cca6a7c451caf47121c38ed51f6b91e63f3752bf06bd767a39a2e2ac5531885` | UD-009: 1 |
| [integrations/integrate-testim-to-your-ci/codeship-integration](https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/codeship-integration.htm) | `96499dba24701bf25dedfa3a46e14cb2af35277d2fbf6f2873b60b31e4b343b2` | UD-010A: 1 |
| [integrations/integrate-testim-to-your-ci/jenkins-integration-using-docker](https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/jenkins-integration-using-docker.htm) | `7dd9d7d4d1017f96e3f6db455dc9c792aa0f5da45763e50648a0ef7a310b32ed` | UD-022: 1 |
| [integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration](https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration.htm) | `37b39bec26d8ce4d9a631601d39d1c25560a3777d7a7abeefd275b80ecc37734` | UD-010C: 1, UD-010D: 1 |
| [integrations/sealights-integration](https://docs.tricentis.com/testim/content/integrations/sealights-integration.htm) | `4ed61073e9ae6755ac609cfd9090e38c3c449dbefe2921fb273db55825de41c7` | UD-018A: 1, UD-018B: 1, UD-018C: 1 |
| [running-tests/configuration-file-run-hooks](https://docs.tricentis.com/testim/content/running-tests/configuration-file-run-hooks/index.htm) | `5504f30dd1fb538ab181ccf2e8cfaec0dd43f564295e1da51cdae659e3fc92b9` | UD-015: 1 |
| [running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks](https://docs.tricentis.com/testim/content/running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks.htm) | `0f7a340f1b3068a93faf4d24eaba6919927be1b6524d8caf0f6ff4ff4f73facd` | UD-003: 1 |
| [running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone](https://docs.tricentis.com/testim/content/running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone.htm) | `f00f488bf1c42cf773d29a862c21f7e77c9726bbb294aad7474e59e29c28609c` | UD-008: 1 |
| [salesforce-testing/create-a-salesforce-test](https://docs.tricentis.com/testim/content/salesforce-testing/create-a-salesforce-test/index.htm) | `f40ed1ce4f1569d543d4a27940108b599e16d92b93182549c9076e8a18068dc3` | UD-019: 1 |
| [salesforce-testing/salesforce-steps](https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/index.htm) | `c9d70761442f8ee3a85a3684615f34a4109fdc8aa8ae1213ea11a41e2f9bdb80` | UD-002: 1 |
| [salesforce-testing/salesforce-steps/sfdc-step-create](https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/sfdc-step-create.htm) | `e17ea2b550bb9548b85d25f50131cfdc8244c8bc5fa5fb4af71ad120659d96b0` | UD-001A: 1 |
| [salesforce-testing/salesforce-steps/sfdc-step-edit](https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/sfdc-step-edit.htm) | `df1004a5b9ffe37ae5fbba336a46dc887b90d648c0bed3355c3c52a4568f0ff5` | UD-001B: 1 |
| [salesforce-testing/salesforce-steps/sfdc-step-quickactions](https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/sfdc-step-quickactions.htm) | `d0b2724a97bc758b6d4d72840d0277f90fad4eb53723bfe6c9cd9fce248ad097` | UD-001B: 1 |
| [salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction](https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction.htm) | `ef88179e838b1c3d5f81ec5af7780115e04bac70987b1acbebc0319f5f79c0fb` | UD-001B: 1 |
| [salesforce-testing/salesforce-steps/sfdc-step-validate](https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/sfdc-step-validate.htm) | `cf65b8f283a883144a305652c41ba6b4bde1d4f9ed31f5e4c98eb513af74c8dd` | UD-001A: 1 |
| [salesforce-testing/troubleshoot](https://docs.tricentis.com/testim/content/salesforce-testing/troubleshoot.htm) | `b805135f96569ca54cc8063134196760fb44ac039f61ead6fe956f16f72bb82e` | UD-020: 1 |

## Paydown plan

Owner: Testim JA Docs parity subsystem (existing tracker owner). Every batch has `priority=high`; this is a proposed maintainer work schedule, not an automated reminder or a claim that upstream changes are scheduled. Keep one content/patch paydown PR per sidebar section. The 2026-10-30 checkpoint is for fresh evidence and report-status review, not a new `reviewAfter` deadline.

| Section | Patch IDs | Unique pages | Priority | Next checkpoint |
| --- | --- | --- | --- | --- |
| Salesforce Testing | UD-001A/B, UD-002, UD-019, UD-020 | 8 | high | 2026-10-30 |
| Advanced Editing | UD-005A–F, UD-010B, UD-012, UD-013, UD-017, UD-021 | 8 | high | 2026-10-30 |
| Editing Tests | UD-006, UD-014 | 2 | high | 2026-10-30 |
| Running Tests | UD-003, UD-008, UD-015 | 3 | high | 2026-10-30 |
| Guides | UD-007 | 1 | high | 2026-10-30 |
| Integrations | UD-009, UD-010A/C/D, UD-018A/B/C, UD-022 | 9 | high | 2026-10-30 |
| Administration | UD-016A/B | 1 | high | 2026-10-30 |

At each checkpoint, re-fetch every scoped page, inspect defects, and record the result. Confirm existing vendor ticket references first; none are currently recorded. Vendor contact requires separate authorization. For the ordinary upstream-recovery route, a retirement PR requires a real upstream fix and must follow the shared removal checklist in [the tracker](./UPSTREAM_DEFECTS.md#shared-removal-checklist), including affected parity, regression pins, and the registry-change review gate. Until a safe retirement is established, document the result and retain the patch without extending its date.

A separate local paydown proposal can investigate whether a general extractor or normalizer correction makes a patch redundant while preserving source content and detection sensitivity. `SYSTEM_SPEC.md` permits content, extractor and normalizer fixes; it does not permit moving exceptions into a new suppression lane. Such a proposal must demonstrate correctness with patch-disabled comparisons, affected-page parity, corpus and recall regression tests, and the five zero counters, then satisfy the applicable review gates. The current recovery SOP in `PARITY_GUIDE.md` explicitly requires visual confirmation of an upstream fix before entry deletion; any alternative that changes that contract must be proposed and approved under `CLAUDE.md`'s specification-change policy before deleting entries. This review neither validates a local replacement nor changes that policy.

## Automated issue reconciliation

Only the scheduled event of `.github/workflows/scheduled-actionable.yml` synchronizes managed issues. It refreshes sidebar data, fetches/diffs all snapshots, runs full parity and upstream recovery, and generates a strict summary before issue synchronization. Reports must be full-scope, valid, fresh and linked. Manual workflow dispatch and partial slug/section checks do not synchronize issues.

After reviewed changes reach main, a successful full scheduled run can reconcile #447 and #448. #449 remains open while the 32 overdue patches persist. This review does not claim that local changes, a manual dispatch, or a successful parity check closed any issue.
