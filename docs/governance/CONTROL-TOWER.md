# Grow Faster — Control Tower (werkwijzer)

**Status:** governance- en navigatiepunt; niet de live data zelf.  
**Gecontroleerde momentopname:** 21 november 2026. Ververs feiten steeds bij de originele bron.

## 1. Start hier

| Onderdeel | Gezaghebbende bron | Volgende vraag |
|---|---|---|
| Investeringscriterium | [CPO-criteria](CPO-PRODUCT-INVESTMENT-CRITERIA.md) | Waarom beter/sneller/goedkoper dan bestaand? |
| Beslissingen | [Beslissingenregister](DECISION-REGISTER.md) | Wat is expliciet door sponsor beslist? |
| Rollen en release | [Operating Model](OPERATING-MODEL.md) | Wie mag wat? Is er sponsor-GO nodig? |
| Websitewerk | [Open PR's](https://github.com/erhol1973/grow-faster-site/pulls), [Issues](https://github.com/erhol1973/grow-faster-site/issues), [Actions](https://github.com/erhol1973/grow-faster-site/actions) | Wat staat echt open en welke gates zijn groen? |
| Website-releases | [Releasebeleid](../RELEASE.md), [Testplan](../TESTPLAN.md) | Is bewijs op actuele HEAD aanwezig? |
| Orion | [Orion CLAUDE.md](https://github.com/erhol1973/vragenlijst-assistent/blob/main/CLAUDE.md), [artifacten-index](https://github.com/erhol1973/vragenlijst-assistent/blob/main/docs/artifacten-index.md) | Is Poort 0 gehaald? |
| Chatcatalogus | Claude-projecten GROW FASTER en ORION; de vroegere ChatGPT-projecten en inventarisexport als historisch archief | Welke chat heeft welke rol? |
| Automatiseringen | GitHub Actions-workflows in dit repository en het Magazine-redactieproces (Claude-project GROW FASTER) | Bestaat er een dubbele/stale check? |

Een spreadsheet of rapport is altijd een gedateerde afleiding. Schrijf GitHub-/Orion-gegevens niet handmatig terug naar een tweede statusregister alsof dat live is.

## 2. Werkstromen en eigenaarrollen (CPO-toewijzing, geen claim van actieve agent-uitvoering)

| Prioriteit | Werkstroom | Verantwoordelijke rol | Eerstvolgende aantoonbare deliverable | Gate |
|---|---|---|---|---|
| Actief A | Orion — Poort 0 | Orion Product Owner; sponsor voor interviews en poort | 10–15 interviews; minimaal 5 geanonimiseerde echte lijsten; 2 pilotintenties; portaalpercentage; jurist en QA-nazicht in parallel | Orion Poort 0, volgens eigen register |
| Actief B | Website — operationele kwaliteit | Website Release Owner / QA Lead | Geprioriteerde blockers en actuele end-to-end releasebewijzen voor bestaande PR's | Groen CI + sponsor-GO vóór productie |
| Beperkt | CMS gereedheid | CMS PO | Nog ontbrekende live acceptatie aantonen; geen herhaling van historische PR #57 als open werk | Productieacceptatie |
| Gesloten | Ledenlogin | Member Access PO | [PR #76](https://github.com/erhol1973/grow-faster-site/pull/76) is gesloten zonder merge; heropenen vraagt een nieuwe productgate | Onafhankelijke QA + sponsoracceptatie |
| Gesloten | Website typografie | Design Lead / QA | [PR #79](https://github.com/erhol1973/grow-faster-site/pull/79) gesloten op 2026-11-25: verouderd en probleem opgelost; koppengroottes gelijktrekken wordt een nieuwe kleine PR op vraag van de sponsor | Frontend/visuele gates |
| Gesloten | Website-/kwaliteitsintegratie | Solution Architect / QA | [PR #82](https://github.com/erhol1973/grow-faster-site/pull/82) is gesloten zonder merge | Sponsor indien productwijziging |
| Geparkeerd tot besluit | BAEIS / Executive prototypes | CPO | Open drafts stuk voor stuk op strategische relevantie beoordelen | Nieuwe productgate |
| Actief | Grow Faster Magazine | Editorial PO (CPO) | Maandelijkse editie op journal.html volgens het redactieproces (Claude-project GROW FASTER, doc `magazine-redactieproces`); editie 1 live sinds 2026-11-24, editie 2 in research | Sponsorpoorten: onderwerp, tekst, release |
| Redactioneel onderhoud | Radar / Brief | Editorial PO | Bestaande edities, kwaliteitsbevindingen, niet-vrijgegeven previews beheren | Inhoudelijke en productie-GO |

Deze eigenaars zijn **rollen**, geen toegewezen individuele medewerkers of lopende agentprocessen.

## 3. Triageconventies

**Werkstatus:** Intake, Backlog, Ready, In Progress, Blocked, Review, Done, Parked, Superseded.  
**Beslissingsstatus:** Proposed, Sponsor Approved, Rejected, Superseded.  
**Bewijsstatus:** Verified on current commit, Historical, Assumed, Unknown.

Per taak: eigenaar, volgende actie, primaire URL, blocker, gate en laatste verificatiedatum. Is de bron niet toegankelijk, status **Unknown**; niet gokken.

## 4. Duplicatiepreventie

Voor nieuwe taken:
1. Zoek eerst in GitHub Issues/PR's én de bestaande chatcatalogus.
2. Hergebruik het bestaande werkitem waar mogelijk.
3. Wijs precies één eigenaar toe. Overlap in bestanden? Stop en herschik de schrijfoppervlakken.
4. Nieuwe strategische scope? CPO-criteria vóór WSJF; laat sponsor beslissen.
5. Hanteer maximaal twee grote actieve werkstromen.
6. Resultaat en bewijs komen in de oorspronkelijke PR/issue; deze pagina bevat alleen links.

## 5. Reviewritme en efficiëntiemeting

**Wekelijks CPO-overzicht:** nieuwe/open/afgeronde PR's, nieuwe sponsorbesluiten, actief WIP, geblokkeerde taken, dubbele werkitems, noodzaak voor sponsorbesluit. Geen releaseautorisatie op basis van de rapportage zelf.

**KPI's:** aantal ongecoördineerde dubbele taken, aandeel werkitems met één eigenaar, WIP-overschrijding, ouderdom van open PR's, eerste-keer acceptatie en tijd van Ready tot Done. Leg nulmetingen vast vóór claims over gerealiseerde efficiëntiewinst.

**Beveiliging:** geen klantdata, sleutels of privé-documentinhoud in publieke GitHub-issues of dit document. Orion is een private repository; publieke Grow Faster-documenten bevatten alleen veilige links en procesinformatie.

## 6. Bekende verificatiepunten bij opzet (niet als actuele status gebruiken)

- [PR #57](https://github.com/erhol1973/grow-faster-site/pull/57) was gemerged op 11 november 2026; CMS-productieacceptatie is daarvan te onderscheiden.
- [PR #76](https://github.com/erhol1973/grow-faster-site/pull/76), [#78](https://github.com/erhol1973/grow-faster-site/pull/78), [#79](https://github.com/erhol1973/grow-faster-site/pull/79), [#82](https://github.com/erhol1973/grow-faster-site/pull/82) waren op 21 november nog open draft.
- Orion heeft de bestaande bouwstop tot zijn eigen Poort 0. Geen nieuwe functies zonder die poort.
- **Geen merge naar main wanneer dit automatisch publiceert zonder een afzonderlijke expliciete sponsor-GO.**
