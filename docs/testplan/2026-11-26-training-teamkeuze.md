## Training per team, 26 november 2026

Aanleiding: bezoekers moeten in het Nederlands en Frans meteen kunnen bepalen welke van de drie bestaande trainingen bij hun team past. De keuze krijgt voorrang in de hero en het aanbod groepeert doelgroep, oefening en gesprekslink. De drie illustratieve praktijkfoto’s tonen kwaliteitscontrole in voedselproductie, werkbonnen in technisch onderhoud en een directieoverleg in logistiek.

- Referentie: main op `2459fdd30cd54f0faacc1b4a213fe5d0ed2285be`. De site behoudt de negen secties, bestaande CMS-sleutels, canonieke Training-URL en het gespreksonderwerp Training.
- `tests/browser/training.spec.cjs`: in NL en FR met toetsenbord of aanraking naar het aanbod, drie onderscheidbare teams, passende actielabels en geladen foto’s, geen horizontale overloop of afgebroken slotwoord in de Franse hero op 320 px, geautomatiseerde toegankelijkheid en doorklikken naar Afspraak met in dezelfde taal het voorgeselecteerde onderwerp Training. De test verstuurt geen boekingsaanvraag.
- `tests/training-academy.test.cjs` en `tests/release2.test.cjs`: behoud van aanwezige structuur, huisstijl, bronlinks, vertalingen, CMS-koppeling en conversieroute. SEO en de taalwisselaar worden aanvullend op de gebouwde kandidaat gecontroleerd.
- `npm run test:performance`: drie sequentiële Lighthouse-metingen per profiel voor `/training.html?lang=nl` en `/training.html?lang=fr`, met de bestaande drempels. De workflow bewaart individuele rapporten, medianen en browserresultaten bij deze revisie.
- Preview en bewijs horen bij de concept-PR. Browseremulatie en axe geven gedeeltelijk toegankelijkheidsbewijs. Lighthouse levert labmetingen.
