---
name: codex-review
description: |
  Use OpenAI's Codex CLI for code review, design consultation, bug investigation, and copy review.
  Brings a second AI perspective to complement Claude's own analysis for more thorough coverage.
  Triggers: "codex", "ask codex", "consult codex", "code review", "review this code",
  "second opinion", "another perspective", "get another AI's take", "analyze with codex",
  "design consultation", "investigate bug", "refactoring suggestions", "UI/UX review"
  Use cases: Any time the user wants OpenAI Codex's perspective on code or technical decisions.
  Specifically: (1) code review & quality analysis, (2) bug investigation & root cause analysis,
  (3) architecture & design consultation, (4) refactoring proposals, (5) UI/UX design evaluation,
  (6) copy & messaging review, (7) technical problem investigation.
  Even if the user phrases it vaguely like "take a look at this code" or "what do you think of this
  implementation", consider using this skill whenever the request involves code-related consultation.
---

# Codex CLI Skill

Run code reviews and technical analyses non-interactively via OpenAI's Codex CLI.
The goal is to complement Claude's own analysis with a different model's perspective — different
models catch different things, so "two sets of eyes" improves review coverage.

## Prerequisites Check

Always verify the following before attempting to run Codex:

```bash
# 1. Is Codex CLI installed?
which codex || echo "NOT_INSTALLED"

# 2. Is authentication configured?
# Requires either CODEX_API_KEY env var or prior `codex login`
```

**If Codex CLI is not installed**:
Tell the user: "Codex CLI is not installed in this environment. You can install it with
`npm i -g @openai/codex`, or I can help with an alternative approach."
Do not attempt to force execution.

**If authentication fails**:
Guide the user through authentication. In non-interactive environments, the `CODEX_API_KEY`
environment variable must be set.

## Command Syntax

Codex CLI requires global flags (sandbox, approval policy, model) to be placed **before** the
`exec` subcommand. Getting this order wrong causes silent failures or unexpected behavior.

### Basic Form (Read-Only Analysis)

```bash
codex -s read-only exec -C <project_directory> "<prompt>"
```

### Flag Reference

| Flag | Position | Purpose |
|------|----------|---------|
| `-s read-only` | Global (before `exec`) | Sets sandbox to read-only. Use this for analysis and review — it prevents accidental modifications to project files. |
| `-C <dir>` | `exec` flag | Sets the working root directory (equivalent to `--cd`) |
| `--json` | `exec` flag | Outputs JSONL event stream. Use when you need to parse results programmatically. |
| `-o <file>` | `exec` flag | Writes the final output to a file. Useful for long analysis results that need post-processing. |
| `--model <model>` | Global | Specifies which model to use. Default is gpt-5.4 (recommended for most tasks). |
| `--skip-git-repo-check` | `exec` flag | Allows execution outside a Git repository. |

### When Code Modifications Are Needed

```bash
codex --full-auto exec -C <project_directory> "<prompt>"
```

`--full-auto` enables a workspace-writable sandbox. Only use this when you actually want Codex
to modify files. For pure analysis and review, `-s read-only` is sufficient and safer.

## Prompt Construction

### Template

Build every Codex prompt using this structure:

```
[Role assignment (if needed)]
[Request details]
[Scope or evaluation criteria (if applicable)]

No confirmation or questions needed. Provide concrete suggestions, fixes, and code examples proactively.
```

The closing instruction **must always be appended**. Without it, Codex tends to ask clarifying
questions or stop short of actionable output, which defeats the purpose of non-interactive execution.

### Principles for Effective Prompts

- **Define a specific scope**: "Review the auth module's error handling" produces far better results than "Review everything"
- **Specify evaluation criteria**: Security, performance, maintainability — tell Codex what matters most
- **Provide context**: Background like "This is a Next.js + TypeScript SaaS application" significantly improves accuracy

## Command Examples by Use Case

### Code Review
```bash
codex -s read-only exec -C /path/to/project \
  "Review this project's code. Focus on security risks, performance bottlenecks, and maintainability issues. No confirmation or questions needed. Provide concrete fixes with code examples proactively."
```

### Bug Investigation
```bash
codex -s read-only exec -C /path/to/project \
  "Investigate the 500 error that occurs after session timeout in the authentication flow. Identify the relevant files and analyze the root cause. No confirmation or questions needed. Provide the root cause and concrete fixes proactively."
```

### Architecture Analysis
```bash
codex -s read-only exec -C /path/to/project \
  "Analyze this project's architecture. Evaluate dependency structure, separation of concerns, and scalability. No confirmation or questions needed. Provide improvement proposals proactively."
```

### UI/UX Design Review
```bash
codex -s read-only exec -C /path/to/project \
  "Evaluate this project's UI from a designer's perspective. Analyze visual hierarchy, spacing rhythm, color contrast and accessibility, interaction consistency, and cognitive load. No confirmation or questions needed. Provide concrete improvements with code examples proactively."
```

### Save Output to File (for lengthy analyses)
```bash
codex -s read-only exec -C /path/to/project \
  -o /tmp/codex-review.md \
  "Comprehensively analyze the technical debt in this project. No confirmation or questions needed. Provide a prioritized refactoring plan proactively."
```

### Resume Session (follow-up questions or deeper analysis)
```bash
codex exec resume --last \
  "Regarding the auth module issue from the previous analysis, provide a more detailed fix. No confirmation or questions needed."
```

## Execution Steps

1. **Check prerequisites**: Run `which codex` to verify installation. If not found, inform the user and stop.
2. **Identify the target directory**: Confirm the path specified by the user, or locate uploaded files.
3. **Construct the prompt**: Combine the user's request + relevant evaluation criteria + the mandatory closing instruction for proactive output.
4. **Execute the command**: Use `-s read-only` for analysis-only tasks, `--full-auto` when modifications are needed.
5. **Report results with synthesis**: Summarize Codex's output and add Claude's own perspective.

Step 5 is critical: don't just relay Codex's output verbatim. Synthesize the two perspectives —
e.g., "Codex flagged X, and I agree because... However, I'd also add that..." This integration
of viewpoints is the core value of using this skill.

## Troubleshooting

| Symptom | Cause & Resolution |
|---------|--------------------|
| `codex: command not found` | Not installed. Guide user to run `npm i -g @openai/codex` |
| Authentication error | `CODEX_API_KEY` not set. Guide user to configure the environment variable |
| Timeout | Project may be too large. Narrow the prompt scope to specific modules or files |
| Git repository error | Codex expects to run inside a Git repo. Add `--skip-git-repo-check` or run `git init` in the target directory |
