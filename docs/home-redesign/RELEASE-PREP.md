# Releasevoorbereiding homepage-herwerking

**Datum:** 25 november 2026 · **Rol:** release-agent (voorbereiding en verificatie, geen commit/push/merge/deployment)
**Baseline:** main `637f1d5` in de aparte worktree `/home/claude/gf-release` · **Doelbranch:** `feature/home-redesign-20261125`
**Bewijsmateriaal:** logs en rapporten van de baseline staan in `/tmp/gf-baseline-reports/` (buiten de repository, niet gepubliceerd).

Fase 1 (§1–6) bevat de baseline, de CI-observaties, de CMS-risicoanalyse, de conflictanalyse en de checklist. Fase 2 (§7) bevat de gates op de geïntegreerde branch en PR #111. §8 is het GO/NO-GO-overzicht.

---

## 1. Baseline op main `637f1d5` (lokale sandbox)

Omgeving: Node v22.23.5 (CI gebruikt 24.21.0), 2 CPU's, pnpm 11.25.0 via corepack. Op dezelfde machine draaiden tegelijk andere agents, dus tijden en Lighthouse-waarden zijn ruw.
Installatie: `corepack pnpm install --frozen-lockfile --ignore-scripts` slaagde (4 s, 114 pakketten).

| Gate | Resultaat | Duur | Toelichting |
|---|---|---|---|
| `npm run build` | **geslaagd** | 0,3 s | 203 bestanden in `dist/`, publieke-inhoudspolicy geslaagd |
| `npm test` | **niet geslaagd (sandbox)** | 8 s | 199/201 geslaagd. De 2 fouten komen uit de omgeving: `nl-dom.test.cjs` en `verify-browser-runtime.test.cjs` verwachten Chromium build 1255 (Playwright 1.65.1) in `/opt/pw-browsers`, maar de sandbox heeft alleen build 1243 |
| `npm run security` | **geslaagd** | 0,2 s | Artifact-security en public-content policy (heuristisch) |
| `npm run test:e2e` (5 profielen) | **niet uitgevoerd: kan hier niet draaien** | 371 s | 837 fouten, allemaal bij het starten van de browser: Firefox 1572, WebKit en Chromium 1255 ontbreken. `playwright install` wordt geweigerd door de netwerkallowlist (`cdn.playwright.dev` 403) |
| e2e, alleen ter diagnose: `chromium` + `mobile` met de oudere Chromium 153 (`TEST_BROWSER_EXECUTABLE`), aparte poort 4391 | 401 geslaagd, 14 mislukt, 11 overgeslagen | 762 s | Alle 14 fouten komen door de poortwissel: `book-reader`, `books` en `workshop` hebben `http://127.0.0.1:4173` hard in de test staan. **Telt niet als gate**: andere browserbuild, Firefox, WebKit en mobile-webkit ontbreken |
| `npm run test:load` | **geslaagd** | 0,6 s | Geen violations, geen missingRoutes, efemere poort |
| `npm run test:performance` | **niet uitgevoerd: kan hier niet draaien** | 1 s | De Chromium 1255-binary ontbreekt |
| performance, alleen ter diagnose met Chromium 153 | mislukt op 1 drempel | 616 s | `mobile /automatisering.html` TBT 244 ms > 200 ms (samples 244/467/203). Op dezelfde commit slaagde dit in CI (run 45523345359), dus waarschijnlijk ruis van de gedeelde machine met 2 CPU's. Homepage mobiel: score 99, LCP 2166 ms, TBT 23 ms, CLS 0,002. Desktop: score 100, LCP 501 ms. **Telt niet als gate** |
| Agent surface guard (`agent-guard.mjs check`) | geslaagd | <1 s | Op main én op een /tmp-kopie van de huidige branchwerkboom (inclusief niet-gevolgde nieuwe bestanden) |

**Conclusie baseline:** in de sandbox kunnen build, security, load en 199/201 unit tests gecontroleerd worden. De e2e-gate (5 profielen), de performance-gate en de twee browserafhankelijke unit tests kunnen hier **niet** bewezen worden. Daarvoor blijft de CI-run op de PR de enige geldige bron. Er zijn geen bestaande functionele fouten op main gevonden; de laatste main-run 45523345359 was volledig groen, inclusief deploy en publieke nacontrole.

### Risico gevonden tijdens de baseline: gedeelde poort 4173
`playwright.config.cjs` gebruikt `reuseExistingServer: !process.env.CI`. Een eerste diagnose-run zonder aparte poort sloot aan op de server van een andere agent op 4173. Die server bediende dus de inhoud van de **branch** in plaats van main, en viel tijdens de run weg (284 × `ERR_CONNECTION_REFUSED`). Gevolgen voor fase 2 en voor andere agents:
- Lokale e2e-resultaten kunnen stil een andere checkout testen. Laat per checkout één agent tegelijk e2e draaien, of stop eerst andere servers op 4173.
- Een aparte poort (`PORT` + `TEST_BASE_URL`) lost dit niet volledig op, omdat zeven tests 4173 hard gebruiken.
- In CI speelt dit niet (één container per job).

---

## 2. CI-observaties

`gh run list -L 10` (25 november):
- **Website release op main** (`637f1d5`, run 45523345359): geslaagd. Alle jobs groen: prepare, 8 browsershards, Lighthouse desktop en mobiel, Website quality gate, JavaScript security gate, Secrets history gate, Deploy, Verify public release.
- PR #89 (governance): Website release en Dev agent surface guard geslaagd.
- **Daily Dutch language audit op main** (run 45566881275, 07:16 UTC): **niet geslaagd**.

### Waarom de taalaudit faalde
- Geen technische fout. De scan is volledig gelopen: 36 pagina's geïnventariseerd, LanguageTool 3 batches, 3456 blokken gecontroleerd.
- Status `FINDINGS`: **613 nieuwe bevindingen** ten opzichte van het register. `scripts/nl-audit.cjs` geeft exit code 1 zodra er nieuwe bevindingen zijn (`status !== 'PASSED'`).
- Structureel: de audit faalt elke dag (ook op 24 november) en op elke PR die `language/**` of `scripts/nl-*` raakt. Het register `language/nl-baseline.json` komt van commit `50f47af` (11 november). Sindsdien is veel tekst herschreven: release 2, de Orion-pagina en de homepage van 22 tot 24 november. In die baseline staan 256 homepageblokken en 70 homepagebevindingen van vóór de huidige homepage.
- **Effect op de homepage:** `index.html` werd gescand. Het is zeer waarschijnlijk dat een deel van de 613 bevindingen over de huidige homepagetekst gaat. De verdeling per pagina staat in het artifact `nl-language-audit-45566881275-1`. Dat kon hier niet worden gedownload (blobopslag geblokkeerd door de proxy).
- **Effect op de release:** geen. Dit is geen verplichte statuscontrole. De workflow heeft alleen `contents: read`, en volgens RELEASE.md loopt de baselinepromotie via een aparte branch/PR. De nieuwe homepagetekst zal morgen extra bevindingen geven. Advies: laat de Copy-agent de nieuwe tekst zelf nalezen (Taalunie/Belgisch Nederlands) en promoveer het register apart. Dat valt niet onder deze release.

---

## 3. CMS-overschrijfrisico (pagina `home`)

**Live controle niet gelukt.** De Supabase MCP-aanroep (`list_projects`) kreeg geen goedkeuring. De publieke REST-GET op `dbooobckaqbkrmkpcuem.supabase.co` werd door de netwerkallowlist geweigerd (403). Er is niets gewijzigd. Wat volgt, is een analyse van de code en de geschiedenis.

**Werking:** `cms-public.js` haalt `cms_publications?select=content&page_slug=eq.home` op (anon, RLS `published_read`). Daarna overschrijft het elk element waarvan de `data-cms`-sleutel in de gepubliceerde snapshot staat: tekst per taal, en media (afbeelding: `srcset` en `<source>` worden verwijderd; video: sectie wordt zichtbaar).

**Sleutels op main en op de branch (huidige werkboom):**

| Sleutel(s) | In catalogus sinds | Op branch | Tekst op branch | Risico |
|---|---|---|---|---|
| `home-orion-hero-heading`, `home-orion-hero-sub` | 22 nov (84757ae) | behouden | ongewijzigd | Laag: een gepubliceerde waarde was al live zichtbaar |
| `home-apps-1..4-h` | 24 nov (3c2e1c5) | behouden | ongewijzigd | Laag |
| `home-orion-proof-h/-p`, `home-orion-trust-h/-p`, `home-trust-1..3-h/-p`, `home-orion-pilot-h/-p` | 22 en 24 nov | behouden | ongewijzigd | Laag |
| `home-apps-h`, `home-apps-p`, `home-apps-1..4-p`, `home-apps-pilot-h/-p` | 24 nov | **verwijderd uit HTML** | n.v.t. | Geen: gepubliceerde waarden vinden geen element meer. Let op: de oude `toep-pilot`-tekst gaat naar `aanpak`, maar onder **nieuwe** `home-v2-aanpak-*`-sleutels. Zo hoort het |
| 71 nieuwe `home-v2-*`-sleutels | nog niet in catalogus op main | nieuw | nieuw | Geen: kan nog niet gepubliceerd zijn |
| `f7a4946dfd792-0` (herofoto, media) | 11 nov (f4d1e1c) | behouden | n.v.t. | **Middel**: een gepubliceerde mediawaarde vervangt de responsive foto door één bestand. Dat kan de LCP en het herocontrast veranderen. Gold al vóór deze release |
| `cms-video-home` (media) | 11 nov | behouden (`hidden`) | n.v.t. | **Middel**: een gepubliceerde video maakt de verborgen videosectie zichtbaar, met inhoud die niet in de nieuwe informatiearchitectuur staat |

Gepubliceerde NL/FR-teksten kon ik niet lezen. De standaardteksten uit de catalogus (wat de site zonder snapshot toont) zijn onder andere: hero "Sneller werken met AI en automatisering." / "Travailler plus vite grâce à l’IA et à l’automatisation.", trust "Uw systemen en uw beslissingen blijven bij u" / "Vos systèmes et vos décisions restent chez vous", pilot "Test Orion op uw eigen vragenlijsten" / "Testez Orion sur vos propres questionnaires".

**Erlend controleert vóór GO in de CMS-beheerpagina (alleen bekijken, niet publiceren):**
1. Is er voor de pagina Homepage een gepubliceerde versie? Zo ja, welke velden wijken af van de standaardtekst? Dat gaat vooral over hero, de vier kaarttitels, trust, proof en pilot. Die blijven live zichtbaar boven de nieuwe HTML.
2. Is er een gepubliceerde herofoto (`f7a4946dfd792-0`) of homepagevideo (`cms-video-home`)? Zo ja: melden. Een video zou een sectie toevoegen die niet in de brief staat.
3. Na de release: de nieuwe `home-v2-*`-velden verschijnen in de editor zodra de orchestrator `cms-catalog.js` bijwerkt. Publiceer de homepage niet opnieuw voordat de nieuwe tekst live staat. Een publicatie neemt alle velden van het formulier op.

Alternatief: één read-only `SELECT page_slug, updated_at, content FROM public.cms_publications WHERE page_slug='home'` via de Supabase MCP, na goedkeuring.

---

## 4. Conflictanalyse met open PR's

| PR | Branch / basis | Status | Bestanden |
|---|---|---|---|
| #101 Eigen afspraakmodule | `feature/eigen-afspraken` `ea9f6df`, basis `e62db44` (**ouder dan main**) | draft, `mergeable=false`, `dirty`: conflicteert nu al met main | 19 bestanden, onder andere `assets/i18n.js`, `docs/TESTPLAN.md`, `afspraak.html`, `assets/cms-config.js`, `scripts/build.cjs`, `scripts/server.cjs`, `privacy.html`, `tests/afspraak.test.cjs`, `tests/browser/afspraak.spec.cjs`, `tests/cms-environment.test.cjs`, Supabase-functie en migratie |
| #89 Governance Control Tower | `governance/control-tower-20261121` `542104b`, basis `637f1d5` | draft, `clean`, CI groen | `AGENTS.md` (+6 regels bovenaan), 4 nieuwe `docs/governance/*` |

**Overlap met de oppervlakken van de herwerking:**
- **`assets/i18n.js`: zeker tekstconflict met #101.** Beide wijzigen de enige regel. De aanpak uit de brief (vertalingen in `i18n-home.json`/`assets/i18n-home.js`, samengevoegd met een script dat opnieuw kan draaien na een rebase) is de juiste. Op de branch staat nu een apart `assets/i18n-home.js`. Als `i18n.js` zelf ongewijzigd blijft, verdwijnt dit conflict helemaal.
- **`docs/TESTPLAN.md`: waarschijnlijk conflict.** #101 voegt een sectie toe direct onder de titel. Een TESTPLAN-sectie voor deze release komt op dezelfde plaats. Dat is eenvoudig op te lossen: beide secties behouden.
- `index.html`, `assets/home.css`, `tests/home-v2*`, `tests/klantsite.test.cjs`, `tests/cms-client.test.cjs`, `scripts/load.cjs`, `assets/cms-catalog.js`, `admin.html`, `assets/cms-admin.js`: **geen** bestandsoverlap met #101 of #89.
- **Functionele afhankelijkheid met #101:** de pilot-CTA `afspraak.html?onderwerp=vragenlijsten` blijft werken. #101 behoudt de `data-topic`-waarde `vragenlijsten` en de voorselectie via `?onderwerp=` (`assets/booking.js`). `tests/afspraak.test.cjs` in #101 controleert dat elke `afspraak.html?onderwerp=` op alle pagina's een bestaand onderwerp gebruikt. De homepage gebruikt alleen `vragenlijsten` en kale `afspraak.html`, dus dat klopt.
- #101 wijzigt `cms-config.js` (`GF_SUPABASE_PROJECTS`) en `scripts/server.cjs` (cms-test-stub). Geen tekstoverlap, maar wel dezelfde laadketen op de homepage (`cms-config.js` → `cms-client.js` → `cms-public.js`). Draai na elke rebase de volledige suite.
- **#89:** geen overlap met bestanden van de herwerking. Inhoudelijk legt #89 de regel vast "productierelease = altijd voorafgaande GO van de Executive Sponsor". Dat stemt overeen met de brief.

**Aanbevolen volgorde:**
1. **#89 eerst**, na GO van de sponsor. Alleen documentatie, `clean`, CI groen, geen overlap. Het verankert de GO-regel vóór de release. De merge veroorzaakt wel een productiedeploy van dezelfde site, dus ook hiervoor is een GO nodig.
2. **Homepage-herwerking daarna**, gerebased op main na #89. Dan alle gates opnieuw.
3. **#101 als laatste.** Die PR is al `dirty` en moet sowieso op main gerebased worden. Ze bevat eigen open acceptatiepunten (Edge Function, SMTP, migratie, echte testboeking). Door ze na de homepage te zetten, valt het `i18n.js`-conflict één keer op de PR die het al moet oplossen.
   Als #101 toch eerst gaat: rebase de homepagebranch, draai het samenvoegscript voor `i18n-home.json` opnieuw, voeg beide TESTPLAN-secties samen en herhaal alle gates. Eerdere groene checks gelden niet voor de nieuwe revisie.

---

## 5. Releasechecklist (homepage-herwerking)

**A. Vóór de PR (lokaal, op de geïntegreerde branch, één e2e-proces per machine)**
- [ ] Werkboom schoon, alleen bestanden van de brief gewijzigd. `node scripts/agent-guard.mjs check` (AGENT_DIR=docs/agents) groen.
- [ ] Geen test verwijderd, geen drempel verlaagd, geen skip/retry/timeout versoepeld. Elke aangepaste test is per bestand verantwoord in de PR-beschrijving en in `docs/TESTPLAN.md`.
- [ ] Menu ongewijzigd ten opzichte van `tests/navigation-cases.json`. Contact-links openen `about.html` bovenaan.
- [ ] `npm run build` · `npm test` · `npm run security` · `npm run test:e2e` · `npm run test:load` · `npm run test:performance`. Resultaat per gate vastleggen, met duur. Een gate die hier niet kan draaien, wordt gemeld als "niet uitgevoerd" en nooit als geslaagd.
- [ ] Budgetten: `i18n.js` gzip < 65 000 bytes en raw ≤ 260 KB, HTML ≤ 85 KB, `home.css` en `i18n-home.js` binnen de budgetten van load/performance.
- [ ] Inhoud: NL en FR volledig, formeel "vous", harde spatie vóór ? : ; !, geen beveiligingsclaims of alleen-lezen-belofte, geen duur van een eerste workflow, rekenvoorbeeld gelabeld als rekenvoorbeeld, Statbel/OECD-bronnen ongewijzigd.
- [ ] Homepage behoudt wat `scripts/verify-production.cjs` controleert: 4 × `#toepassingen .toep-kaart`, geen `#orion-film`, het menu met 7 links, mediabestanden `hero-toepassingen-1920.mp4` en `-4k.mp4`.
- [ ] Nieuwe tekst gebruikt alleen nieuwe `home-v2-*`-sleutels. De tekst op bestaande sleutels is ongewijzigd (zie §3). De CMS-catalogus en de editorgroepen volgen de nieuwe velden.
- [ ] Versiequery's: `home.css?v=…`, `i18n-home.js?v=…`. Als `i18n.js` of `site.css` wijzigt, de `?v=` ophogen.
- [ ] `docs/TESTPLAN.md` krijgt een sectie "Homepage-herwerking, 25 november 2026".

**B. Beschermde-main-route (geen andere route)**
- [ ] Branch pushen en draft-PR naar `main` openen (orchestrator/fase 2). Geen direct push naar main.
- [ ] Verplichte statuscontroles groen op de **laatste** commit: **Website quality gate**, **JavaScript security gate**, **Secrets history gate**. Daarnaast: prepare (inclusief `pnpm audit --audit-level=high`), 8 browsershards zonder flaky tests (`failOnFlakyTests`), Lighthouse desktop en mobiel, dist-hash gelijk over alle jobs, Dev agent surface guard.
- [ ] Rapporten bekijken (unit-reports, browser-reports-1..8, performance-reports-desktop/mobile, codeql-results). Nieuwe beveiligingsbevindingen beoordelen.
- [ ] Reviewer-agent: read-only review afgerond, bevindingen opgelost.
- [ ] CMS-controle uit §3 gedaan door Erlend.
- [ ] **Expliciete GO van de sponsor** (Erlend) vóór de merge, want merge = productiedeployment. Draft omzetten naar ready pas na de GO.
- [ ] Merge via de PR. Daarna de main-run volgen tot de eindstatus: Deploy tested website en **Verify public release** (runtime-canary, publieke smoke, snelheidsobservatie).

**C. Live smokecheck na deployment (beperkt, alleen gewone leesverzoeken)**
- [ ] `https://grow-faster.be/` en `/index.html` in NL: hero ongewijzigd (titel, foto/video, contrast), geruststellende regel onder de CTA's, sectievolgorde hero → toepassingen → terugkerend → aanpak → fundament → kloof → vertrouwelijk → proof → final, eyebrows zichtbaar.
- [ ] Zelfde in FR via de taalkeuze en via `?lang=fr`: alle nieuwe tekst vertaald, geen NL-resten, Franse typografie.
- [ ] Menu desktop en mobiel (burger): Home · Orion · Workflow-automatisering · Bedrijfsontwikkeling · Training · Maandelijks Magazine · Insights plus "Plan een pilotgesprek". Escape en buitenklik sluiten het menu. Contact in de footer opent `about.html` bovenaan.
- [ ] Pilot-CTA → `afspraak.html?onderwerp=vragenlijsten` met het onderwerp "Vragenlijsten automatisch invullen met AI" voorgeselecteerd, in NL en FR. Kaartlinks onderhoud, administratie en logistiek → `automatisering.html`, Orion-kaart → `orion.html`.
- [ ] Browserconsole: geen scriptfouten of 404's (ook niet voor `home.css` en `i18n-home.js`), geen horizontale overloop op mobiel.
- [ ] CMS live: de gepubliceerde homepagevelden overschrijven geen nieuwe tekst. Geen onverwachte videosectie.
- [ ] **Oudere HTML in open tabbladen:** een tab die vóór de release geopend werd, houdt de oude HTML met de oude assetversies. Die moet blijven werken: geen 404 op oude `?v=`-assets, het menu werkt, de CTA werkt. GitHub Pages cachet HTML ongeveer 10 minuten. Controleer na een harde refresh en in een privévenster. Herlaad oude tabs, test ze niet alleen.
- [ ] Rapport `production-smoke.json` en `public-verification-status.txt` uit de main-run bewaren.

---

## 6. Rollback

- Rollback gaat **via dezelfde beschermde route**: een revert-PR (`git revert -m 1 <mergecommit>` op een nieuwe branch, of de knop "Revert" in GitHub). Daarna dezelfde drie verplichte controles en de volledige gates. GO van de sponsor, merge, en de main-run volgen tot Verify public release.
- Geen force-push, geen handmatige Pages-upload, geen deploy van een niet-getest pakket.
- CMS: niet terugdraaien via publiceren. Als een gepubliceerde snapshot het probleem veroorzaakt, beslist Erlend in de beheerpagina. Agents doen geen CMS-mutaties.
- Als #101 of #89 intussen gemerged is: revert alleen de homepage-merge en controleer `i18n.js` en TESTPLAN op een juiste revert.

---

## 7. Fase 2: resultaten op de geïntegreerde branch

- **Branch:** `feature/home-redesign-20261125`, gepusht op 25 november om 08:20 UTC. Vóór de push liepen er geen workflows (`in_progress` 0, `queued` 0).
- **PR:** [#111](https://github.com/erhol1973/grow-faster-site/pull/111), draft, basis `main` `637f1d5`.
- **Geteste code-commit:** `ec7e8a7`. CI testte de merge-commit `afbb7cb`. De doc-commit met dit hoofdstuk wijzigt alleen deze markdown en start een nieuwe CI-run. Voor de GO telt de groene run op de **laatste** head.

### CI op PR #111 (`ec7e8a7`)

| Controle | Resultaat | Run |
|---|---|---|
| **Website quality gate** (verplicht) | geslaagd | [45575374558](https://github.com/erhol1973/grow-faster-site/actions/runs/45575374558) |
| **JavaScript security gate** (verplicht, CodeQL) | geslaagd | idem |
| **Secrets history gate** (verplicht) | geslaagd | idem |
| Build, unit and source checks (inclusief `pnpm audit --audit-level=high`) | geslaagd | idem |
| Browser regressions 1–8/8 (5 profielen, `failOnFlakyTests`) | 8/8 geslaagd, geen flaky. Per shard 90–106 geslaagd, 1–16 overgeslagen: het bestaande projectfilter `critical` | idem |
| Load and Lighthouse desktop / mobiel | geslaagd. Homepage mobiel: score 99/99/98, LCP 2190/2187/2260 ms, TBT 0/0/31, CLS ≤ 0,002. Desktop: score 100, LCP ≈ 490 ms | idem |
| Deploy / Verify public release | overgeslagen (alleen op main, zoals bedoeld) | idem |
| Dev agent surface guard | geslaagd | [45575374517](https://github.com/erhol1973/grow-faster-site/actions/runs/45575374517) |
| Daily Dutch language audit (niet verplicht) | **niet geslaagd, met een nieuwe oorzaak** (zie hieronder) | [45575374542](https://github.com/erhol1973/grow-faster-site/actions/runs/45575374542) |

### Lokaal (snapshot van `ec7e8a7` in /tmp, Node 22)
Build, security en load zijn geslaagd. `npm test`: 215/217. De 2 fouten zijn dezelfde omgevingsfouten als op de baseline: Chromium 1255 ontbreekt voor `nl-dom` en de runtime-canary. Lokale e2e en Lighthouse met 5 profielen konden hier niet draaien. De orchestrator draaide lokaal de e2e van home-v2, home-hero-video en accessibility: 57 geslaagd. **De bindende browser- en Lighthouse-resultaten zijn die van de CI hierboven.**

### Bevinding: taalaudit faalt vóór het scannen
- **Melding:** `Inline JavaScript extraction contract changed: review adapters and regenerate contract via PR`. Op main is de status `FINDINGS` (de scan loopt wel). Op deze PR stopt de audit vóór het scannen.
- **Oorzaak:** `language/nl-extraction.json` is bijgewerkt voor de JS-bestanden, maar niet in de lijst `inline` voor `index.html`.
  - Contract: `32bc2129…44e4`.
  - Werkelijk: `520d5890…7316` (herberekend in /tmp op de build van `ec7e8a7`).
  - De JSON-LD van de homepage is inhoudelijk identiek. De hash verandert omdat er een extra `<script defer src="assets/i18n-home.js">` bij is gekomen: de extractie voegt de `textContent` van alle `<script>`-elementen samen met `\n`.
  - Alle andere 39 HTML-bestanden kloppen.
- **Gevolg na een merge zonder herstel:** de dagelijkse audit op main stopt weer vóór het scannen. Dat is hetzelfde patroon als op 13 tot 22 november (zie `docs/NL-LANGUAGE-AUDIT.md`). Het is geen verplichte statuscontrole en blokkeert de deployment dus niet. Maar de Nederlandse taalcontrole valt dan stil.
- **Herstel (orchestrator, niet door de release-agent):** de `inline`-hash van `index.html` in `language/nl-extraction.json` bijwerken naar `520d589042e777ba0f49ac51c72c633461aa39ec8205dee896ec5fad13ac7316`, met de reden in `technicalReview`. Daarna de CI opnieuw laten lopen. De audit zal dan waarschijnlijk `FINDINGS` geven, zoals op main. Dat is acceptabel: de nieuwe homepagetekst is nog niet in het register opgenomen.

## 8. GO/NO-GO

| Punt | Status | Bewijs |
|---|---|---|
| Geïntegreerde commit (SHA) | `ec7e8a7` (code); doc-commit erbovenop | PR #111 |
| Lokaal: build / test / security / load | geslaagd / 215/217 (2× omgeving) / geslaagd / geslaagd | §7 |
| Lokaal: e2e (5 profielen) / performance | niet uitvoerbaar in de sandbox; deelset 57 geslaagd (orchestrator) | §1, §7 |
| CI: Website quality gate | geslaagd | run 45575374558 |
| CI: JavaScript security gate | geslaagd | run 45575374558 |
| CI: Secrets history gate | geslaagd | run 45575374558 |
| CI: browsershards zonder flaky, Lighthouse desktop en mobiel | geslaagd (8/8, desktop, mobiel) | run 45575374558 |
| Reviewer-agent | bevindingen verwerkt in `ec7e8a7` (volgens de orchestrator) | commit `ec7e8a7` |
| CMS-controle door Erlend (§3) | **open** | n.v.t. |
| Conflictstatus #101 / #89, volgorde | geen bestandsoverlap met #89. #101: alleen `docs/TESTPLAN.md` (i18n.js ongewijzigd). Volgorde #89 → #111 → #101 | §4 |
| Open risico's | (1) taalauditcontract `index.html` (§7); (2) gepubliceerde CMS-snapshot (§3); (3) open sponsorkeuzes uit COPY.md: € 45/u, verplaatste vraagkop, hero-regel, Orion-specifieke final-CTA | §3, §7, PR-body |
| Rollback | revert-PR via de beschermde route, zelfde gates, GO, de main-run volgen tot Verify public release | §6 |
| **Advies release-agent (GO / NO-GO)** | **Nog geen GO: technisch releasebaar onder voorwaarden.** Alle verplichte gates zijn groen. Vóór de merge: (a) contracthash herstellen en de CI opnieuw groen op de laatste head; (b) CMS-controle door Erlend; (c) Erlend beslist over de 4 open copypunten. Daarna adviseert de release-agent GO | — |
| **Besluit sponsor (Erlend), datum en uur** | | |
