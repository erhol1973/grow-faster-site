## Magazinepagina met schuivende hero en archief, 25 november 2026

Eigenaarsbeslissing: journal.html wordt een eigen pagina voor de magazines. De blokken "Het boek" en "Herkent u deze verspilling?" onderaan zijn weg.

- Unit (tests/journal.test.cjs): geen `#boek` of `#contact` meer; vijf dia's in de hero; alleen de eerste afbeelding laadt met voorrang en wordt voorgeladen; `assets/magazine.js` is gekoppeld; het archief toont de nieuwste editie eerst; elke `data-fb-pagina` verwijst naar een bestaande pagina van het boek; Franse vertaling van de nieuwe koppen.
- Browser (tests/browser/journal.spec.cjs, chromium en mobile): pijlen, stippen en pauzeknop bewegen de hero; de vijfde dia staat na een klik echt in beeld; drie kaarten in het archief; de tegel "De aanpak" opent het boek op pagina 17; geen horizontale scroll. De bestaande bladertest scrolt eerst naar het boek, omdat het op een telefoon nu onder de vouw staat en de omslag lui laadt.
- Zonder JavaScript is de hero een horizontale scroll met snap; met `prefers-reduced-motion` start de hero niet vanzelf.
- Lokaal niet uitvoerbaar: Firefox en WebKit (geen browser in deze omgeving); die draaien in CI.
