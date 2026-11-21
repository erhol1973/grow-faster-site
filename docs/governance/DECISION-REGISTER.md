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

## Bronhiërarchie en expliciete beperkingen

1. Dit register registreert **Grow Faster**-beslissingen en verwijst naar de originele bron waar mogelijk.
2. Het **Orion**-beslissingenregister is zelfstandig gezaghebbend voor Orion: [CLAUDE.md](https://github.com/erhol1973/vragenlijst-assistent/blob/main/CLAUDE.md), [artifacten-index](https://github.com/erhol1973/vragenlijst-assistent/blob/main/docs/artifacten-index.md). Zijn Poort 0, bouwstop en acceptatiecriteria zijn niet via dit bestand gewijzigd.
3. Het oorspronkelijke document 'Website Architecture & Content Blueprint v1.0' is als goedgekeurde baseline bekend, maar de volledige tekst is in deze PR niet geverifieerd. Dit register mag niet worden gebruikt om ontbrekende inhoud daarvan in te vullen.
4. Technische releases blijven onderworpen aan [RELEASE.md](../RELEASE.md), [TESTPLAN.md](../TESTPLAN.md) en de expliciete sponsor-GO.
5. Dit register is **niet** automatisch een goedkeuring van individuele nieuwe producten, budgetten, PR's of productie-uitrol.

## Nieuwe beslissing registreren

Voeg een nieuwe regel toe met: ID, ISO-datum, exacte beslisser, beslissing, bronlink, gevolgen, eventuele vervangen beslissing en expliciete goedkeuringsstatus. Laat oude regels intact.
