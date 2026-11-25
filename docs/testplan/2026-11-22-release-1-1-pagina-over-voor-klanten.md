## Release 1.1: pagina Over voor klanten, 22 november 2026

about.html is herschreven voor klanten (goedgekeurde tekst, NL/FR met "vous"). Het portret is behouden. De pagina bevat een pilotknop, "Waarom Grow Faster", "Hoe ik werk" (3 stappen), "Wat ik meebreng", "Oplossingen" met de link "Alle oplossingen" en een contactblok (`#contact`, `tabindex="-1"`) met pilotgesprek en LinkedIn. Ze gebruikt de klantfooter.

Verwijderd van About:
- de twee boeken en de ingesloten books.css
- de werkroutes "Work with me" met e-mailsjablonen voor werkgevers
- het trackrecord en het blok met intellectuele fundamenten
- de links naar transformation.html en de boeklezer

Die pagina's blijven op hun URL bestaan. Links die naar verdwenen ankers op About wezen, zijn omgeleid:
- de auteurskaders op Insights en Trackrecord → `about.html#contact`
- de boeklink op Coherence → `books.html#the-coherent-enterprise`
- de manuscriptlink in de lezer van The Coherent Enterprise → de e-bookbestelling op Books

De About-sectie in de CMS-catalogus heeft nieuwe sleutels (`about-klant-*`; 20 velden). 30 vertalingen die alleen de oude About-inhoud dienden, zijn verwijderd. Het gzip-budget van 65 KB blijft groen.

Tests:
- Nieuw: `tests/over.test.cjs` dekt de goedgekeurde tekst met FR, de pilot- en contactacties zonder responstijdbelofte, de afwezigheid van boek- en trackrecordlinks, en de metadata.
- Verplaatst: de e-mailsjabloontaalwissel naar de e-bookbestelling op Books, de lezerroute naar Books, de praktijkroute naar Insights en de boekthese-route naar Coherence → Books.
- De werkroutetests zijn vervangen door een negatieve test (geen werkgeversroutes op About).
- Lighthouse meet About ongewijzigd; de drempels zijn niet aangepast.
- Fragmentlanding (Firefox-CI-fout op PR #94): de browser past het fragment toe terwijl `main` nog verborgen en onvertaald is, en laat zijn eigen (door `scroll-behavior:smooth` vloeiende) fragmentscroll tot het einde van het laden; in Firefox eindigde `books.html#the-coherent-enterprise` daardoor buiten beeld. `site.js` zet de pagina nu synchroon op het fragmentdoel direct na de eerste taaltoepassing (voor de onthulling verschijnt) en nogmaals na `load`, tenzij de bezoeker intussen zelf scrolde (wiel, aanraking, toets of aanwijzer). De nieuwe test `cross-page fragment landing shows its target ...` in `transformation.spec.cjs` houdt de pagina tussen vertaling en `load` vast (ux.js 1500 ms vertraagd) en meet eenmalig, zonder polling, dat het doel al in beeld is; zonder de fix faalt hij in Chromium desktop en mobiel (doel buiten beeld), met de fix slaagt hij. Een aparte test voor de bezoekersscroll is niet toegevoegd: Chromium voert bij `load` zelf nog een fragmentscroll uit na een toetsscroll, waardoor zo'n test de browser en niet de site zou meten. De bestaande test met `toBeInViewport()` is niet versoepeld.
