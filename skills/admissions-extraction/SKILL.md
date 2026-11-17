---
name: admissions-extraction
description: Research official university admission pages and linked requirements documents, extract scoped facts, verify applicability, and curate the admissions YAML catalogue. Use for source discovery, extraction, verification or catalogue updates; not for deciding an applicant's eligibility or submitting applications.
---

# Admissions extraction

Work on the requested part of the pipeline. Shared evidence rules belong here; read [institution notes](references/institutions.md) only for institutions in scope. The repository's AGENTS.md and the user's current execution permissions control changes, browser access, PRs and merge approval. This skill does not grant external-action permission.

## Find sources

Start at the actual programme page, then follow its admission criteria, intake calendar, international-equivalence tables and linked PDFs. A programme page can link an authoritative document on a separate hosting domain. Record that parent link as provenance; a cloud-storage hostname alone is not evidence of ownership.

For this repository, read docs/YAML-DATA.md and the existing data model before authoring. Programme profiles, annual deadlines, applicant rules and extracted requirements are separate records. A new source must not silently change the university, programme, intake, qualification or applicant category being researched.

## Extract facts

Separate application opening/closing, supporting documents, test scores, interview, decision, acceptance, deposit and enrolment. Teaching start is not an enrolment deadline. Preserve relative instructions, conditional offer windows, local times, working versus calendar days, and pending versus completed results.

Capture qualification/subject requirements and English alternatives separately from deadlines. Do not confuse an earlier school qualification or English exemption with a complete entry qualification. ICSE/IGCSE may require the subsequent pre-university qualification. A published Indian-state-board group can cover multiple states without inventing different criteria for each state; never extend a narrow board rule to all boards.

Paraphrase evidence concisely and keep the original official URL, check date, document update date if supplied, applicability and programme scope. Capture missing sections explicitly rather than describing the extraction as complete.

## Verify applicability

Inspect PDF tables visually before using their row/column intersections as structured criteria. If text is readable but table layout is not verified, retain the source and mark affected entries Needs review. A blocked download does not prove that no requirements exist.

Distinguish a document's update date from its applicable intake and expiry. A document updated in 2026 and still linked by a 2027 programme page is not automatically expired; record the linkage and any unresolved scope. A page explicitly giving instructions for a 2026 examination must not have its dates rolled into 2027.

Keep evidence quality independent for each fact. One verified deadline does not verify all admission conditions; a matched application category does not establish academic eligibility. Preserve conflicts rather than arbitrarily picking a source.

## Curate and publish

Author requirements under data/admission-details and rules under data/applicant-rules. Keep known deadlines available even when personal category matching is incomplete. Missing extracted details should explain the gap and link to the official programme page. Missing applicant inputs should ask for those inputs, not falsely claim extraction failed.

Use the existing source/domain and schema validators. For off-domain institution-linked documents, add narrow provenance support rather than allowing arbitrary storage domains. Keep incomplete data partial and absent dates null. Do not add APIs, live collection jobs or user-data transmission unless requested.

Regenerate JSON with npm run build, run relevant tests, review source and generated changes together, and provide a reachable preview plus manual tests before any merge. Restart the owned preview server after its asset allowlist changes; check all imported modules return 200 and source YAML is not served. Report browser verification separately from unit/HTTP checks.

Stop research at the requested scope or when sources are blocked/exhausted. Record the remaining gap and its official link; do not keep guessing or claim exhaustive extraction. A future update can address the documented gap.
