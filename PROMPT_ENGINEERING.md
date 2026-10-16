# Prompt Engineering Techniques

Every prompt in `prompts.js` follows one structure:

1. **Role**: sets expertise and voice ("executive assistant who writes crisp meeting minutes").
2. **Context**: audience, tone, start time, reader level, injected from form fields.
3. **Task**: one clear job per prompt.
4. **Constraints**: word limits, break rules, "only use information in the notes".
5. **Output format**: fixed headings so results are scannable and testable.
6. **Guardrails**: shared block forbidding invented facts, requiring placeholders for missing data, keeping content professional and unbiased.

## Techniques demonstrated
- Role prompting (all features)
- Dynamic context injection (email audience/tone, planner hours, research reader level)
- Structured output (markdown sections)
- Constraint prompting (length, scope, grounding)
- Self-check line (email "Tone check")
- Multi-turn context (chatbot sends the last 10 messages)
- Fail-safe design: API failure falls back to demo engines

## Iteration log
| Version | Problem | Fix |
|---|---|---|
| v1 "Summarize these notes" | Long, unstructured, missed owners | Fixed sections incl. Owner - Task - Deadline |
| v2 | Invented deadlines when none given | Added "use 'No date' if unknown" and grounding rule |
| v3 | Emails too long | Added "Under 150 words, one call to action" |
