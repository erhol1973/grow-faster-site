# Testplan en kwaliteitsbeleid

## Testplan-items: één bestand per wijziging

Elke wijziging met testimpact krijgt een eigen bestand in [docs/testplan/](testplan/) met de naam `JJJJ-MM-DD-<slug>.md`: de datum van de wijziging en een slug van kleine letters, cijfers en koppeltekens. Het bestand begint met een kop `## <titel>, <datum>` en beschrijft aanleiding, tests en bewijs. Voeg geen items meer toe aan dit bestand: parallelle pull requests raken dan dezelfde regels en conflicteren.

De map is de index, gesorteerd op bestandsnaam. `node scripts/testplan-index.cjs` toont een leesbare index, nieuwste eerst. `tests/testplan.test.cjs` bewaakt de bestandsnamen, de kop van elk item en dat dit bestand alleen het beleid hieronder bevat.

De 54 items tot en met 25 november 2026 zijn ongewijzigd uit dit bestand overgezet, één bestand per sectie. Secties zonder datum in de kop dragen de datum waarop ze in de Git-geschiedenis verschenen.

## Browsermatrix en rapportage

Chromium desktop/mobiel draait alle scenario's. Firefox, WebKit desktop en mobiel WebKit draaien dezelfde functionele kern. Het actuele browserrapport geeft het aantal geregistreerde gevallen en is leidend. Mobiel WebKit is emulatie, geen fysiek iPhone/Safari-bewijs.

Retries dienen voor diagnose. Eerst falen en daarna slagen blokkeert CI als instabiel. Ook .only en onverklaarde skips blokkeren. Rapporten onderscheiden geslaagd/gefaald/instabiel/overgeslagen en bewaren pogingen, redenen, screenshots en fouttraces. Desktop-only layouttests en de aparte tabletproef hebben expliciete skipredenen voor andere projecten. Geen stille quarantaine.

Echte screenreader-spraak en fysieke apparaten blijven aanvullende controles. Axe bewijst geen volledige WCAG-conformiteit. Lab-LCP/CLS/TBT zijn geen veldmetingen of INP; lokale load bewijst geen GitHub Pages-capaciteit.

De oude-HTML-cachefixture verwijdert ook deferred model- en consentscripts. Een HTTP-test controleert het verschil tussen beide releases; de browser controleert de ongewijzigde HTTP-body en daarna het laden van de ontbrekende modules door site.js. Zo kan aanwezige nieuwe markup de hersteltest niet ongemerkt laten slagen.

WebKit rendert de uitgestelde hoofdstukken direct en laadt de simulator met het document. Dit voorkomt dat het renderen of het aanpassen van de iframehoogte een footerlink tijdens de klik verplaatst. De bestaande Contact-test behoudt een echte klik, zonder force, extra retry of ruimere timeout; in WebKit controleert hij ook dat de simulator zonder scrollen geladen is. Chromium behoudt de optimalisaties. Deze keuze kan de initiële laadtijd op Safari verhogen.

## Uitvoering

1. `npm run build`
2. `npm test` (spec, JUnit en lokale rapportgeschiedenis)
3. `npm run security` en `pnpm audit --audit-level=high`
4. `npx playwright install --with-deps chromium firefox webkit`
5. `npm run test:e2e`
6. `npm run test:load`
7. `npm run test:performance`

In CI draaien deze stappen parallel: één job voor build, unit- en broncontroles, acht browsershards (`--shard=n/8`, samen alle profielen en scenario’s) en twee Lighthouse-jobs (mobiel met lokale load, desktop). Binnen elke Lighthouse-job blijven de metingen sequentieel. Elke job bouwt dezelfde commit en controleert met `scripts/dist-hash.cjs` dat dist/ byte-identiek is aan het voorbereide pakket; de verplichte check Website quality gate slaagt alleen als alle parallelle jobs slagen en publiceert dat pakket. CI bewaart reports/, playwright-report/ en test-results/, ook bij falen. browser-summary.json bevat pogingen en skipredenen; unit.xml de Node-resultaten. Lighthouse bewaart JSON en HTML. Lokale Edge via TEST_BROWSER_EXECUTABLE bewijst geen Firefox/WebKit-validatie.

Lighthouse vereist medianen van minimaal 90 voor de score, LCP maximaal 2.500ms, CLS maximaal 0,1 en TBT maximaal 200ms. Afgebroken metingen falen en bewaren tussentijdse resultaten. De build leest gecontroleerde open bestandsdescriptors; regressietests weigeren vervangen paden, symlinks en niet-bestanden. De vertaalbron wordt als JSON gelezen, niet als code uitgevoerd.

Na deployment controleert `npm run verify:production` drie gewone navigatiepaden naar Contact en scriptfouten. Eén publieke mobiele Lighthouse-meting is aanvullend; de herhaalbare vrijgavecontroles draaien vooraf in CI.

## Grenzen en onderhoud

Behoud transferbudgetten: menu-HTML 85KB, CSS 125KB, site.js 55KB, vertalingen 260KB, content.js 23KB, ux.js 15KB, raster 700KB. Model- en consentmodule maximaal 18KB en 2,5KB. De bron en build bevatten alleen de Nederlandse en Franse vertaalcolumns naast de Engelse brontekst; tests vergelijken iedere actieve vertaling exact met de bron. Aangeboden talen: NL-BE, FR-BE, EN.

Werk tests/navigation-cases.json en betrokken lagen samen bij als routes veranderen. Contact in menu/footer opent about.html bovenaan; bewuste inhoudelijke #contact-shortcuts blijven geldig. Privacy-#cookies wordt runtime naar een taalgebonden fragment vertaald.

Onderzoek fouten vóór een nieuwe run. De historische acht lokale loadfouten hebben geen bewezen oorzaak; een latere groene run verklaart ze niet. Loadrapporten registreren daarom fouttype, route, Node/OS/CPU/geheugen en event-loopvertraging. Ook lokale HTTP-verbindingsresets worden bewaard en onderzocht, zonder automatische retry die ze verbergt.

Verzwak geen vastgelegde grens om te publiceren. Bespreek wezenlijke model-, beveiligings- of vrijgavewijzigingen met de eigenaar. Geen scanner garandeert dat de site nooit gehackt wordt.

## Permanente grens voor interne Radar-sprintinhoud

Positieve fixtures bewaken gewone about.html-pagina’s, veilige Radar-pagina’s en legitieme publieke sprintteksten. Negatieve fixtures bewaken NL/FR-roadmapteksten, oude About-navigatie/structuur, achtergebleven runtimevertalingen en gekopieerde of hernoemde publieke bestanden. Test de werkelijke builder in een geïsoleerde tijdelijke bronboom: afkeuren vóór publicatie, geen achtergebleven deploybare dist na fout, en een schone volgende build. Artifact-security gebruikt dezelfde policy, zodat ook een verkeerd of aangepast publicatiepakket wordt afgekeurd. De publieke release-smoke doet uitsluitend gewone leesverzoeken naar beide Radar-routes en scripts en test taalbehoud bij een oude #about-link.

Historische previewretirement wordt afzonderlijk live gecontroleerd; nieuwe code of een groene build verwijdert geen bestaande historische deployment. Bewaar bewijs van vóór/na voor immutable URL en alias. De gebruikelijke build-, unit-, browser/axe-, load-, performance- en securitydrempels blijven ongewijzigd.
