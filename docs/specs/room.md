# Specification: The Room

**Track:** Modern Healthcare Outcomes. **Status:** finalist; not selected. **User:** a Black pregnant or postpartum patient with an optional chosen supporter, preparing for a routine visit.

**Promise:** practice one patient-chosen communication goal and preserve the words the patient wants to bring to the visit.

## Functional requirements

- RM-1: Offer three goals: clarify the next step, finish my point, or ask for plain language.
- RM-2: Preserve original words separately from chosen wording. Let the patient skip practice, pause, retry, and select a preferred question.
- RM-3: Offer a short deterministic practice tree with neutral prompts and no clinical interpretation.
- RM-4: Record whether and how a supporter may help; the patient controls the agreement.
- RM-5: Export a visit card containing the original concern, selected goal, preferred question, and supporter agreement. Unanswered clinical questions remain unanswered.

## Acceptance criteria

- AC-RM-1: Given original words and a chosen goal, when a retry is selected, then original words remain intact and the patient can choose a new version.
- AC-RM-2: Given a supporter choice, when it changes, then the card reflects the new agreement without assigning the supporter control of the patient's answers.
- AC-RM-3: Given practice is skipped, when the card is opened, then the patient's original concern and selected question remain usable.
- AC-RM-4: Given no actual clinical answer, when the card is exported, then it asks the real care team rather than inventing a next step.
- AC-RM-5: Given any practice response, when the flow advances, then no accent, confidence, emotion, or good-patient score is issued.

## Data and integrations

Two fictional routine-visit scenarios, small prompt tree, original/chosen text, goal, supporter preference, and local card export. No model or medical-record integration is required for the core workflow.

## Edge cases and constraints

Empty response, change of goal after practice, stopping mid-flow, supporter removed, user choosing original wording, and skipped practice. Avoid promises of improved health or clinician behavior without evidence. This is optional communication practice and agenda preparation.

## First gate, output, and cuts

Prove goal → practice/retry → chosen words → card. The judge chooses a goal or retry. Cut clinician avatars, clinical advice, risk scoring, unrestricted AI dialogue, recording real visits, accounts, and voice until the core is finished.
