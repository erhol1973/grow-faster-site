# Testplan en kwaliteitsbeleid

Tests onderzoeken hetzelfde gebouwde `dist`-pakket dat wordt gepubliceerd. Ontwikkelbestanden en rapporten blijven buiten de website. Elke foutoplossing en nieuw gebruikerspad krijgt passende blijvende regressiedekking. Aantallen alleen zijn geen kwaliteitsmaatstaf.

| Laag | Dekking |
|---|---|
| Unit | Werkelijk gebruikte modellen: coherentiefactoren, vier besliskwadranten, risico/readiness, capaciteit, cashflow, break-even en procesgeometrie. Onafhankelijk uitgerekende rechte, parallelle en teruglopende paden; geen gekopieerde implementatie in tests. |
| Negatief | Ongeldige/lege scores, NaN/Infinity, negatieve waarden, percentages buiten bereik, nulvolume, onbekende nodes. Strikte consentversie, boolean-types, ouderdom en toekomstige timestamps. |
| HTTP/integratie | Echte server: GET/HEAD, MIME, gzip, 404, geweigerde schrijfmethoden, misvormde URL, NUL/backslash en traversal. Alle menu's, assets, fragmenten, unieke IDs, syntax en metadata. |
| Browser/E2E | Alle acht routes naar Contact vanaf bovenaan en na scrollen, herhaald Contact, toetsenbord, footer, geschiedenis; vier talen, echte taalwissels, artikelen/deeplinks, calculatorinvoer en simulator. |
| Consent | Weigeren, gedeeltelijk/volledig toestaan, intrekken, opnieuw toestaan en intrekken tijdens een vertraagde download. Externe diensten zijn gestubd: dit test ons contract, niet alle leverancierscode. |
| Cache | Echte ETag/304, versiewissel en oude HTML met actuele scripts. Back/Forward en feitelijke pageshow.persisted worden vastgelegd. Geen routingmocks die de browsercache uitschakelen; BFCache wordt niet kunstmatig afgedwongen. |
| Toegankelijkheid | Axe op acht menuwebpagina's, dialoog en simulator, Chromium desktop/mobiel, WCAG A/AA 2.0/2.1/2.2 en contrast. Uitgestelde inhoud wordt voor scans gerenderd. Ook toetsenbord, focus, tablet en 200% tekst. |
| Load | Uitsluitend lokaal: 288 verzoeken met acht workers, alle menuroutes, simulator, CSS/JS en verwachte 404. Geen fouten of ontbrekende routes, p95 maximaal 1.500ms. |
| Performance | Bestandsbudgetten plus drie koude Lighthouse-runs per Home/Coherence/Aanpak op mobiel en desktop; individuele rapporten en medianen. Na browsersuite, zonder gelijktijdige loadtests. |
| Security | Artifactscan, dependency-audit, Gitleaks geschiedenis en CodeQL security-extended. Bevindingen blokkeren; geen productieaanvallen of loadtests. |

## Browsermatrix en rapportage

Chromium desktop/mobiel draait alle scenario's. Firefox, WebKit desktop en mobiel WebKit draaien dezelfde functionele kern. Momenteel zijn 265 browsergevallen geregistreerd; het actuele rapport is leidend. Mobiel WebKit is emulatie, geen fysiek iPhone/Safari-bewijs.

Retries dienen voor diagnose. Eerst falen en daarna slagen blokkeert CI als instabiel. Ook .only en onverklaarde skips blokkeren. Rapporten onderscheiden geslaagd/gefaald/instabiel/overgeslagen en bewaren pogingen, redenen, screenshots en fouttraces. Desktop-only layouttests en de aparte tabletproef hebben expliciete skipredenen voor andere projecten. Geen stille quarantaine.

Echte screenreader-spraak en fysieke apparaten blijven aanvullende controles. Axe bewijst geen volledige WCAG-conformiteit. Lab-LCP/CLS/TBT zijn geen veldmetingen of INP; lokale load bewijst geen GitHub Pages-capaciteit.

## Uitvoering

1. `npm run build`
2. `npm test` (spec, JUnit en lokale rapportgeschiedenis)
3. `npm run security` en `pnpm audit --audit-level=high`
4. `npx playwright install --with-deps chromium firefox webkit`
5. `npm run test:e2e`
6. `npm run test:load`
7. `npm run test:performance`

CI bewaart reports/, playwright-report/ en test-results/, ook bij falen. browser-summary.json bevat pogingen en skipredenen; unit.xml de Node-resultaten. Lighthouse bewaart JSON en HTML. Lokale Edge via TEST_BROWSER_EXECUTABLE bewijst geen Firefox/WebKit-validatie.

Na deployment controleert `npm run verify:production` drie gewone navigatiepaden naar Contact en scriptfouten. Eén publieke mobiele Lighthouse-meting is aanvullend; de herhaalbare vrijgavecontroles draaien vooraf in CI.

## Grenzen en onderhoud

Behoud transferbudgetten: menu-HTML 85KB, CSS 125KB, site.js 55KB, vertalingen 260KB, content.js 23KB, ux.js 15KB, raster 700KB. Model- en consentmodule maximaal 18KB en 2,5KB. Build verwijdert alleen de niet aangeboden Arabische vertaalcolumn en serialiseert compacter; tests vergelijken iedere actieve vertaling exact met de bron. Aangeboden talen: NL-BE, FR-BE, EN, DE.

Werk tests/navigation-cases.json en betrokken lagen samen bij als routes veranderen. Contact in menu/footer opent about.html bovenaan; bewuste inhoudelijke #contact-shortcuts blijven geldig. Privacy-#cookies wordt runtime naar een taalgebonden fragment vertaald.

Onderzoek fouten vóór een nieuwe run. De historische acht lokale loadfouten hebben geen bewezen oorzaak; een latere groene run verklaart ze niet. Loadrapporten registreren daarom fouttype, route, Node/OS/CPU/geheugen en event-loopvertraging. Ook lokale HTTP-verbindingsresets worden bewaard en onderzocht, zonder automatische retry die ze verbergt.

Verzwak geen vastgelegde grens om te publiceren. Bespreek wezenlijke model-, beveiligings- of vrijgavewijzigingen met de eigenaar. Geen scanner garandeert dat de site nooit gehackt wordt.
