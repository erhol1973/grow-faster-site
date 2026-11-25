## Homepage: toepassingen, hero-video en vertrouwen, 24 november 2026

Bron: overdracht van Erlend (OVERDRACHT.md, INHOUD.md, 4K-video en stilbeeld). Beslissingen van de eigenaar: vier toepassingskaarten direct onder de hero met Orion eerst, "Herkenbaar?" verdwijnt van de homepage (de kaarten nemen die rol over, de sterkste twee kaarten staan nu op orion.html bij "Dezelfde vragen, telkens opnieuw"), "Zo werkt Orion" blijft. Het vertrouwensblok belooft geen alleen-lezen toegang: dat wordt pas gepubliceerd als technische garantie na verificatie per koppeling. De Veiligheid-pagina blijft offline.

Media: de 4K-master (16 MB, 16 Mbit/s) wordt niet gepubliceerd. Webvarianten: 1280 px (ongeveer 285 KB) voor schermen smaller dan 900 px en 1920 px (ongeveer 555 KB) daarboven, H.264 zonder geluid. Het stilbeeld volgt het bestaande 640/1280/1774-patroon in 2:1 en blijft het CMS-veld f7a4946dfd792-0. Bij minder beweging of databesparing laadt de video niet; anders is er een pauzeknop (WCAG 2.2.2).

Tests:
- tests/home-hero-video.test.cjs (nieuw): budgetten voor video en stilbeeld, geen 4K-bestand in de site, video-attributen (muted, loop, playsinline, preload none, geen autoplay of src in de HTML), pauzeknop, volgorde en doelen van de kaarten, systemen enkel als mogelijke bronnen, geen alleen-lezen belofte, verhuisde inhoud op orion.html.
- tests/browser/home-hero-video.spec.cjs (nieuw): de juiste variant per schermbreedte, pauzeknop wisselt en bedekt de hoofdknop niet, minder beweging laadt geen video, kaarten in leesvolgorde en in het Frans.
- Aangepast met reden: klantsite (goedgekeurde teksten, sectievolgorde met #toepassingen en zonder #herkenbaar, nieuw stilbeeld met object-position 50%, de hero-container mag de video na de picture bevatten), journal-editorial (bewijsstrook volgt nu de kaarten), cms-client (homepagegroepen: hero, toepassingen, ervaring, stappen, systemen en beslissingen, pilot, video), navigation-accessibility (nieuwe bestandsnaam van het stilbeeld). De oude foto hero-kwaliteit-productielijn is verwijderd omdat geen pagina ze nog gebruikt.

Feedback eigenaar (24 november 2026, 10:00): het donkerblauw was te donker. De video en het stilbeeld zijn lichter gemaakt (gamma 1,35) en alleen de homepage krijgt een lichter verloop dat rechts openloopt; Orion en Workflow-automatisering houden hun eigen verloop. hero-photo-contrast bleef op alle breedtes boven 4,5:1 (een eerste, te lichte poging zakte op 1024 px naar 4,24 en is bijgestuurd).

Keuze eigenaar (24 november 2026, 10:16): variant B in premiumversie. Homepage: verloop links 62 % in plaats van 80 % plus een zachte halo rond titel en ondertitel; afgesteld tot hero-photo-contrast op alle breedtes in NL en FR boven 4,5:1 bleef (de eerste B-versie zakte op 1024 px naar 4,12). Premium 4K-webvariant (4032 x 2048, ongeveer 3 MB) alleen voor schermen met minstens 2400 fysieke pixels breed op een snelle verbinding; budget 5 MiB in home-hero-video.test.cjs, browsertest met deviceScaleFactor 2.

Beperking: Chromium in Playwright speelt geen H.264 af, dus het echte afspelen en de mobiele laadtijd worden op de Cloudflare-preview gecontroleerd.
