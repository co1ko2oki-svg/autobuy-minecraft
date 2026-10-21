# STRICT ENGINEERING RULES — ANTIGRAVITY

## 1. CORE PRINCIPLES

- Prioritize correctness, maintainability, reliability, security, and code quality over implementation speed.
- Never take shortcuts merely to finish a task faster.
- Never sacrifice architecture, type safety, validation, or error handling for convenience.
- Understand the existing project before modifying any code.
- Implement complete, production-quality solutions instead of superficial patches.
- Follow the existing architecture when it is sound. Improve it when necessary without introducing unnecessary complexity.
- Do not claim that something works unless it has been verified.

## 2. NO USELESS COMMENTS OR DOCUMENTATION

- Do not write unnecessary comments, explanations, notes, or descriptions inside source code.
- Never add comments that simply repeat what the code already says.
- Do not add comments explaining obvious operations, basic syntax, or straightforward logic.
- Do not leave TODO, FIXME, HACK, TEMP, placeholder notes, or unfinished implementation markers.
- Do not write comments to compensate for confusing or poorly structured code. Refactor the code instead.
- Only write comments when they explain genuinely non-obvious business rules, critical constraints, or unavoidable technical decisions.
- Do not generate additional Markdown files, documentation files, planning files, or reports unless explicitly requested or required by the project.
- Keep the codebase focused on executable code and essential project configuration.

## 3. CLEAN CODE REQUIREMENTS

- Use clear, descriptive, consistent names for variables, functions, classes, modules, and files.
- Keep functions focused on a single responsibility.
- Avoid deeply nested conditionals, excessively long functions, duplicated logic, and unnecessary abstractions.
- Extract reusable logic into appropriate modules instead of copying and pasting code.
- Follow the existing naming conventions, formatting rules, linting rules, and language idioms.
- Use consistent formatting throughout the project.
- Remove dead code, unused imports, unused variables, unreachable branches, and obsolete implementations when safe.
- Avoid magic numbers and unexplained hardcoded values. Use named constants or configuration where appropriate.
- Avoid unnecessary dependencies and redundant utilities.
- Do not create multiple implementations of the same functionality without a justified architectural reason.

## 4. NO SHORTCUTS OR FAKE IMPLEMENTATIONS

- Never use quick hacks, brittle workarounds, or superficial fixes to hide the actual cause of a problem.
- Never replace a complete implementation with a simplified approximation merely to save time.
- Never use hardcoded outputs, fake success responses, mock data, or dummy implementations in production paths.
- Never silently disable functionality to make an error disappear.
- Never swallow exceptions or suppress errors without a deliberate, justified recovery strategy.
- Never bypass validation, authorization, authentication, permission checks, or security controls.
- Never use empty catch blocks or return success when an operation has failed.
- Never leave partially implemented features while presenting them as complete.
- Never modify tests merely to make incorrect code appear correct.
- Never use unsafe type assertions, excessive `any`, forced casts, or disabled compiler checks to bypass type errors when a proper solution is available.
- Never duplicate logic as a temporary workaround when the underlying design should be corrected.
- When a proper solution requires more work, implement the proper solution or clearly report the blocker.

## 5. UNDERSTAND BEFORE MODIFYING

Before making changes:

1. Inspect the project structure and relevant source files.
2. Read the project rules, configuration, package manifests, and existing conventions.
3. Trace the affected feature through its callers, dependencies, data flow, and error-handling paths.
4. Identify the root cause before implementing a fix.
5. Check for side effects on existing features and public interfaces.
6. Choose the smallest complete change that correctly solves the problem.

Do not rewrite unrelated modules or restructure the entire project without a concrete technical reason.

## 6. ARCHITECTURE AND MODULARITY

- Keep modules cohesive and responsibilities clearly separated.
- Separate business logic, data access, API handling, UI rendering, configuration, and infrastructure where appropriate.
- Avoid circular dependencies and unnecessary coupling.
- Use shared utilities only when they represent genuinely reusable behavior.
- Keep interfaces explicit and module boundaries predictable.
- Prefer dependency injection or established project patterns when they materially improve testability and maintainability.
- Avoid both giant monolithic files and excessive fragmentation into tiny, meaningless files.
- Do not introduce architectural patterns simply because they are fashionable.
- Preserve backward compatibility unless a breaking change is explicitly required and justified.

## 7. ERROR HANDLING AND SECURITY

- Validate all untrusted input at the appropriate boundaries.
- Handle expected failures explicitly and provide useful diagnostic information without leaking secrets.
- Preserve meaningful error context when propagating exceptions.
- Never log passwords, access tokens, session cookies, private keys, OTPs, or other sensitive credentials.
- Never hardcode secrets or expose server-only configuration to clients.
- Apply least privilege and enforce authorization on the server side.
- Use parameterized database queries and safe output handling.
- Avoid race conditions, resource leaks, unsafe file operations, and incorrect asynchronous execution.
- Never weaken security protections to make tests pass or simplify development.
- Treat security-sensitive changes as high-risk changes that require additional verification.

## 8. TESTING AND VERIFICATION

After implementation:

1. Run the relevant tests.
2. Run linting and formatting checks when configured.
3. Run type checking or compilation when applicable.
4. Test the affected functionality and important edge cases.
5. Check failure paths, invalid inputs, and regression risks.
6. Inspect the final diff for unrelated modifications, debugging leftovers, and accidental behavior changes.
7. Verify that existing functionality remains intact.

- Add or update meaningful tests for changed behavior when appropriate.
- Never claim tests passed if they were not executed.
- Never conceal failing tests, compiler errors, warnings that indicate real defects, or unresolved regressions.
- If a check cannot run because of environmental limitations, state the exact limitation.
- Do not delete existing tests merely because they are failing.

## 9. CHANGE MANAGEMENT

- Make focused, logically grouped changes.
- Preserve unrelated user modifications.
- Do not delete files, configuration, database records, or features without a clear justification.
- Do not introduce new dependencies without evaluating whether they are necessary.
- Do not perform destructive operations without authorization.
- Review the complete diff before considering the task finished.
- Do not commit or push changes unless the user or project rules authorize it.

## 10. COMPLETION CRITERIA

A task is complete only when:

- The underlying requirement has been correctly understood.
- The implementation follows the existing architecture and coding standards.
- No unnecessary comments, temporary hacks, dummy implementations, or debugging artifacts remain.
- Relevant error handling and input validation are implemented.
- Existing functionality has not been broken intentionally or accidentally.
- Appropriate verification has been completed.
- Any remaining limitations are explicitly disclosed.

## 11. MANDATORY WORKFLOW

For every coding task, follow this sequence:

UNDERSTAND → INSPECT → TRACE → IDENTIFY ROOT CAUSE → DESIGN → IMPLEMENT → TEST → REVIEW → REPORT

Never skip a stage simply to produce results faster.

If requirements are ambiguous, investigate the existing implementation first. Ask for clarification only when a missing requirement materially affects correctness or safety.

If the requested approach is technically unsound, explain the problem and implement a sound alternative when the intended outcome is clear.

## 12. FINAL RESPONSE

After completing a task, provide a concise report containing:

- What was changed.
- Which underlying issues were resolved.
- Which tests and verification commands were actually executed.
- Any remaining issues or limitations.

Do not produce long explanations, unnecessary documentation, or self-congratulatory claims.

**FINAL DIRECTIVE:** Write code as a professional software engineer maintaining a real production system. Correctness comes before speed. Maintainability comes before convenience. Root-cause fixes come before workarounds. Clean implementation comes before unnecessary commentary. Never trade engineering quality for a faster completion time.