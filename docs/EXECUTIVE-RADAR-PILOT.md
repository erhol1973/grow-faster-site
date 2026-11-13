# Current CEO pilot: sponsor review contract

One curated, source-checked edition dated 13 November 2026 for CEOs of Belgian mid-sized companies. Small and large contexts are labelled editorial scenarios, not survey findings or impersonations. At most three signals; no filler. Current development window: 14 October–13 November 2026; distinguish older structural background from new events. If timely verified material is unavailable, say so rather than invent freshness.

Each signal separates source facts, editorial business implications, a concrete decision/action and uncertainty. Sources have publisher, publication date, exact URL and checked date. Research triangulates Belgian CEO priorities and reports sample/population limits. No claim of measured CEO usefulness without actual users.

Delivery: NL/FR current edition, sources, per-signal five-criterion editorial assessment, contextual challenge, five-minute core brief, download, accessible responsive UI, explicit edition/review dates and visible overdue state. Existing reference-data tools remain clearly marked background demonstrations; do not silently present old statistics or governance simulations as current output. No live autonomous feed, newsletter/account/backend claims.

Ownership: Grow Faster editorial responsibility is proposed for sponsor confirmation; automated agents cannot supply human editorial sign-off. Version-controlled update/correction workflow, stale marking and rollback instructions form the operating handover. No promise of scheduled unattended updating before it exists.

Definition of Done for sponsor review: substantive edition and evidence researched and independently checked; NL/FR parity; all unchanged release gates green; isolated dev preview verified; production unchanged; exact PR/source/preview and outstanding human checks documented. Sponsor content acceptance and explicit production go/no-go remain OPEN and mandatory. No merge/auto-merge or production deploy until that later decision.

Data contract: assets/executive-radar-edition.js exposes GF_RADAR_EDITION (browser) / module.exports (Node). Metadata: id, asOf, reviewDue, periodStart, audience{nl,fr}, editorialMode, owner, sources[], priorityResearch[], signals[]. Sources: id,url,publisher,publishedOn,checkedOn,title,scope,locator,supports. Signals: id,title{nl,fr},changed{nl,fr},impact{nl,fr},decision{nl,fr},nextStep{nl,fr},uncertainty{nl,fr},action(act|investigate|watch),sourceIds[],scorecard{relevance,belgium,decision,evidence,brevity} (1–5 editorial estimates),contexts{small:{nl,fr},medium:{nl,fr},large:{nl,fr}},freshness(current|background). A signal can use an older primary source only when labelled background; no implied new event. Source publication dates cannot be invented; distinguish observation/report year from publication date. Schema refinements require direct coordination between research and radar.

## Operating handover and release hold

- Editorial mode is a manually maintained pilot. No scheduler, autonomous feed, mailing list, subscription, external write or live ingestion is implemented or implied.
- Proposed responsible organisation: Grow Faster editorial, with the executive sponsor as accountable content/release approver for this first edition. This is a proposal awaiting sponsor acceptance, not an invented appointment of another person.
- Before the next review date: verify each primary source for revisions, repeat the Belgian-priority/sector challenge, retain a brief evidence trail and update the edition date only after substantive verification. Empty fields, unsupported facts and future dates block edition availability.
- Corrections: edit the version-controlled source record, record why/date/affected claims in the research document, bump changed asset versions, independently review, rerun all release checks, show the corrected dev edition and seek sponsor release decision. Do not silently change an observed fact into an interpretation.
- Overdue: once the review date is reached, UI and exports must show that review is required. Keeping a page online is not evidence that it remains current. Before any production go after that date, recheck sources and present the updated revision in dev.
- Rollback: restore the prior accepted edition through a new protected PR and the same tests; no direct main push or admin bypass. The prior production commit is 1dc94c52ad7175999bce141bcc1b21deedc3bcac.
- Release hold: draft PR remains unmerged; do not enable auto-merge. Current sponsor approval state is OPEN. The acceptance packet must identify exact source commit/tree, preview, checked sources, editorial scorecard, independent challenge, all test results, known limitations and a concrete go/no-go request. A Go accepts only the reviewed revision unless the sponsor explicitly says otherwise.

## Evaluation before seeing scores

Use the five criteria agreed in conversation: relevance, Belgian meaning, decision usefulness, evidence quality and brevity. Each is an editorial 1–5 estimate with rationale, not a measured CEO preference or empirical usefulness score. Prefer at least 4 on each; a low evidence score cannot be compensated by a high total. Unverified core facts or an invented date block inclusion regardless of score. If fewer than three signals meet the bar, publish fewer. All source population limits remain visible.

Primary target assumed from the agreed proposal: CEOs of Belgian mid-sized companies. Small/large contexts and industry/service/regulated scenarios are editorial challenges; no impersonations of named CEOs, no simulated feedback counted as real user research. The sponsor may redirect this target during dev acceptance.
