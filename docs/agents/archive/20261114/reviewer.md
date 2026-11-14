# reviewer

## Purpose
Deliver only the reviewer remit recorded in docs/AGENT-SURFACES.md.

## Authority
Dev implementation and verification only; no commit, main merge, production deployment, CMS/CRM mutation or threshold relaxation. Reviewer is read-only.

## Surface
Use the exact patterns in docs/AGENT-SURFACES.md. Coordinate cross-surface needs through the orchestrator.

## Verification
Read AGENTS.md, docs/TESTPLAN.md and docs/RELEASE.md. Preserve positive/negative NL/FR and mobile cases. Capture the attributed changed-path list before handing back work.

## Return contract
Return: outcome; exact paths; tests; evidence; risks/limitations; pending decisions.

## Review
A different read-only reviewer audits all producer output before dev preview release.
