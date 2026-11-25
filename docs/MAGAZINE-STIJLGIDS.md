# Grow Faster Magazine: stijlgids en bouwinstructies

Vastgelegd op 25 november 2026 op vraag van de eigenaar, op basis van editie 1 ("Overtypen, de verspilling die niemand ziet", 32 pagina's, PR #112). Elke volgende editie volgt deze gids, zodat stijl, look en feel telkens dezelfde zijn. Dezelfde gids staat in het Claude-project GROW FASTER (doc `magazine-stijlgids`), samen met het redactieproces (`magazine-redactieproces`). Wijzig beide samen.

## 1. Vaste regels van de eigenaar

- Omvang: minimum 20, maximum 35 pagina's, altijd een even aantal (bladen van twee).
- Omslag: altijd een foto van de sector waarover de editie gaat. De eigenaar kiest uit minstens twee voorstellen.
- Tekst groot genoeg om te lezen, pagina's gebruiken de beschikbare ruimte. Een pagina hoeft niet altijd vol, maar een pagina die minder dan 75 % gevuld is, krijgt een citaat, een kader of een figuur.
- Veel beeld: per editie minstens zes foto's of beelden, plus genummerde figuren.
- Look and feel: professioneel en redactioneel, in de geest van McKinsey Quarterly. Geen huisstijl, lettertype of logo van McKinsey overnemen.
- Niets gaat live zonder GO van de eigenaar.

## 2. Formaat en maten

- Flipboek op journal.html, eigen code (geen Heyzine). Twee pagina's naast elkaar vanaf 761 px schermbreedte, één pagina op een telefoon.
- Pagina's in A4-verhouding (1 : 1,414), zo groot als het scherm toelaat, minstens 530 px breed per pagina.
- Alle maten volgen de paginabreedte (CSS-container op `.fb-blad`, eenheid `cqw`). Op een telefoon vermenigvuldigt `--k: 1.5` alle maten. Nooit maten aan de schermbreedte koppelen: dat maakte de tekst in de eerste versie 8,9 px op 1920 px.
- Lettergroottes (in procent van de paginabreedte; resultaat op 1440 / 1920 px):
  - lopende tekst 2,85 (15 / 18,7 px), regelafstand 1,55
  - paginanummer onderaan 2,8, vet (15 / 18 px)
  - kop- en voetregel 1,95, hoofdletters, spatiëring
  - titel van een rubriek (h3) 5,6; tussentitel (h4) 3,4
  - standfirst (inleidende zin onder een titel) 3,45
  - groot citaat 5; gewoon citaat 4,3
  - omslagtitel 11; titel op een openingspagina 10; deelnummer 16
  - bijschriften en bronregels 2,05 tot 2,3
- Marges: boven 6, zijkant 7,5, onder 9 (de voetregel staat op 3,4 van de onderrand).
- Lettertypes: die van de site (Aptos, Hanken Grotesk). Kleuren: navy #0B2545, navy 2 #143a6b, accent #0A8FD0, accent donker #06679a, lichtblauw #eef3f9, lijn #d9e0ea, tekst #14181F, grijs #5b6472. Rood #b42318 alleen voor een gevolg of risico in een figuur.

## 3. Vaste opbouw van een editie

Ongeveer 32 pagina's; schuif met rubrieken van twee pagina's om binnen 20 tot 35 te blijven.

1. Omslag met sectorfoto over de volle pagina, titel, onderregel, "Ook in deze editie".
2. Inhoud: genummerde lijst met paginanummers.
3. Van de redactie (ik-vorm, de eigenaar), met initiaal en auteursblok onderaan.
4. In het kort: standfirst, vijf punten, drie cijferkaarten ("Deze editie in drie cijfers").
5. Openingspagina deel 1: foto over de volle pagina, deelnummer 01, titel, één zin.
6 tot 11. Deel 1, de verspilling: standfirst met initiaal, citaat, figuur, kader "Hoe herkent u het?", waar ze zit (genummerde plekken in twee kolommen), een halve fotopagina met een herkenbare situatie (als illustratie gelabeld).
12. Openingspagina deel 2.
13 tot 16. Deel 2, één voorbeeld: rekenvoorbeeld met staafgrafiek, cijferkaarten, foutcijfers met bron in een figuur, de weg van één fout als stroom, groot citaat, "Waarom niemand het ziet".
17. Openingspagina deel 3.
18 tot 21. Deel 3, de aanpak: figuur met de stappen als pijlen, genummerde stappen, kader "Wat u niet moet doen", keuzematrix "Welke taak eerst?", telformulier.
22 tot 23. Deel 4, wat het oplevert: tabel met drie metingen, kader "Conclusie", halve fotopagina.
24 tot 25. Wat Orion (of de passende software) doet en niet doet, met echt productbeeld, en het verloop van een pilot als figuur.
26 tot 27. Veelgestelde vragen (acht).
28. Checklist met vakjes en kader "Uw score".
29. Volgende stap: navy pagina met grote titel en knop "Plan een gesprek".
30. Bronnen, over de auteur, colofon, beeldverantwoording.
31. Lezerspagina "Uw voorbeeld in een volgende editie".
32. Achterkant: volgende editie met titel en vraag, knop "Mail me bij een nieuwe editie".

## 4. Bouwstenen (CSS-klassen in assets/magazine.css)

- `.fb-omslag.fb-foto`: omslag met foto en verloop van boven en onder.
- `.fb-opener`: foto over de volle pagina, met `.fb-deel` (groot nummer), `.fb-label`, `.fb-opener-titel`, `.fb-opener-lede`.
- `.fb-halffoto`: foto bovenaan (40 % van de pagina) met bijschrift in een navy band, tekst eronder.
- `.fb-kop` (sectienaam links, "Editie n" rechts) en `.fb-voet` (magazinenaam links, paginanummer `.fb-folio` rechts) op elke binnenpagina.
- `.fb-standfirst`, `.fb-initiaal` (initiaal), `.fb-citaat` en `.fb-citaat-groot`.
- `.fb-kader` (navy kader met label), `.fb-kort-blok` (lichtblauw blok met vijf punten), `.fb-cta-blok`, `.fb-cta-pagina` (navy pagina).
- `.fb-cijfers`: drie cijferkaarten met groot getal en korte uitleg.
- `.fb-figuur` met `.fb-figuur-nr` ("Figuur n"), vette titel en `.fb-bron` eronder. Figuurtypes: `.fb-drie` (drie kolommen), `.fb-balken` (staafgrafiek), `.fb-schaal` (bereik met gemiddelde), `.fb-stroom` (stroom met pijlen, laatste stap rood), `.fb-stappenbalk` (pijlen in vier tinten), `.fb-matrix` (2 x 2), `.fb-tijdlijn` (genummerde cirkels).
- `.editie-stappen` (genummerde stappen; een tweede lijst op de volgende pagina krijgt `start` en `style="counter-reset:stap n"`), `.fb-plekken` (twee kolommen), `.fb-kort` (drie redenen), `.fb-check` (vakjes), `.fb-vragen` (veelgestelde vragen).
- `.editie-tabel` (navy kopregel) en `.fb-formulier` (lege regels om af te drukken).
- `.fb-scherm`: productbeeld met bijschrift.

Figuren zijn HTML, geen SVG, zodat de tekst vertaald kan worden.

## 5. Beeld

- Foto's: documentair, redactioneel, natuurlijk licht, blauwgrijze tinten passend bij de huisstijl, in een Vlaamse of Belgische kmo-context.
- Geen herkenbare gezichten van bestaande personen, geen logo's of merknamen van andere bedrijven, geen leesbare tekst in een andere taal dan Nederlands (een beeld met Engelse tekst wordt niet gebruikt).
- Met AI gemaakte beelden worden in het colofon vermeld.
- Bestanden: `img/magazine-editie-<n>-<onderwerp>-<breedte>.webp`, telkens een versie van 700 px en de volle breedte, met `srcset`, `width`, `height`, `loading="lazy"` en een alt-tekst van minstens twintig tekens.
- Per editie: omslag, drie openingsfoto's, twee halve fotopagina's, één productbeeld.

## 6. Tekst en cijfers

- Schrijfregels: geen gedachtestreepjes, kopjes in zinskapitalen, geen opgeblazen woorden, concrete feiten, de lezer met "u" aanspreken.
- Elk cijfer heeft een bron met link (DOI waar het kan) op de bronnenpagina, en de bron staat ook onder de figuur. Een rekenvoorbeeld of een geschetste situatie wordt als illustratie gelabeld. Geen leveranciersstatistieken als bewijs.
- Elke editie: één verspilling, één voorbeeld, één aanpak in vier stappen, drie metingen.
- Frans: elke zichtbare regel vertaald in assets/i18n-journal.js; namen, getallen en e-mailadressen krijgen `data-notr`. Eenheden vertalen (u wordt h).

## 7. Bestanden en controles

- Inhoud: sectie `#editie-<n>` in journal.html. Stijlen: assets/magazine.css (niet inline; journal.html moet onder het HTML-budget van 85 KB blijven). Bladeren: assets/flipboek.js. Vertalingen: assets/i18n-journal.js.
- Controle voor de PR:
  - paginatelling tussen 20 en 35 en even;
  - geen tekst onder de voetregel van een pagina, in NL en FR, op 1440 px (vulling per pagina meten);
  - geen woordafbreking in titels op een telefoon;
  - unit- en browsertests groen (tests/journal.test.cjs, tests/browser/journal.spec.cjs), taalcontract opnieuw gegenereerd, testplan-item toegevoegd als nieuw bestand in docs/testplan/;
  - een aparte agent leest de tekst na tegen de bronnen.
- Preview op de branch, daarna GO van de eigenaar voor productie.

## 8. De magazinepagina rond het boek

Vastgelegd op 25 november 2026 (eigenaarsbeslissing). journal.html is een eigen pagina voor de magazines, met felle kleuren naast navy. Geen blok over het boek en geen apart contactblok onderaan.

- Volgorde: schuivende hero, archief "Alle edities", "In editie n" (vier delen), het flipboek, "Opbouw van elke editie".
- Kleuren van de pagina (niet in het boek zelf): koraal #FF5A3C, geel #FFC629, turkoois #00B8A9, roze #FF4F9A, limoen #C6F432, violet #6C4CF5, met tekst in #0B1020. Op violet staat witte tekst. Achtergronden: donker #0B1020 voor hero en delen, warm wit #FFF8EE voor archief en opbouw.
- Hero: vijf dia's, elk een kleurvlak met label, titel en link naast een foto. Dia 1 is de omslag van de nieuwste editie, dia 2 tot 4 de delen, dia 5 de volgende editie ("binnenkort"). Pijlen, stippen, pauzeknop; om de 6 seconden verder, niet bij hover, focus of `prefers-reduced-motion`. Zonder script werkt de hero als horizontale scroll.
- Alleen de eerste dia-afbeelding laadt met voorrang en wordt voorgeladen in de head; de rest laadt lui.
- Archief: per jaar een raster van kaarten. Elke kaart heeft een kleurkader met het nummer (01, 02), de omslag, "Nr. n · maand jaar", titel, één zin en een link. De nieuwste editie staat eerst; een editie die nog moet verschijnen krijgt de badge "Verschijnt in ..." en een mailto-link. De laatste kaart is de violette inschrijfkaart.
- Delen-tegels en dia's springen met `data-fb-pagina="n"` naar de juiste pagina in het boek.
- Bij een nieuwe editie: nieuwe kaart vooraan in het archief, dia 1 en dia 5 bijwerken, delen-tegels en paginanummers aanpassen, elke mailto blijft beginnen met `?subject=Magazine`.
- Bestanden: assets/magazine.css (klassen `.mz-*`), assets/magazine.js (hero), assets/flipboek.js (deeplinks).
