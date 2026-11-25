# Grow Faster — Beslissingenregister

**Status:** append-only register; nooit historische beslissingen stilzwijgend verwijderen of herschrijven.  
**Scope:** beslissingen voor Grow Faster-website en productportfolio. Orion heeft een eigen ADR-register en beslissingenlogboek.

Een vermelding betekent dat de beslissing als zodanig is teruggevonden. Waar de volledige oorspronkelijke tekst nog niet in de repository is opgenomen, is die beperking expliciet vermeld. Nieuwe besluiten krijgen de volgende vrije ID; gewijzigde richting wordt als nieuw besluit met verwijzing naar het eerdere vastgelegd.

| ID | Datum | Beslisser | Beslissing | Toepassing / bron | Zekerheid |
|---|---|---|---|---|---|
| GF-001 | 2026-11-18 | Executive Sponsor | Website Architecture & Content Blueprint v1.0 goedgekeurd als ontwerpbaseline: praktische administratieve vereenvoudiging en operationele verbetering, eerste segment 10–49 medewerkers in Oost- en West-Vlaanderen, probleemgerichte NL/FR-site; Enterprise Coherence als onderliggende methode. | Vastgelegd in de Grow Faster-projectconversatie; volledige goedgekeurde blueprinttekst moet nog als primaire bron worden gekoppeld. | Goedkeuring bevestigd; volledige brontekst niet in repo geverifieerd |
| GF-002 | 2026-11-21 | Executive Sponsor | Product-first (optie A) gekozen; eerst één concreet klantprobleem oplossen en valideren, Orion als eerste productkandidaat. | Grow Faster CPO-projectconversatie | Bevestigd |
| GF-003 | 2026-11-21 | Executive Sponsor | Bindende CPO-investeringsvoorwaarde: eerst aantonen waarom Grow Faster een probleem beter, sneller en tegen lagere totale klantkost oplost dan de beste bestaande oplossing; platformvergelijking vóór WSJF. | [CPO-productcriterium](CPO-PRODUCT-INVESTMENT-CRITERIA.md) en Grow Faster CPO-projectconversatie | Bevestigd |
| GF-004 | 2026-11-21 | Executive Sponsor | CPO mag uitvoering coördineren en gecontroleerde PR-merges uitvoeren. Productierelease vereist altijd afzonderlijke, expliciete GO van Executive Sponsor; een merge die automatisch deployt is zelf productie-gated. | [Operating Model](OPERATING-MODEL.md) en Grow Faster CPO-projectconversatie | Bevestigd |
| GF-005 | 2026-11-21 | Executive Sponsor | CPO voert de governanceconsolidatie en orkestratie uit om duplicatie, verspilling en versnippering te verminderen. | Grow Faster CPO-projectconversatie | Bevestigd |
| GF-006 | 2026-11-24 | Executive Sponsor | Grow Faster Magazine is een actieve maandelijkse werkstroom: elke editie leest als flipboek op journal.html (acht pagina's, NL/FR, eigen code) en volgt het redactieproces met zeven stappen en drie sponsorpoorten (onderwerp, tekst, release). Editie 1 "Overtypen, de verspilling die niemand ziet" vrijgegeven (PR #107, #108). | Claude-project GROW FASTER, doc `magazine-redactieproces`; [TESTPLAN.md](../TESTPLAN.md) | Bevestigd |
| GF-007 | 2026-11-24 | Executive Sponsor | Homepage: hero-video, vier toepassingskaarten (Orion eerst), geen "Herkenbaar?" en geen "Zo werkt Orion"; stappen en Orion-film staan op orion.html. Veiligheid-pagina blijft offline tot de beweringen geverifieerd zijn. | PR #104, #105, #110; [TESTPLAN.md](../TESTPLAN.md) | Bevestigd |
| GF-008 | 2026-11-24 | Executive Sponsor | De vier Orion-toepassingsvideo's (staand, 14 s) worden achter de hand gehouden; eerst alle openstaande to-do's in productie. Advies CPO (LinkedIn-reeks eerst, daarna strook op orion.html en automatisering.html, niet op de homepage) ligt vast in de projectconversatie. | Grow Faster CPO-projectconversatie | Bevestigd |
| GF-009 | 2026-11-25 | Executive Sponsor (keuze gedelegeerd aan CPO) | Editie 2 van het Magazine behandelt "Het verschil tussen bon en levering" (december 2026). PR #79 (typografie) gesloten als verouderd. | Grow Faster CPO-projectconversatie | Bevestigd; onderwerp gekozen door CPO op delegatie |
| GF-010 | 2026-11-25 | CPO, met gedelegeerde beslissingsbevoegdheid van de Executive Sponsor (25/11 17:11), na advies van architect, lead engineer, release-agent en PO website | Eén release-wachtrij: alleen de release-agent merget naar main, volgorde in issue #122, labels `release-queue`/`sponsor-go`/`release-lock`, serieel met wachten op *Verify public release*, onstabiele test stopt de wachtrij na twee keer, releases op main niet meer afbreken. Organisatie-eigendom met GitHub-merge-queue later te overwegen (vraagt verhuizing van de repository; aparte sponsorbeslissing). Vaststelling: #117 en #121 werden zonder vastgelegde sponsor-GO of onafhankelijke review gemerged. | AGENTS.md › Release-wachtrij; OPERATING-MODEL §3a; issue #122 | Bevestigd (procesbesluit); productie-uitrol van dit document vraagt sponsor-GO |

## Bronhiërarchie en expliciete beperkingen

1. Dit register registreert **Grow Faster**-beslissingen en verwijst naar de originele bron waar mogelijk.
2. Het **Orion**-beslissingenregister is zelfstandig gezaghebbend voor Orion: [CLAUDE.md](https://github.com/erhol1973/vragenlijst-assistent/blob/main/CLAUDE.md), [artifacten-index](https://github.com/erhol1973/vragenlijst-assistent/blob/main/docs/artifacten-index.md). Zijn Poort 0, bouwstop en acceptatiecriteria zijn niet via dit bestand gewijzigd.
3. Het oorspronkelijke document 'Website Architecture & Content Blueprint v1.0' is als goedgekeurde baseline bekend, maar de volledige tekst is in deze PR niet geverifieerd. Dit register mag niet worden gebruikt om ontbrekende inhoud daarvan in te vullen.
4. Technische releases blijven onderworpen aan [RELEASE.md](../RELEASE.md), [TESTPLAN.md](../TESTPLAN.md) en de expliciete sponsor-GO.
5. Dit register is **niet** automatisch een goedkeuring van individuele nieuwe producten, budgetten, PR's of productie-uitrol.

## Nieuwe beslissing registreren

Voeg een nieuwe regel toe met: ID, ISO-datum, exacte beslisser, beslissing, bronlink, gevolgen, eventuele vervangen beslissing en expliciete goedkeuringsstatus. Laat oude regels intact.
