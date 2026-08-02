# HOVA Repository Execution Rules

## Standing delegation

When HOVA approves a goal, task, issue, route, or outcome, that approval covers the complete reversible repository workflow required to deliver it.

Authorized executors must continue autonomously through inspection, planning, scoped implementation, tests, fixes, commits, feature-branch pushes, pull-request creation and maintenance, review corrections, ready-for-review transition, and low-risk merge when all required checks are green.

Do not ask HOVA to relay routine steps such as creating a branch, committing, pushing, updating a PR description, re-running CI, marking a PR ready, or clicking merge.

## Low-risk merge rule

An executor may merge when the final diff remains inside the approved outcome, required checks pass, no blocking review remains, no secrets or protected data are added, no red-line action is involved, and the change is reversible through an ordinary revert.

## Fresh approval is required only for red-line actions

- production deployment, promotion, or public launch;
- DNS, domains, certificates, or public routing;
- secrets, credentials, or production environment variables;
- real customer, employee, partner, or protected personal data;
- payments, purchases, contracts, or financial commitments;
- release of legal text, regulated advice, or external claims as approved truth;
- destructive database actions, irreversible migrations, or canonical-data deletion;
- force push, history rewrite, or bypassing branch protection;
- weakening authentication, authorization, privacy, security, or production guards;
- material product-direction or architecture changes outside the approved outcome.

## Blocker handling

Continue all other safe work, aggregate genuine blockers, and present one decision packet. Do not create a chain of micro-approval requests.

## Authority

This repository follows the HOVA Autonomous Execution Policy v1.0 maintained in `hovhsolutions-coder/MastersandProfessors`. It supersedes older operational instructions requiring separate approval for every commit, push, PR transition, or low-risk merge. Production and public-release safeguards remain in force.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
