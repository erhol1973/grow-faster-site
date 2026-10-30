# Testplan en kwaliteitsbeleid

Tests onderzoeken hetzelfde gebouwde `dist`-pakket dat wordt gepubliceerd. Ontwikkelbestanden en rapporten blijven buiten de website. Elke foutoplossing en nieuw gebruikerspad krijgt passende blijvende regressiedekking. Aantallen alleen zijn geen kwaliteitsmaatstaf.

| Laag | Dekking |
|---|---|
| Unit | Werkelijk gebruikte modellen: coherentiefactoren, vier besliskwadranten, risico/readiness, capaciteit, cashflow, break-even en procesgeometrie. Onafhankelijk uitgerekende rechte, parallelle en teruglopende paden; geen gekopieerde implementatie in tests. |
| Negatief | Ongeldige/lege scores, NaN/Infinity, negatieve waarden, percentages buiten bereik, nulvolume, onbekende nodes. Strikte consentversie, boolean-types, ouderdom en toekomstige timestamps. |
| HTTP/integratie | Echte server: GET/HEAD, MIME, gzip, 404, geweigerde schrijfmethoden, misvormde URL, NUL/backslash en traversal. Alle menu's, assets, fragmenten, unieke IDs, syntax en metadata. |
| Browser/E2E | Alle acht routes naar Contact vanaf bovenaan en na scrollen, herhaald Contact, toetsenbord, footer, geschiedenis; drie talen, echte taalwissels, artikelen/deeplinks, calculatorinvoer en simulator. |
| Consent | Weigeren, gedeeltelijk/volledig toestaan, intrekken, opnieuw toestaan en intrekken tijdens een vertraagde download. Externe diensten zijn gestubd: dit test ons contract, niet alle leverancierscode. |
| Cache | Echte ETag/304, versiewissel en oude HTML met actuele scripts. Back/Forward en feitelijke pageshow.persisted worden vastgelegd. Geen routingmocks die de browsercache uitschakelen; BFCache wordt niet kunstmatig afgedwongen. |
| Toegankelijkheid | Axe op acht menuwebpagina's, dialoog en simulator, Chromium desktop/mobiel, WCAG A/AA 2.0/2.1/2.2 en contrast. Uitgestelde inhoud wordt voor scans gerenderd. Ook toetsenbord, focus, tablet en 200% tekst. |
| Load | Uitsluitend lokaal: 288 verzoeken met acht workers, alle menuroutes, simulator, CSS/JS en verwachte 404. Geen fouten of ontbrekende routes, p95 maximaal 1.500ms. |
| Performance | Bestandsbudgetten plus drie koude Lighthouse-runs per Home/Coherence/Aanpak/Contact op mobiel en desktop; individuele rapporten en medianen. Na browsersuite, zonder gelijktijdige loadtests. |
| Security | Artifactscan, dependency-audit, Gitleaks geschiedenis en CodeQL security-extended. Bevindingen blokkeren; geen productieaanvallen of loadtests. |

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

CI bewaart reports/, playwright-report/ en test-results/, ook bij falen. browser-summary.json bevat pogingen en skipredenen; unit.xml de Node-resultaten. Lighthouse bewaart JSON en HTML. Lokale Edge via TEST_BROWSER_EXECUTABLE bewijst geen Firefox/WebKit-validatie.

Lighthouse vereist medianen van minimaal 90 voor de score, LCP maximaal 2.500ms, CLS maximaal 0,1 en TBT maximaal 200ms. Afgebroken metingen falen en bewaren tussentijdse resultaten. De build leest gecontroleerde open bestandsdescriptors; regressietests weigeren vervangen paden, symlinks en niet-bestanden. De vertaalbron wordt als JSON gelezen, niet als code uitgevoerd.

Na deployment controleert `npm run verify:production` drie gewone navigatiepaden naar Contact en scriptfouten. Eén publieke mobiele Lighthouse-meting is aanvullend; de herhaalbare vrijgavecontroles draaien vooraf in CI.

## Grenzen en onderhoud

Behoud transferbudgetten: menu-HTML 85KB, CSS 125KB, site.js 55KB, vertalingen 260KB, content.js 23KB, ux.js 15KB, raster 700KB. Model- en consentmodule maximaal 18KB en 2,5KB. De bron en build bevatten alleen de Nederlandse en Franse vertaalcolumns naast de Engelse brontekst; tests vergelijken iedere actieve vertaling exact met de bron. Aangeboden talen: NL-BE, FR-BE, EN.

Werk tests/navigation-cases.json en betrokken lagen samen bij als routes veranderen. Contact in menu/footer opent about.html bovenaan; bewuste inhoudelijke #contact-shortcuts blijven geldig. Privacy-#cookies wordt runtime naar een taalgebonden fragment vertaald.

Onderzoek fouten vóór een nieuwe run. De historische acht lokale loadfouten hebben geen bewezen oorzaak; een latere groene run verklaart ze niet. Loadrapporten registreren daarom fouttype, route, Node/OS/CPU/geheugen en event-loopvertraging. Ook lokale HTTP-verbindingsresets worden bewaard en onderzocht, zonder automatische retry die ze verbergt.

Verzwak geen vastgelegde grens om te publiceren. Bespreek wezenlijke model-, beveiligings- of vrijgavewijzigingen met de eigenaar. Geen scanner garandeert dat de site nooit gehackt wordt.

## Claude-optimalisaties, 30 oktober 2026

Tien oude SITE123-adressen krijgen een directe meta-refresh, canonical en zichtbare terugval-link. Het bouwpakket neemt alleen de expliciete redirectlijst op. De lokale server ondersteunt de overeenkomstige extensionless HTML- en mapadressen, met behoud van gzip, HEAD, nosniff en de bestaande padcontroles. HTTP-tests controleren alle tien adressen en onbekende adressen; browserregressies controleren de daadwerkelijke navigatie en twee artikelbestemmingen. Dit zijn client-side redirects; er wordt geen HTTP-301 van GitHub Pages geclaimd.

Contenttests bewaken de zoekgerichte titels, NL/FR/DE-vertalingen, JSON-LD voor persoon/boek/website, taalcorrecties en labelcontrast. De browser controleert de dynamische titel, auteursregel en Franse typografie. De bestaande model-, consent-, cache-, WebKit-, toegankelijkheids- en releasecontroles blijven gelden. De vertalingen blijven zuivere JSON-data voor de beveiligde buildparser. De McKinsey-update is gecontroleerd tegen de editie van 25 augustus 2026; bestaande exhibits houden hun oorspronkelijke jaartal. Actuele testresultaten worden afzonderlijk vastgelegd; eerdere pakketcijfers worden niet als bewijs overgenomen.


## Praktijkreflecties, concept

transformation.html is een secundaire leesroute, bereikbaar vanaf de homepage, auteurspagina en Inzichten. De build neemt de pagina expliciet op; de hoofdmenu-casussen blijven dezelfde acht bestemmingen. De gewone-paginatest controleert nu dertien pagina’s met het gedeelde menu.

De praktijkroute wordt ook in de kritieke browsermatrix getest: drie taalwissels met titel en inhoud, zes invalshoeken, geen horizontale overloop, ankers en de routes vanaf homepage/auteur/Inzichten naar Contact. De automatische WCAG-scan omvat de nieuwe pagina op desktop en mobiel. Geen retries, skips of vrijgavegrenzen zijn voor dit concept versoepeld. Een lokale selectie is geen bewijs dat de volledige CI-, Lighthouse- en productiecontrole gedraaid heeft.

Bronbestanden en interne bronnotities maken geen deel uit van het bouwpakket. De praktijkteksten zijn redactionele syntheses; ze presenteren geen beoogde programmabaten als persoonlijke gerealiseerde resultaten. Inhoudelijke goedkeuring van de ik-formuleringen gaat vooraf aan publicatie.


## Visie uit het manuscript

De centrale leesroute loopt van de homepage naar coherence.html#book-thesis, vervolgens naar about.html#book en de bestaande manuscriptaanvraag. De praktijkreflecties verbinden historische transformatievraagstukken met actuele AI-vragen. De permanente browserdekking controleert de centrale redenering in drie talen, de primaire Ross-bronverwijzingen, de leesroute en de runtime mailto-aanvraag zonder een bericht te openen of te versturen. De vier gewijzigde inhoudspagina’s vallen onder de bestaande WCAG-scans. Scorelogica en releasegrenzen blijven behouden; de scorekaart vermeldt nu expliciet haar beperkingen tegenover het interactiegerichte manuscriptmodel. De volledige bron-PDF’s worden niet in het bouwpakket opgenomen.


## Executive contactpresentatie

De contactpagina gebruikt Erlend Hollebosch als enige hoofdtitel, met een portret in de introductie, contact- en boekankers en de bestaande manuscript- en mailroutes. De vaste browserregressie controleert drie talen, portretbeschikbaarheid, horizontale overloop, ankers, de mailbestemming en terugkeer via het hoofdmenu. De bestaande boek- en praktijkroutes en WCAG-scan blijven van toepassing. De gewone Contact-navigatie opent about.html bovenaan; nieuwe hero-acties naar #contact en #book zijn bewuste inhoudelijke shortcuts. De presentatie voegt geen externe dienst toe.


De executive contactpagina valt ook onder de drie koude Lighthouse-metingen per mobiel en desktop. De nieuwe praktijkroute staat in de sitemap. Vrijgave vindt pas plaats nadat de volledige controleketen voor de gepubliceerde revision geslaagd is.


De vrijgave verwijdert dubbele initiële renders van specificatie, diagnose, simulator en procesdiagram: de eerste render gebeurt via de opgeslagen taalinstelling. Een permanente browserregressie observeert één initiële scorekaartrender en een volgende render bij taalwissel. De mobiele profielafbeelding gebruikt een compacte weergave en passende responsive beeldselectie; desktop behoudt het grote portret. De prestatiedrempels blijven ongewijzigd.

## Redactionele leesroutes en drie talen

De homepage biedt visie, praktijk en toepassing als korte leesroutes, plus het boek en een geselecteerd artikel. Koppen en introducties onderscheiden hypothese, onderzoek en scenario-aannames. De rekenmodellen en vrijgavedrempels zijn niet gewijzigd. Bestaande homepagefragmenten blijven als ankers bestaan.

Engels, Nederlands en Frans zijn de enige aangeboden talen. Duits is verwijderd uit menu’s, vertaaldata, inhoudsblokken, metadata en de simulatie. Een opgeslagen Duitse of ongeldige voorkeur migreert naar een ondersteunde browsertaal of Engels. De browserregressies volgen de drie routes en het artikel in alle drie talen en testen de oude Duitse voorkeur, ook in de simulatie. De bestaande actieve-taaltests blijven behouden voor EN/NL/FR; de vervallen Duitse positieve scenario’s zijn vervangen door negatieve migratiedekking.

De kortere homepage gebruikt geen grote content-visibility-placeholders voor de leeskaarten en het boek. De oude #final-link verwijst naar de echte afsluiting en krijgt browserdekking in drie talen. De boekomslag reserveert zijn beeldverhouding. De blijvende Lighthouse-CLS-grens van 0,1 bewaakt de initiële lay-out, ook met een nog niet beantwoorde cookiedialoog. Het eerste lokale rapport met desktop-CLS circa 0,147 is bewaard.
Het besliskader initialiseert de standaardinvoer zonder een eerste Engelse tekening. applyLang rendert de matrix eenmaal in de gekozen taal; ook de eerste menumeting gebeurt daar. De bestaande regressie observeert zowel matrix als scorekaart: één render bij initialisatie, twee na taalwissel. De modelberekeningen, standaardwaarden en prestatiegrenzen blijven gelijk.
