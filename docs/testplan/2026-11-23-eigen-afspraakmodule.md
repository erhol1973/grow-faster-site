## Eigen afspraakmodule, 23 november 2026

Beslissing van de eigenaar: Google Agenda verlaten (bevestigingen kwamen van het Gmail-adres) en een eigen module bouwen. Keuzes: momenten blokkeert Erlend zelf in de beheerpagina, boeken kan ma-vr met starturen 09:00 tot 16:00, mails vertrekken via de mailserver van het domein vanaf info@. Ontwerp en instellingen: docs/BOOKING.md.

Tests:
- tests/booking-rules.test.cjs (nieuw): de regels die de Edge Function zelf gebruikt. Brusselse tijd in winter- en zomeruur, de tien Belgische feestdagen (met Pasen), weekdagen en uren, 24 uur vooraf, bezette en geblokkeerde periodes, invoercontrole en de agenda-uitnodiging (RFC 5545, regels van maximaal 75 tekens). Verwachte waarden zijn met de hand berekend.
- tests/afspraak.test.cjs (herschreven): geen Google-link of iframe meer, formuliervelden zonder adres, verborgen spamveld, productie- en testendpoint, Franse vertalingen, beheerpagina met noindex en strikte CSP zonder inline script, migratie zonder rechten voor anonieme bezoekers met een unieke index tegen dubbele boekingen en een beheerderscontrole in elke beheerfunctie, privacybeleid 1.6 zonder Google Agenda. De vorige Google-tests zijn vervangen omdat die flow niet meer bestaat.
- tests/browser/afspraak.spec.cjs (herschreven): boeken van dag tot bevestiging, foutmeldingen zonder verzending, een uur dat intussen bezet is, een agenda die niet laadt, taalwissel, en de beheerpagina (aanmelden, afspraak zien, blokkeren in Brusselse tijd, annuleren in twee stappen). De boekingsfunctie wordt in de browser vervangen door een lokale nep, zodat de test geen echte boekingen maakt en zonder netwerk draait. Dit is geen cachetest.
- Database: in growfaster-test is in een teruggedraaide transactie nagegaan dat een tweede boeking op hetzelfde uur "taken" geeft, een boeking binnen 24 uur "slot", en dat anonieme en niet-beheerders geen toegang krijgen.

Ontwerp C (keuze van de eigenaar, 23 november 2026): dagkaarten die opzij schuiven met het aantal vrije uren, uren per voormiddag en namiddag, en een vaste balk met de keuze en de knop Verder. De browsertest controleert kaarten, tellingen, de lege dagdelen, de balk en de Franse versie. Op smalle schermen kreeg de stapkolom `minmax(0,1fr)`, zodat de schuifstrook de pagina niet breder maakt.

CI-bevinding 24 november 2026: op mobiele WebKit verschoof de pagina toen de dagkaarten laadden, waardoor de test die onderaan op Contact klikt mis klikte. De planner reserveert nu zijn hoogte (min-height 232px); een nieuwe browsertest houdt de antwoorden van de boekingsfunctie tegen tot na de eerste meting en eist dat de paginahoogte hooguit 4 pixels verandert.

De beheerpagina neemt de publieke projectsleutels over uit assets/cms-config.js (nieuw: `GF_SUPABASE_PROJECTS`), zodat ze maar op één plek staan en de bestaande gitleaks-uitzondering niet verruimd hoeft te worden. tests/cms-environment.test.cjs controleert dat die lijst gelijk is aan de CMS-configuratie en alleen publishable keys bevat. De lokale testserver levert in CMS-testmodus ook die lijst, met een niet-bruikbare testwaarde als sleutel.

Niet automatisch getest: het echte versturen van mails (vraagt de SMTP-instellingen van de eigenaar) en de aankomst in Outlook. Dat gebeurt met een echte testboeking voor de release.

Samengevoegd met main op 25 november 2026: assets/cms-config.js houdt de gedeelde projectlijst `GF_SUPABASE_PROJECTS` en de regel van main dat elke Cloudflare Pages-preview het testproject gebruikt; tests/cms-environment.test.cjs bevat beide tests ongewijzigd. assets/i18n.js is de unie van beide kanten (waarden van main bij verschil); de drie Google Agenda-zinnen die deze PR verwijderde, blijven weg. language/nl-extraction.json opnieuw berekend.
