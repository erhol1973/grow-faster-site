# Publicaties

## Turning AI Potential into Enterprise Value

Hoofdtitel: **Turning AI Potential into Enterprise Value**, ondertitel **Design for Coherence**. Auteur: Erlend Hollebosch. Eerste editie november 2026, 79 pagina's.

Publiek staat alleen de executive preview: `books/turning-ai-potential-executive-preview.pdf`, met pagina's 10–25 en 45–57 van het boek (29 pagina's). Het volledige boek staat niet meer op de website; `books/design-for-coherence.pdf` geeft 404. Let op: de vroegere volledige PDF blijft in de Git-geschiedenis van deze publieke repository staan.

Het volledige boek is te bestellen als hardcover, softcover-managementhandboek en e-book via `books.html#order`. Elke bestelknop opent een e-mail met een vooraf ingevuld onderwerp en bestelsjabloon; prijs, levering en factuur worden persoonlijk bevestigd. Geen formulieren of betaalgegevens op de site.

`tests/book-publication.json` identificeert de gecontroleerde preview met grootte en SHA-256. De 3D-omslag op de site toont de hoofdtitel en ondertitel in de juiste volgorde.

## Twee verschillende boeken

`books.html` introduceert het praktische AI-handboek en het bredere manuscript **The Coherent Enterprise**. Het eerste boek behoudt zijn bestaande negenpagina-preview en volledige manuscript op aanvraag. De website en merknaam worden niet hernoemd. Het nieuwe boek leidt naar de bestaande werksessie; de prijzen en voorwaarden van die werksessie blijven ongewijzigd.

De boekdiagnose en de anonieme ECA zijn afzonderlijke instrumenten. De boekbeschrijving doet geen claim van wetenschappelijke validatie, bewezen causaliteit of gegarandeerde opbrengst.

De boeken zijn bereikbaar via **Enterprise Coherence → Boeken**, met directe verwijzingen op Home, Enterprise Coherence, Over Erlend, Werksessie en in de footer. Het hoofdmenu behoudt vier categorieën en één werksessieactie. Alle website-uitleg en downloadlabels zijn beschikbaar in EN/NL/FR; de boektitel en Engelse ondertitel blijven de namen van de Engelstalige uitgave.

## Controle

HTTP-controles bewaken de volledige PDF, MIME, HEAD, checksum, metadata en bestaande leesroutes. Browsergevallen op de vijf bestaande profielen controleren de drie talen, menu, actieve pagina, daadwerkelijke download, geweigerde optionele diensten, geen automatische PDF-download en de route naar de werksessie. Een apart geval controleert downloaden zonder JavaScript. Axe controleert de boekpagina op desktop en mobiel in de drie talen.

De nieuwe pagina, CSS en PDF vallen onder de bestaande lokale loadtest. De pagina krijgt drie opeenvolgende Lighthouse-metingen per mobiel en desktop. Bestaande drempels blijven gelijk. De publieke nacontrole doet gewone leesverzoeken en controleert de gepubliceerde PDF tegen dezelfde checksum. Fysieke apparaten, screenreaders en de volledige toegankelijkheid van de aangeleverde PDF zijn hiermee niet gecertificeerd.
