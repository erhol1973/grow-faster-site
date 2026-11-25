## Taalscan opgevolgd, 25 november 2026

De dagelijkse taalscan stond op FINDINGS (run 45566881275 op main: 613 nieuwe bevindingen; op d9d9710: 737). LanguageTool kon hier niet lokaal draaien (downloadhost geblokkeerd) en het artifact was niet bereikbaar. De scan schrijft daarom elke nieuwe bevinding leesbaar en als volledig record naar het joblog, met de SHA-256 van de kandidaat-baseline en deel-digests. Alleen rapportage: status, register en drempels zijn ongewijzigd.

- Correctie: de hoofdnavigatie op negen pagina's zonder ux.js had aria-label "Sections". Dat is nu "Hoofdnavigatie" (19 scanlocaties met de doorverwijzingen).
- Unit (tests/nl-editorial.test.cjs): elke gebouwde pagina met hoofdnavigatie heeft "Hoofdnavigatie", of houdt "Sections" alleen als ux.js het vertaalt; ux.js behoudt de Franse vertaling "Navigation principale".
- Unit (tests/nl-audit.test.cjs): logregels tonen regel, blok, gemarkeerde tekst en maximaal drie suggesties op één regel; records bevatten elk veld behalve de context; de bevinding zelf verandert niet.
- De overige 718 bevindingen staan met reden in `language/nl-triage.json` (`review20261125`, geen menselijke goedkeuring). De kandidaat is lokaal herbouwd, byte-identiek aan de CI-kandidaat, en gepromoveerd met `scripts/nl-promote.cjs`.
- Bekend: twee Radar-demoblokken tonen de kloktijd en worden elke run opnieuw gecontroleerd.
- Secrets-gate (scripts/nl-secret-guard.cjs, echte Gitleaks 8.24.3): na de promotie houdt de baseline alleen huidige blokken. De herwerkte catalogus heeft nog één gegenereerde id, onder de entropiedrempel van de generieke regel. De guard kiest de echte publieke id nu ook uit de blok-id's van het append-only bevindingenregister. De acht scenario's (toegelaten regel, zelfde regel elders, gewone sleutel, extra inhoud, checksums) zijn ongewijzigd en slagen lokaal.
