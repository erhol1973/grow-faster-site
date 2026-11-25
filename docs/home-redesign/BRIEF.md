# Homepage-herwerking — brief van de CPO/orchestrator

**Datum:** 25 november 2026 · **Branch:** `feature/home-redesign-20261125` · **Basis:** main `637f1d5`
**Opdracht sponsor (Erlend):** de volledige homepage beter structureren, een modernere en professionelere look & feel, en uitgebreidere tekst over terugkerend werk dat tijd kost aan het team. Agents werken parallel; de CPO orkestreert afhankelijkheden en prioriteiten; de release-agent bereidt de release voor.

## Bindende grenzen
- Merge naar `main` = automatische productiedeployment. **Geen merge zonder expliciete GO van de sponsor.** Agents committen niet; alleen de orchestrator commit.
- Geen test verwijderen, geen drempel verlagen, geen gate uitschakelen. AGENTS.md, docs/RELEASE.md en docs/TESTPLAN.md blijven leidend.
- Geen CMS-, Supabase- of HubSpot-mutaties. Alleen lezen.
- Niet aanraken: afspraakmodule (open PR #101), governance-docs (open PR #89), Executive Radar / baies-dev.
- Hoofdmenu blijft exact gelijk aan `tests/navigation-cases.json`.

## Vastgelegde sponsorbesluiten die blijven gelden
- Hero blijft: grote foto "QA manager met tablet aan productielijn" + donkerblauwe herovideo, titel "Sneller werken met AI en automatisering." Kleur/contrast van de hero blijft.
- Vier toepassingskaarten direct onder de hero, Orion eerst; onderhoud, administratie, logistiek linken naar automatisering.html.
- "Herkenbaar?" en "Zo werkt Orion" (Orion-stappen + Orion-film) komen **niet** terug op de homepage.
- Geen databeveiligingsclaims of read-only-garantie (Veiligheid-pagina is uitgesteld). Geen duur van een eerste workflow noemen (volgt uit klantbevraging).
- Alleen klanten als doelgroep (geen werkgevers). CTA: "Plan een pilotgesprek" → `afspraak.html?onderwerp=…`.
- Alleen de aangeleverde logobestanden. NL en FR (formeel "vous", Belgische typografie: harde spatie vóór ? : ; !).
- Smaak sponsor: zakelijk-professioneel en realistisch, rustig en premium; veel witruimte, sterke typografie en hiërarchie, één focus per blok. **Geen** schaduwen, geen zware randen, niet overwegend (licht)blauw, geen dashboardgevoel. Een eerdere volledig nieuwe "calm premium modern"-mockup werd afgewezen: **verfijn het bestaande ontwerp**, gooi het niet weg.

## Nieuwe informatiearchitectuur (volgorde en ids)
| # | id | Inhoud | Status |
|---|---|---|---|
| 1 | `hero` | Ongewijzigde boodschap; onder de CTA's een korte geruststellende regel (bv. "Uw team kijkt na. U beslist.") | verfijnen |
| 2 | `toepassingen` | Vier kaarten. Elke kaart krijgt een rijkere structuur: *wat het vandaag kost* → *wat Grow Faster voorbereidt* → *wat uw medewerker blijft doen*. | verfijnen + tekst |
| 3 | `terugkerend` | **Nieuw kernblok.** Uitgebreide tekst over terugkerend werk dat tijd kost: overtypen tussen mail, Excel en ERP; zoeken in mappen en certificaten; dezelfde klantvragen opnieuw beantwoorden; rapporten en werkbonnen opmaken; nakijken en doorsturen. Waarom het onzichtbaar blijft (verspreid over korte momenten, niemand meet het), wat het kost (herkenbare rekenvoorbeeld-logica, uitdrukkelijk gelabeld als *rekenvoorbeeld*, geen verzonnen statistiek), en hoe u het herkent (checklist van 5–7 signalen). | nieuw |
| 4 | `aanpak` | **Nieuw.** "Zo starten we" in drie fases: 1 workflowscan (één taak kiezen en meten), 2 pilot op die ene taak met uw systemen, 3 meten en beslissen (doorgaan/opschalen of stoppen). Neemt de huidige `toep-pilot`-tekst op. Algemeen, niet Orion-specifiek. | nieuw |
| 5 | `fundament` | Piramide "Van fundament tot AI" | behouden, visueel verfijnen |
| 6 | `kloof` | Statbel/OECD-cijfers | behouden (bronnen ongewijzigd) |
| 7 | `vertrouwelijk` | "Uw systemen en uw beslissingen blijven bij u" | behouden, geen nieuwe claims |
| 8 | `proof` | Ervaring uit de praktijk + organisaties | verplaatst naar onder |
| 9 | `final` | Pilot-CTA | behouden |

Elke sectie krijgt een kleine eyebrow (sectielabel) boven de h2. Ritme: wisselende achtergrond (wit / zacht neutraal), consistente verticale spacing, max. leesbreedte ~68ch voor lopende tekst.

## Schrijfoppervlakken (exclusief)
| Agent | Mag schrijven | Leest |
|---|---|---|
| Copy | `docs/home-redesign/COPY.md`, `docs/home-redesign/i18n-home.json` | alles |
| Design | `index.html`, `assets/home.css` (nieuw) | alles |
| Test | `tests/**`, `scripts/load.cjs`, `scripts/performance.cjs` | alles |
| Release | `docs/home-redesign/RELEASE-PREP.md`, eigen worktree/tmp | alles |
| Reviewer | niets (read-only) | alles |
| Orchestrator | `docs/home-redesign/BRIEF.md`, `assets/i18n.js`, `assets/cms-catalog.js`, commits, branch, PR | alles |

## Afhankelijkheden
- **i18n.js** is één JSON-regel van 200 KB; PR #101 wijzigt die regel ook → gegarandeerd tekstconflict. Daarom: vertalingen gaan eerst in `i18n-home.json` en worden door de orchestrator met een script samengevoegd (herhaalbaar na rebase).
- **CMS-overrides:** `cms-public.js` overschrijft elementen met `data-cms`-sleutel door gepubliceerde snapshots. Nieuwe tekst op een bestaande sleutel kan live worden overschreven door oude CMS-inhoud. Nieuwe teksten krijgen **nieuwe** `data-cms`-sleutels (prefix `home-v2-`); de release-agent controleert read-only welke `home`-sleutels gepubliceerd zijn.
- Volgorde: Copy en Design starten parallel (Design met concepttekst uit deze brief) → orchestrator integreert definitieve copy → Test vult tekstfrasen aan → Release draait alle gates → Reviewer → GO-vraag aan sponsor.
