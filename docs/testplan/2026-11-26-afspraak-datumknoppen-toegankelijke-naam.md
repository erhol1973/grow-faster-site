## Toegankelijke datumknoppen op de afspraakpagina, 26 november 2026

De mobiele WCAG-scan signaleerde `label-content-name-mismatch`. De knop toonde een afgekorte maand, terwijl een afzonderlijke `aria-label` de volledige maandnaam doorgaf. De naam komt nu rechtstreeks uit de zichtbare knoptekst. Een spatie scheidt dagnummer en maand voor de naam, terwijl de CSS de bestaande afstand van zes pixels tussen beide behoudt.

`tests/browser/afspraak.spec.cjs` gebruikt vaste, lokale slotgegevens om de toegankelijke namen in NL en FR te toetsen, inclusief de taalwissel. De nieuwe gevallen controleren de axe-regel voor de datumknoppen na selectie met Enter en bevestigen dat de focus naar het eerste vrije uur gaat. De bestaande algemene WCAG-scan blijft behouden.

Bewijs staat in de browser- en kwaliteitsrapporten van de GitHub-controles op de kandidaatrevisie. De browserprofielen emuleren mobiele apparaten. De controles omvatten geen fysieke toestellen, echte boekingen of screenreader-spraak.
