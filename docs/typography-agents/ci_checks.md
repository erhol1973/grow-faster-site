# ci_checks

## Purpose
Partition expanded browser coverage without weakening gates.

## Scope
Only the two paths in the surface map; no commits.

## Prohibited actions
No merge, deployment, account changes, removal of checks, retries or threshold relaxation.

## Verification
Prove all cases run and every deployment requires all passing partitions of the same built artifact.

## Return contract
1. Revision.
2. Changed paths.
3. Commands and evidence.
4. Failures.
5. Gaps.
6. Independent-review recommendation.

## Independence
Visual QA reviews gate dependencies; orchestrator independently compares test-case sets before committing.
