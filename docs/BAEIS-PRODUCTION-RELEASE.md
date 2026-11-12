# BAEIS production integration — 12 November 2026

The user explicitly authorized production publication of the reviewed BAEIS version. This release starts from current main 2f4b1238d5ec5337c8e4d7970c9968edf62a940a and brings over only the BAEIS files from approved source b81efefb910bce6fb746a22aff858ce1d633db67 (dev PR #73). The old stacked dev branches are not merged wholesale: newer CMS, Dutch-audit, page, dependency, security and workflow changes on main are retained.

## Public behavior

The approved route remains `/baies-dev/`, with NL/FR, the four-sprint demonstration, complete source-linked records, executive role/context proposals, local brief download and blocked external publication. Hosting on the production domain does not turn fixed reference data into a live feed or provide real agents, independent scientific verification, newsletter delivery or real publishing. Existing prototype/noindex labels and constraints remain explicit. No new production navigation, shared CSS, CMS records or HubSpot actions are introduced.

All eleven runtime HTML/JS/CSS/logo/favicon assets remain byte-identical to approved source b81efef. Main's build file adds only the BAEIS HTML route; its existing asset walk includes the additional BAEIS assets. All other pre-existing production source files remain on main's version. BAEIS tests, dedicated five-profile/axe/load/performance checks and historical scoped design notes are included for lasting coverage. A new HTTP integration case confirms the built route, assets and non-public test/report paths using main's server.

## Release controls

Preserve main's locked package manager, dependencies, CMS-test server mode, browser matrix, security/secret policies, daily read-only language audit and protected-main release workflow. No quality threshold, retry rule, skip, scanner exception, branch protection or release switch is weakened.

Open one production PR against main. Before merging, require the three protected checks plus the dedicated BAEIS gate to be successful on the exact release head/merge tree. If main changes, update the integration and rerun checks. Merge through the normal protected PR API, without an admin override or direct main push. Use a Cloudflare skip marker on source and merge messages so the production origin remains the existing gated GitHub Pages artifact workflow; no Cloudflare account or DNS configuration changes.

After merge, monitor main's full quality/security/secret checks, tested-artifact deployment and public release verification. Compare the published BAEIS asset hashes and run limited read-only NL/FR smoke, role/context/search/export/governance checks. General production smoke and the existing single public speed observation remain enabled. No live load or intrusive scan; no CMS/CRM writes.

Retain source/merge/deployment identifiers, hashes and reports outside the published artifact in output/baeis-production. The local Windows CPU/OneDrive measurement limitations and physical-device/actual screen-reader limitations from the dev phase remain explicit. Human profile feedback was simulated, not genuine user research. Production authorization is already given; no second confirmation is needed for the tested release.
