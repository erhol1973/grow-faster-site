## Magazine editie 1: Overtypen, de verspilling die niemand ziet, 24 november 2026

GO van de eigenaar (14:23) op de concepttekst. De aankondiging op journal.html is vervangen door het volledige artikel in de vaste opbouw (verspilling, voorbeeld, aanpak, opbrengst) plus bronnen. Cijfers: 2,8 fouten per 100 velden (0,5 tot 6,4 per veld) uit Hong et al., BMJ Open 2013, en "enkele procenten" uit Mays en Mathias, JAMIA 2019; beide via de uitgeverspagina's nagelezen. Het rekenvoorbeeld (vijf retailers, 150 vragen, drie minuten) staat als illustratie gemarkeerd.

De 32 vertaalsleutels van het artikel staan in assets/i18n-journal.js (zelfde patroon als i18n-insights.js), zodat i18n.js onder de gzip-grens van 65 000 bytes blijft (64 121 na de splitsing).

Tests: tests/journal.test.cjs (vijf delen, vier stappen, drie meetrijen, beide DOI-links, illustratielabel, elke regel vertaald, budget) en tests/browser/journal.spec.cjs (artikel in NL en FR, geen horizontale overloop). Het taalcontract language/nl-extraction.json is opnieuw gegenereerd; het nam ook de wijzigingen van releases #104 en #105 mee, die zonder contractupdate gemerged waren.
