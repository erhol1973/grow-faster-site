# Testplan en kwaliteitsbeleid

## Contentstudio, 8 november 2026

Het CMS voegt afzonderlijke concepten en gepubliceerde snapshots toe aan de bestaande Supabase-structuur. De blijvende clienttests controleren sessies, beheerderscontrole, revisieconflicten en uploads. PostgreSQL-tests voeren de werkelijke migratie en RLS uit met nagebootste Supabase Auth-claims en Storage-metadata: geen conceptlek, geen zelfpromotie, geen publicatie door gewone gebruikers, behoud van de vorige publicatie en onveranderlijke uploadpaden. Dit bewijst nog geen live Auth- of Storage-werking.

De CMS-browsergevallen controleren desktop en mobiel, weigering van gewone accounts, opslaan vóór publiceren, privévoorbeelden in de echte pagina, veilige tekstweergave, NL/FR en toegankelijkheid. De gewone lokale browserserver schakelt alleen de externe CMS-configuratie uit via `--cms-test`; gerichte CMS-gevallen gebruiken een synthetische API. De cachefixture gebruikt echte HTTP-cacheheaders en geen browserrouting. De oorspronkelijke releasegrenzen blijven ongewijzigd. Exacte resultaten en onvolledige controles staan in `docs/CMS-VERIFICATION.md`.



## Maandblad: taal, terugkeer en leesbediening, 7 november 2026

Het promotieblok toont uitsluitend de gekozen NL/FR-taal en de bijbehorende leesknop. De teruglink opent dezelfde rubriek op de website in de taal van de lezer. Bladerpijlen staan naast de liggende pagina; A−/A+ vergroot de leespagina zonder vaste bediening of inschrijving te verbergen. Browsergevallen controleren beide taalroutes, terugkeer, zijpijlen op desktop/mobiel en vergroting. Alle dertig pagina’s, broncijfers en de bestaande kleur- en volgordecontroles blijven getest.


## Alleen Nederlands en Frans, 7 november 2026

De Engelse taalkeuze is van de hele website verwijderd. De taalmenu's, de ECA-keuzelijst, de workshop, de simulator, de boeklezer en de metadata ondersteunen alleen nog NL-BE en FR-BE; Nederlands is de standaard. Een opgeslagen of gevraagde Engelse voorkeur (`avs-lang=en`, `?lang=en`) valt veilig terug op Nederlands. De Engelstalige inhoudsblokken op Coherence, Inzichten, Privacy, Voorwaarden en Toegankelijkheid zijn verwijderd; Engelse bronzinnen blijven alleen bestaan als vertaalsleutel. Het Engelse HubSpot-formulier wordt niet meer gebruikt. De boeken zelf blijven Engelstalige uitgaven en houden `lang="en"` en `inLanguage: "en"`.

Blijvende dekking: unit- en artifacttests weigeren `data-lang="en"`, `en_GB`, een Engelse ECA-optie en Engelse taalblokken; de ECA-taalresolutie test de terugval van Engels naar Nederlands. Browsertests controleren de terugval van een oude Engelse voorkeur, het menu met twee talen en de ECA zonder Engelse optie. Taallussen in de bestaande scenario's lopen nu over NL/FR; geen casus is verwijderd zonder vervanging en geen drempel of timeout is gewijzigd.

De eerste CI-run (42384203640) slaagde voor alle browserscenario's maar faalde op Lighthouse: mobiele CLS 0,103 op Home en Inzichten. Oorzaak: de statische HTML is Engels en wordt na het laden naar het Nederlands vertaald, waardoor de hero verschuift. Dat raakte vroeger ook NL/FR-bezoekers, maar CI mat alleen Engels. Oplossing: `main` blijft onzichtbaar tot site.js de taal heeft toegepast (`html.i18n-ready`), met een `noscript`-uitzondering en een CSS-terugval na 2,5 s als het script faalt. Lokaal daalt de mobiele CLS naar 0,002 bij ongewijzigde LCP. De drempel van 0,1 is niet aangepast. Een unit-test bewaakt de guard in elke vertaalde pagina; een browsertest controleert dat `main` zichtbaar wordt.

## Maandelijks Executive Journal
De browsertest volgt Executive Journal vanaf Home, schakelt NL/FR op dezelfde pagina en controleert bronlinks en de cartoon. De lokale belastingtest bezoekt per worker minstens eenmaal elke route, inclusief beide taalversies en de nieuwe lezerbestanden. Het bestaande minimum en de p95-drempel blijven van kracht.

## Blauwe executive preview, 4 november 2026

De negen aangeleverde pagina's van The Coherent Enterprise vervangen de oude oranje/koperen PDF op dezelfde URL. De knoppen op Home, Boeken en Over Erlend openen een afzonderlijke flipbookroute. Checksums bewaken de exacte PDF en de negen gerenderde afbeeldingen; browserregressies controleren de Nederlandse knop, mobiel/desktop, bladeren, laatste pagina, vergroten, focusherstel, fallback en WCAG. De bestaande handbookreader blijft apart getest. De lokale loadlijst voegt de nieuwe route, eerste/laatste afbeelding en PDF toe binnen de bestaande 36 verzoeken per worker en ongewijzigde latencygrens.

## Bladerbare boekpreview, 3 november 2026

Home, Boeken en Over Erlend openen de aangeleverde online lezer met 25 previewpagina’s plus afsluitpagina. De 26 JPEG-bestanden blijven exact gelijk aan de ZIP. Blijvende tests controleren checksums, lokale afhankelijkheden, desktop-spreads, één pagina op mobiel, de daadwerkelijke homepageklik, vergroten/Escape/focus, de laatste pagina en terugval bij een ontbrekende bibliotheek. De bestaande PDF blijft bereikbaar voor oude gedeelde links. Zie BOOK-READER.md. De lokale loadlijst neemt de nieuwe route en assets mee; alle bestaande releasegrenzen blijven behouden.

## Vrij boek, 2 november 2026

Vijftien gewone pagina's delen het bestaande viercategorieënmenu. Boeken vervangt Visie & boek binnen Enterprise Coherence en opent books.html. De nieuwe pagina, haar route naar Contact, de publicatie-assets en de volledige vrijwillige download zijn toegevoegd aan de gedeelde menu-, HTTP-, load-, budget-, browser- en toegankelijkheidscontroles. Lighthouse voegt books.html toe met drie koude samples per mobiel en desktop. Zie BOOKS.md voor de twee publicaties en de gegevensgrenzen. Oude preview- en manuscriptverzoeken blijven getest. Een publicatie-checksum voorkomt dat een onbedoeld gewijzigd of onvolledig bestand de goedgekeurde uitgave vervangt.

## Executive werksessie, 1 november 2026

Veertien gewone pagina’s delen vier inhoudelijke hoofdrubrieken en één directe werksessieknop. Enterprise Coherence groepeert visie/boek, bedrijfswaarde, procesherontwerp en operating model. Aanpak groepeert roadmap, besliskader en de vrije ECA. Inzichten en Over Erlend zijn directe links. Het logo opent Home. De werksessieknop is op mobiel de eerste actie in het geopende menu. Op Aanpak blijft de verwijzing in de hero. Home, Aanpak, Contact, Tools en de ECA-uitslag leiden naar het aanbod. De functionele workshopkern draait op de vijf bestaande browserprofielen. Uitgeklapte voorbeelden, praktische vragen en e-mailconcepten krijgen aanvullende WCAG-scans in EN/NL/FR op desktop en mobiel Chromium.

De ECA-route geeft uitsluitend de taal door. De gerichte aanvraag opent een vrijwillig e-mailconcept, met verplichte vraag, veilige codering, taalwissel zonder verlies van invoer, klembordterugval en direct contact zonder JavaScript. Tests onderscheppen mailto-acties; ze versturen geen berichten. Er wordt geen contact- of ECA-inhoud opgeslagen of aan analytics of HubSpot toegevoegd.

De nieuwe pagina en twee assets zijn toegevoegd aan dezelfde 288 lokale loadverzoeken en aan de transferbudgetten. Lighthouse meet ook workshop.html met drie koude samples per mobiel en desktop. Bestaande drempels, retries en skipredenen zijn ongewijzigd. Zie WORKSHOP.md voor het goedgekeurde aanbod en de gegevensgrenzen.

Op 2 november is de vindbaarheid aangescherpt: de functionele browserkern controleert het rechtstreekse menu-item zonder paginascroll, de actieve menustatus en de volledig zichtbare knop in de Aanpak-hero, in drie talen. De extra workshopvermelding in losse load-, budget- en WCAG-lijsten is vervallen omdat dezelfde route nu via de gedeelde menucasussen wordt meegenomen. De unieke routedekking en de bestaande grenzen blijven behouden; er wordt geen identiek scenario dubbel geteld.

De volgende menurevisie vermindert de negen gelijkwaardige links tot vier categorieën en één actie. navigation-cases.json beschrijft de vier primaire links, de werksessieactie, de zeven gegroepeerde links en de negen bestaande bronpagina’s voor de regressiematrix. Alle oorspronkelijke routes naar Contact blijven getest, inclusief de drie verdiepingspagina’s via hun uitklapmenu en Home via het logo. Nieuwe functionele scenario’s testen EN/NL/FR, echte tikken op de mobiele profielen, actieve categorie/pagina, wisselen tussen groepen, Escape en focusherstel, buiten klikken, taalkeuze, resize en de ECA-route. De twee overzichtspagina’s herhalen de submenuverwijzingen als gewone links; de route blijft zonder JavaScript bruikbaar. Aanvullende axe-scans controleren beide geopende groepen in drie talen op desktop en mobiel.

Een eerste lokale ronde vond dat het sluiten tijdens focusout de volgende knop op mobiel tussen pointerdown en pointerup kon verplaatsen. Groepen sluiten daarom bij activering van een andere groep of bij het verlaten van de volledige navigatie. De scenario’s behouden echte klik-/tikacties en standaardtijdslimieten. Oude-HTML-dekking gebruikt een vastgelegde negenlinksheader met het vroegere Contact-fragment en ontbrekende supportmodules, zodat actuele markup de compatibiliteitscontrole niet kan maskeren.

Menulinks hebben expliciet tabindex="0", zonder positieve tabindices. De Safari-testbrowser sloeg native links bij Tab standaard over; de ongewijzigde toetsenbordcasus test nu ook daar de eerste submenuverwijzing en het Escape-focusherstel. Browserinstellingen en testverwachtingen zijn hiervoor niet aangepast.

De eerste volledige PR-run 41464395805 telde 485 geslaagde gevallen, vijf fouten en twaalf bestaande skips. De vijf fouten betroffen dezelfde bestaande Home-ECA-leesroute: haar globale a[href="eca.html"] vond door het nieuwe menu twee links. Die casus kiest nu expliciet de oorspronkelijke link in main; de nieuwe submenu-route heeft eigen aanvullende dekking op alle vijf profielen. Alle taal-, twintig-vragen- en ungated-asserties blijven behouden. Geen geval, timeout of retryregel is verwijderd of versoepeld; het oorspronkelijke rapport is bewaard.

navigation.css heeft een afzonderlijk budget van 8KB en wordt meegenomen in de lokale loadscenario’s. De bestaande CSS-/JS-/HTML-budgetten, 288 requests, 1.500ms-grens, Lighthouse-drempels, retries en skipredenen zijn ongewijzigd. De publieke nacontrole controleert ook de vier hoofdrubrieken en de gegroepeerde route naar de anonieme ECA zonder een contactformulier te openen.

Tests onderzoeken hetzelfde gebouwde `dist`-pakket dat wordt gepubliceerd. Ontwikkelbestanden en rapporten blijven buiten de website. Elke foutoplossing en nieuw gebruikerspad krijgt passende blijvende regressiedekking. Aantallen alleen zijn geen kwaliteitsmaatstaf.

| Laag | Dekking |
|---|---|
| Unit | Werkelijk gebruikte modellen: coherentiefactoren, vier besliskwadranten, risico/readiness, capaciteit, cashflow, break-even en procesgeometrie. Onafhankelijk uitgerekende rechte, parallelle en teruglopende paden; geen gekopieerde implementatie in tests. |
| Negatief | Ongeldige/lege scores, NaN/Infinity, negatieve waarden, percentages buiten bereik, nulvolume, onbekende nodes. Strikte consentversie, boolean-types, ouderdom en toekomstige timestamps. |
| HTTP/integratie | Echte server: GET/HEAD, MIME, gzip, 404, geweigerde schrijfmethoden, misvormde URL, NUL/backslash en traversal. Alle menu's, assets, fragmenten, unieke IDs, syntax en metadata. |
| Browser/E2E | Alle negen routes naar Contact vanaf bovenaan en na scrollen, herhaald Contact, toetsenbord, footer, geschiedenis; drie talen, echte taalwissels, artikelen/deeplinks, calculatorinvoer en simulator. |
| Consent | Weigeren, gedeeltelijk/volledig toestaan, intrekken, opnieuw toestaan en intrekken tijdens een vertraagde download. Externe diensten zijn gestubd: dit test ons contract, niet alle leverancierscode. |
| Cache | Echte ETag/304, versiewissel en oude HTML met actuele scripts. Back/Forward en feitelijke pageshow.persisted worden vastgelegd. Geen routingmocks die de browsercache uitschakelen; BFCache wordt niet kunstmatig afgedwongen. |
| Toegankelijkheid | Axe op negen menuwebpagina's, dialoog en simulator, Chromium desktop/mobiel, WCAG A/AA 2.0/2.1/2.2 en contrast. Uitgestelde inhoud wordt voor scans gerenderd. Ook toetsenbord, focus, tablet en 200% tekst. |
| Load | Uitsluitend lokaal: 288 verzoeken met acht workers, alle menuroutes, ECA met zijn vier scripts, simulator, CSS/JS en verwachte 404. Geen fouten of ontbrekende routes, p95 maximaal 1.500ms. |
| Performance | Bestandsbudgetten plus drie koude Lighthouse-runs per Home/Coherence/Aanpak/Contact/ECA op mobiel en desktop; individuele rapporten en medianen. Na browsersuite, zonder gelijktijdige loadtests. |
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

De main-publicatierun 41444996822 blokkeerde op een instabiele Firefox-klik naar het geselecteerde artikel. De trace en lokale meting tonen een scrollcorrectie van 14px tussen mousedown op de link en mouseup op de omringende kaart, bij een laat ladende boekomslag. De bestaande leesroute faalde lokaal vier van acht keer. Alleen de editorial-home schakelt daarom scroll anchoring uit; de expliciete beeldruimte blijft behouden. De nieuwe browsercasus houdt de omslag tegen tot de muis is ingedrukt, wacht op beelddecodering en controleert zowel de onverplaatste link als het geopende Nederlandse artikel. De bestaande routes in drie talen, timeouts, retries en vrijgavegrenzen blijven behouden. De mislukte CI-rapporten en lokale traces blijven beschikbaar.
Het besliskader initialiseert de standaardinvoer zonder een eerste Engelse tekening. applyLang rendert de matrix eenmaal in de gekozen taal; ook de eerste menumeting gebeurt daar. De bestaande regressie observeert zowel matrix als scorekaart: één render bij initialisatie, twee na taalwissel. De modelberekeningen, standaardwaarden en prestatiegrenzen blijven gelijk.

## Leesbaarheid en interacties, 1 november 2026

De homepage sluit af met een vooruitlink naar Enterprise Coherence. In de 10–20–70-grafiek zijn alleen 10% en 20% knoppen: activeren vergroot het vak, een tweede activering of Escape sluit het detail. Native toetsenbordbediening, aanraakbediening, zichtbare focus en reduced-motion blijven beschikbaar. De 70% is statisch. De simulatie-intro toont twee organisatiecontexten en een conceptuele formule in drie stappen; het rekenmodel blijft ongewijzigd. De actuele meetwaarden gebruiken vaste numerieke kolommen.

De operating-modeltekst is teruggebracht van 789 naar 358 woorden in de statische Engelse hoofdinhoud (54,6% reductie); een blijvende bovengrens bewaakt minimaal 40% reductie. Alle vijf beslisvragen en de interactieve autonomieschaal blijven bestaan. De drie talen worden behouden. Namen van onderzoekers staan in de formele bronvermelding, niet meer in promotionele koppen of de auteurskaart.

Inzichten heeft zes kaarten en zes adresseerbare artikelen. De twee nieuwe stukken over uitzonderingsroutes en het benutten van vrijgekomen capaciteit zijn in EN/NL/FR toegevoegd. De bestaande standaardselectie, deep links en browsergeschiedenis blijven getest. Het oude vierkaarten-aantal is aangepast naar de zes gevraagde artikelen; er is geen scenario verwijderd. De oude auteurskaarttest controleert nu de neutrale link; de primaire MIT-broncontrole blijft behouden.

Lokale controle: build, 55 unit-/HTTP-tests en artifact-security slagen. De gerichte desktop-/mobiele browserselectie telde 46 geslaagde gevallen en vier bestaande, gemotiveerde desktop-only skips; de acht nieuwe interactiegevallen slagen ook afzonderlijk. Een eerdere desktopnavigatie had een laadtimeout. De eerste loadrun had 24 timeouts en een event-loopmaximum van circa 40 seconden; een latere geïsoleerde run had 0 fouten op 288 requests en p95 circa 170ms. De eerdere mislukking blijft hier gedocumenteerd; een herhaling alleen bewijst geen opgeloste oorzaak. Nieuwe loadruns bewaren hun rapporten voortaan apart in load-history. De volledige vijf-browsermatrix, Lighthouse en CI blijven vrijgavevoorwaarden. Geen main-merge of deployment voor deze wijziging.

## Afronding ECA

De ECA ondersteunt EN/NL/FR zonder antwoorden te verliezen bij een taalwissel. De browsercontrole vergelijkt alle twintig vragen met hun Engelse brontekst, bewaakt de score bij wisselen en scant vragen én uitslag met axe in alle drie talen, op desktop en mobiel. De native HubSpot-vorm blijft Nederlandstalig zoals gepubliceerd; dat wordt vooraf vermeld. Twee leesroutes leiden naar de vrije diagnose. Ongeldige niet-scalaire modelinvoer wordt geweigerd.

Gedeelde laagste scores gebruiken de expliciete bestaande-propertykeuze multiple_constraints. De live terugkerende-contacttest controleerde eerst 65/100 met een unieke strategische beperking, daarna 75/100 met gedeelde dimensies op hetzelfde contact. Beide inzendingen gebruikten de native verwerkingstoestemming zonder marketingtoestemming. De terugleescontrole van het contact bevestigde dat de eerdere unieke beperking vervangen werd. Zie ECA-HUBSPOT.md voor het contract en de gegevensgrenzen.

De optionele formulierloader blijft begrensd op 60 seconden om ook tragere initialisatie tussen browserframes toe te laten. De browsertest gebruikt een gecontroleerde klok voor een leverancier die nooit gereed komt, controleert de behouden anonieme uitslag en weigert een laat ready-event na de fout. Dit verandert geen releasebudget of retrybeleid. Alle 58 unit-/HTTP-tests slagen met dezelfde Node 24-runtime buiten de beperkte lokale netwerkomgeving; eerdere fouten blijven als historie beschikbaar. De drie volledige GitHub-gates slaagden voor 0e23e92; de definitieve revision wordt opnieuw volledig gecontroleerd.


## Correcties ECA-vragenlijst

Alle twintig vragen vereisen een expliciete keuze; N/A blijft ongescoord en de minimale numerieke dekking blijft gelijk. Model- en browsertests onderscheiden ontbrekende antwoorden van expliciete N/A. De browser controleert foutmelding/focus, normaal vraaggewicht, genummerde antwoordlabels, compacte antwoordhoogte, de echte contactbestemming en de oude deep link. De kritieke matrix controleert de taalafhankelijke native formulier-ID voor EN/NL/FR; axe scant vragen en uitslag in alle drie talen op desktop en mobiel. Native taalvarianten zijn expliciet toegestaan door de eigenaar en behouden het propertycontract en optionele marketingtoestemming. De alleen-lezen livecontrole ondersteunt --lang=en, --lang=nl en --lang=fr.


Antwoordlabels ECA: op verzoek zijn de zichtbare cijfers en punten verwijderd in EN/NL/FR. De bestaande browserverwachtingen volgen de nieuwe tekst en controleren alle antwoordlabels op numerieke voorvoegsels. Vraagnummers en onderliggende scorewaarden blijven gelijk.

De eerste label-PR-controle blokkeerde op één instabiele mobiele WebKit-casus: een gesimuleerde tik tijdens de automatische resultaat-scroll activeerde het formulier niet. Trace en foutbeelden blijven bewaard. De resultaat-overgang scrolt nu direct en geeft de uitslagkop focus; de bestaande scenario’s controleren die focus voor de eerste formulierklik. Geen wachttijd, retry of vrijgavegrens is verruimd. De nieuwe focuscontrole faalde eerst op de oude implementatie.

De tweede CI-uitvoering blokkeerde op WebKit-tikken na de validatiefocus naar de eerste vraag. De ECA schakelt daarom ook de overgeërfde algemene smooth-scroll uit voor alle impliciete focus- en ankerovergangen. De bestaande validatie-/selectietest controleert de berekende scrollstijl; die controle faalde op de oude smooth-stijl. Klik-/check-acties, timeouts, retries en alle vrijgavegrenzen blijven behouden. Beide mislukte CI-rapporten worden bewaard.

## Work with me, Home in the menu and book presentation, 3 November 2026

The home hero states the role (Enterprise & AI Transformation Lead) and availability in Belgium, and its single primary action opens the two routes on `about.html#work-with-me`: a permanent role and a long-term assignment. Each route opens the visitor's email with a short template in English, Dutch or French; the template follows a language switch without reload, and the address itself stays assembled at runtime. Coverage: `tests/work-routes.test.cjs` (hero action, both routes, localised templates, translations) and browser cases for the hero route in three languages and the language switch.

Home is now the first item of the main menu on every page; `tests/navigation-cases.json` lists it first among the primary routes, so HTTP navigation, Contact, accessibility, load and performance coverage follow automatically. `scripts/verify-production.cjs` now expects Home plus four categories.

Both books on `books.html` share the same structure (cover, label, title, subtitle, summary, three takeaways, action, meta, access) and are shown as 3D book objects. *Design for Coherence* uses a new transparent mockup (`img/design-for-coherence-book-*.png/.webp`) on Home, About and Books. Coverage: `tests/books.test.cjs`.

## Executive Journal, trackrecord en menu, 6 november 2026 (demo-branch)

Doel: de site richt zich op werkgevers en recruiters. Het hoofdmenu bevat nu Home, Executive Journal (insights.html), Enterprise Coherence (groep), Aanpak (groep) en Trackrecord (transformation.html), plus één actie: Samenwerken (about.html). Contact opent nog steeds about.html bovenaan, zonder fragment. De werksessie is bewust geen menu-actie meer. Ze blijft bereikbaar via de Aanpak-hero, Home, Over Erlend, de footer en de ECA-uitslag. `navigation-cases.json` is bijgewerkt. workshop.html staat niet meer in `pages`, omdat het geen menubestemming meer is. Daarom is de pagina expliciet toegevoegd aan de axe-routes, het 85KB-HTML-budget en de lokale loadroutes. De workshopspecificatie controleert nu dat het menu géén workshoplink bevat en dat de Aanpak-hero zonder scrollen naar de werksessie leidt. De Contact-route vanaf de werksessie blijft gedekt via de bestaande gedeelde-navigatiecasus in workshop.spec.

Executive Journal in HBR-stijl: één hoofdartikel en daarna de nieuwste stukken. Elk artikel opent met een blok "In het kort" (probleem, oorzaak, actie) en sluit af met een auteursblok dat naar de werkroutes en het trackrecord verwijst. De drie meertalige artikels hebben dat blok per taal; de overige drie gebruiken I18N. `journal.css` (eigen budget van 6KB, zonder externe requests) bevat de redactionele laag. site.css bleef onder 125KB. De serif is een systeemletter, dus er wordt geen extra lettertype geladen. De homepage toont ervaring (een strook met organisaties) direct na de hero en drie journal-artikels na het geselecteerde artikel. #selected-insight behoudt precies één link voor de bestaande Firefox-scrollcasus. transformation.html heeft een ankerbaar trackrecord (#track-record) met jaartallen, certificeringen en opleiding. De klasse heet `career`, omdat `.track` al in site.css bestaat.

Lokaal kregen de bestaande 36 routes er de journal-stylesheet en de werksessie bij. Elke worker doet daarom `max(36, routes)` verzoeken; daarmee wordt elke route minstens één keer bezocht (296 in totaal). Er is geen grens verlaagd. Lighthouse meet nu ook insights.html. De Franse menuvertaling van "Work with me" is "Collaborer", omdat "Travailler ensemble" op 1440px het compacte menu forceerde.

Lokaal bewijs: 79 unit-/HTTP-tests, artifact-security, load (296/0 fouten) en Chromium desktop/mobiel (volledige suite) slagen met de systeem-Chrome. Firefox, WebKit, Lighthouse en CI zijn lokaal niet gedraaid en blijven voorwaarden voor vrijgave. Inhoudelijke goedkeuring door de eigenaar volgt vóór publicatie, in het bijzonder voor de jaartallen en rollen in het trackrecord en de samenvattingen in "In het kort".


## Coherence film and layout, 8 November 2026
NL/FR film playback, poster/caption matching, no autoplay, narrow left-aligned landscape player, left-aligned Trackrecord/Operating model/ECA and the four approved next-page destinations are covered on all five browser profiles. Unit/HTTP tests enforce 15 MiB video limits and valid/invalid byte ranges. Local load adds the small film scripts, captions and posters; large video payloads are tested with HTTP byte ranges and real browser playback. Caption text follows the supplied transcript; final human listening and physical-device accessibility remain manual checks. Existing gates and thresholds are unchanged.

The final media is the user-supplied 23-second commercial, shared by both locales. Dutch/French captions translate the two supplied English dialogue lines and the visible English end card; office ambience/music is labelled. Caption timing follows the supplied approximate dialogue timings. Old VR-dialogue captions are removed.

## Original 44-second commercial — owner-approved budget, 9 November 2026

The owner explicitly requested preserving the uploaded video exactly and then authorised changing its size limit. Only media/grow-faster-commercial-final-44s.mp4 now has a 22 MiB budget (previously 15 MiB); its actual size is 21,549,033 bytes. A permanent byte-count and SHA-256 regression preserves the original upload, including all 44 seconds and its original audio. Playback-to-ended and absence of subtitle tracks remain required. This supersedes the earlier 23-second/caption notes for this film. Other budgets and release gates remain unchanged. This budget change does not authorise a merge or production deployment; outstanding release gates and preview range-delivery verification still apply.


Release authorisation, 9 November 2026: the owner subsequently requested production publication after the required checks pass. Main integration retains the publication-identity fixture and updates it to the exact approved 44-second upload, superseding the prior 23-second identity. No other release gate is waived.

## CMS integration acceptance, 9 November 2026

Main a8fae016 and CMS head 00559b7 are integrated without dropping the 44-second playback-to-ended/no-subtitle assertions or the Coherence immediate-scroll regression. CMS browser coverage now explicitly dismisses and accepts publication confirmation, rejects publication before preview, and checks that filtering preserves every NL/FR text field including hidden edits. The public website supports NL/FR only; no English editor is introduced. Existing thresholds and retries are unchanged.

No release is authorised by this integration. Live Supabase publication tests must not use the shared production database. The prior accidental Books publication was withdrawn with exact identity/timestamp and unchanged draft/history checks; do not repeat that deletion. Real isolated Auth/Storage acceptance remains a release blocker.
CodeQL integration review: preview language URLs now use fixed NL/FR suffixes rather than concatenating a DOM-controlled value. A browser regression injects an unsupported selector value and verifies the NL fallback; no scanner rule is suppressed.

## Mobile cache compatibility and Lighthouse coverage, 9 November 2026

The temporary mobile cache-transition skip is removed. A retained local failure trace showed that the current wordmark in legacy navigation markup pushed the hamburger outside the mobile viewport. Wordmark dimensions now apply to both legacy and executive navigation; the existing cache scenario also asserts that the hamburger is in the viewport before opening it. No forced click, timeout increase or retry change is used.

Lighthouse now collects accessibility and SEO alongside performance for every existing route, mode and sample, and retains scores in JSON/HTML and median summaries. Existing performance thresholds and axe accessibility assertions remain unchanged. Accessibility/SEO scores are evidence for release review, not an automatic waiver of audit findings. Real isolated Supabase acceptance remains outstanding; no production writes or release are authorised.

## Dependency security follow-up, 9 November 2026

A targeted pnpm update of the transitive @sentry/node dependency within Lighthouse's existing supported range updates Sentry to 11.11.0, glob to 14.0.4 and minimatch to 11.0.5. Direct package versions, browser versions, audit thresholds and package-manager version remain unchanged; no override is introduced. Frozen-lockfile installation and Lighthouse import pass; pnpm audit reports zero advisories.

Three local Windows/system-Chrome homepage mobile samples after the update report accessibility 100 and SEO 100 each. Performance scores 83/82/88 (median 83), median LCP 2561.71 ms and median TBT 432 ms fail the existing limits; these results are retained and are not green release evidence. Full pinned Linux CI on the final head is still required. Live read-only Home/Books/Coherence continue to match main a8fae016; anonymous REST reveals no drafts/publications and denies history. No production writes occurred.

## Isolated CMS preview, 9 November 2026

The exact feature-secure-supabase-cms.grow-faster-site.pages.dev hostname selects growfaster-test for all CMS clients, including page previews and public media. Production keeps its existing project. No URL parameter can choose or override an environment. The editor displays TEST on the isolated host; recovery is disabled there pending a separate redirect review. Admin CSP permits the two explicit project origins without wildcards. New configuration regressions verify preview routing, production preservation, lookalike-host rejection and URL-override rejection. The public test project key is publishable; no privileged key or password is added. Real Auth/Storage acceptance is still pending and production release remains NO-GO.

## Isolated acceptance and conflict fix, 9 November 2026

Actual test-project evidence (gqsvoioccvklzfmdmexy only): ordinary account denial was shown by the owner; the authorised administrator session saved a Books NL/FR marker, both actual-page previews displayed it, and anonymous publications stayed empty before confirmation. A confirmed publication produced one snapshot and one history version for section d24e0505-b003-4288-8c31-c83f80834ef2. Anonymous page/API delivery showed the published marker; a later private draft did not replace or leak into it. The first interrupted confirmation attempt left no publication.

A real stale-revision save timed out with SQLSTATE 40001 on PostgREST 14. Supabase documents its retry loop: https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b . Follow-up migration 20261109_cms_conflict_http409.sql preserves both RPC definitions and changes only business-conflict SQLSTATE to PT409. Applied only to growfaster-test; the same stale browser save then returned the actionable conflict message and retained its local text. PostgreSQL regression coverage checks both stale save and stale publish use PT409.

Real private JPEG upload succeeded at 62e2d7fb-8caa-40b2-9103-da8eae457143.jpg; actual-page preview loaded its signed URL (naturalWidth 1152). Anonymous unsigned download and anonymous signing both returned Object not found. Signed URL expiry, direct gateway MIME/size rejection, and later publication of uploaded media remain unverified. The upload remains in the test bucket; the browser retains unsaved local conflict text/media. No production writes, deletions, merges or deployments occurred. Production still requires the follow-up migration as a separately reviewed release step. Full CI must pass on the new head; release remains NO-GO.

## Real isolated Storage gateway runner

`scripts/accept-cms-storage.cjs` is a standalone Node 22+ interactive acceptance runner, fixed to growfaster-test (gqsvoioccvklzfmdmexy). Run `node scripts/accept-cms-storage.cjs` locally and enter the test administrator password in the hidden terminal prompt. No environment override, production project, privileged key, password argument or token logging is supported. Its own Auth session is signed out with scope=local; other sessions are not revoked. It uploads one valid synthetic PNG and directly tests forbidden SVG MIME plus a 26214401-byte PNG payload against the unchanged bucket limit. It also verifies both rejected paths cannot be signed. Objects are unique and no overwrite/delete operation is performed. The valid test-object path and sanitized results are printed. Real results remain pending until the owner enters the credential locally. Unit coverage rejects permission/service failures as false positive bucket enforcement. Existing browser session and previous evidence do not substitute for this gateway test. No production baseline/migration/merge/deployment is authorised until this gate and all remaining gates pass.

## Main integration and real gateway result, 10 November 2026

The owner ran the committed standalone Storage runner against growfaster-test from 09:56:07Z to 09:56:18Z. Reported results: real administrator Auth and allowed PNG upload passed; forbidden MIME returned HTTP 400 InvalidMimeType; a 26214401-byte payload returned HTTP 400 EntityTooLarge; both rejected paths had no signable object. Valid test object: 91499af0-9305-4ec5-9168-3db046147e05.png. This is owner-executed evidence, not an agent rerun. It supersedes the earlier pending direct-gateway notes.

Main 30077526 (approved PR60 homepage release) is integrated. index.html retains its approved hero photograph, responsive markup, headline/subheadline and CTA destinations; CMS hooks are reapplied without changing that markup. Three text fields removed by the approved layout are removed from the editor catalog only; remaining homepage groups cover all 49 current fields. New NL/FR defaults follow main, and preview/public heading rendering preserves the minimal hero line break without the former emphasis element. Existing browser regression retains safe rendering, both lines and explicit publication confirmation, now checking the actual approved br structure. All regression tests from main are retained. No database content was deleted or production migration applied.

The previous website gate passed 113 unit/integration tests, 624 browser cases (12 profile-specific skips), load and Lighthouse; CodeQL passed. Secret-history flagged the runner's publicly documented sb_publishable key. The existing generic-api-key rule is retained with one additional AND-constrained exception: the exact scripts/accept-cms-storage.cjs path and exact verified public test key only. No secret/service-role keys or unexpected strings match this exception. Full CI on the integration head remains required.

Local integration checks verify exact preservation of main markup after removing additive CMS hooks, catalog/DOM key equality and uniqueness, complete field-group coverage, and script parsing. The earlier Windows git checkout is unavailable in the active cloud workspace; local unknown changes were not overwritten. Remaining gate: publish uploaded test media via the editor and verify anonymous byte delivery, plus final-head CI. The preserved stale editor session will need an explicit recovery/re-authentication before further saves.


## Dagelijkse Nederlandse taalcontrole, 11 november 2026

De afzonderlijke read-only workflow gebruikt de lokaal gebouwde site en een eigen LanguageTool-server. Zie `NL-LANGUAGE-AUDIT.md` voor de precieze dekking en uitsluitingen. Permanente regressies in `tests/nl-audit.test.cjs` en `tests/nl-dom.test.cjs` bewaken zinscontext, verschillen, inhoudsgebonden reviews, veilige historie, API-beperkingen en falende engines. De nieuwe workflow controleert bovendien de echte engine en pagina-inventaris bij relevante PR-wijzigingen. Geen bestaande vrijgavegrens of browsercasus is verwijderd. Deze taalscan bewijst geen officiële taalgoedkeuring, volledige bronextractie of live-CMS-dekking.

Vervolg met onafhankelijke agents: actuele CMS-main is geïntegreerd met behoud van beide testplannen. De extractie neemt 610 vastgelegde Nederlandse CMS-defaults en Nederlandse mailonderwerpen/-alinea's mee; er zijn geen auth-, publicatie-, signing- of schrijfverzoeken. De beheerpagina wordt uitgesloten. Tests bewaken ongeldige JSON/URI, ontbrekende NL-waarden, dubbele sleutels/componenten, netwerkmethoden, gescheiden SVG-labels en botsingsvrije nieuwe bevinding-ID's met behoud van oude IDs. `tests/nl-editorial.test.cjs` bewaakt de kleine NL-correcties en consistente CMS-defaults. Alle eerdere bevindingen blijven in het register; een verdwenen extractorruismelding geldt niet als gecorrigeerde taal. Live CMS-overlays en algemene teller-/ECA-toestandscompositie blijven expliciete beperkingen.

De secretsgate voert aanvullend `scripts/nl-secret-guard.cjs` uit met de echte vastgezette Gitleaks 8.24.3. Vier fixtures bewijzen dat de precieze publieke DOM-ID-uitzondering werkt en dat gewone sleutelwaarden in hetzelfde bestand, dezelfde identifier elders en extra inhoud op de regel nog worden gedetecteerd. De 109 oorspronkelijke meldingen blijven als CI-bewijs beschikbaar; hun publieke catalogusherkomst is onafhankelijk gecontroleerd. Geen complete bestands- of scanneruitsluiting.

## Permanente grens voor interne Radar-sprintinhoud

Positieve fixtures bewaken gewone about.html-pagina’s, veilige Radar-pagina’s en legitieme publieke sprintteksten. Negatieve fixtures bewaken NL/FR-roadmapteksten, oude About-navigatie/structuur, achtergebleven runtimevertalingen en gekopieerde of hernoemde publieke bestanden. Test de werkelijke builder in een geïsoleerde tijdelijke bronboom: afkeuren vóór publicatie, geen achtergebleven deploybare dist na fout, en een schone volgende build. Artifact-security gebruikt dezelfde policy, zodat ook een verkeerd of aangepast publicatiepakket wordt afgekeurd. De publieke release-smoke doet uitsluitend gewone leesverzoeken naar beide Radar-routes en scripts en test taalbehoud bij een oude #about-link.

Historische previewretirement wordt afzonderlijk live gecontroleerd; nieuwe code of een groene build verwijdert geen bestaande historische deployment. Bewaar bewijs van vóór/na voor immutable URL en alias. De gebruikelijke build-, unit-, browser/axe-, load-, performance- en securitydrempels blijven ongewijzigd.
