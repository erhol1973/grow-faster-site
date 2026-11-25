## Orion-film op de homepage, 24 november 2026

Vraag van de eigenaar: onder "Zo werkt Orion" de Nederlandstalige film, en de Franstalige film (eigen voice-over) zodra de bezoeker in het Frans leest. Beide films zijn de aangeleverde 4K-bestanden (3840 x 2160, 35 seconden, ongeveer 3,6 MB elk), ongewijzigd behalve faststart. Ze starten enkel op klik (controls, preload none, geen autoplay), zoals de Coherence-film. De zeven tekstkaarten uit de film staan als tekstalternatief onder de speler, met de Franse bewoording uit de Franse editie.

Tests:
- tests/orion-film.test.cjs (nieuw): plaats onder de stappen, speler-attributen, beide edities benoemd, budgetten (5 MiB per film, 60 KiB per poster), zeven stappen, elke regel vertaald.
- tests/browser/orion-film.spec.cjs (nieuw): bron en poster wisselen mee met de taal, er wordt niets gedownload voor de bezoeker op afspelen klikt (de taalwissel roept daarom geen load() aan op een onaangeroerde speler), afspelen na een wissel speelt de Franse editie, 16:9-kader.
