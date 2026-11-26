# Premium Design-kwaliteitsrubriek

## Onafhankelijk beoordelen

Beoordeel de kandidaat aan de hand van de vastgelegde referentie en de geldende merk- en paginabesluiten. Noteer per toepasselijk criterium score, route, taal, schermprofiel, concreet bewijs en eventuele tekortkoming. Gebruik halve punten alleen wanneer het bewijs een tussenpositie ondersteunt.

| Criterium | Waar de reviewer naar kijkt | Minimum |
| --- | --- | ---: |
| Visueel ontwerp | Duidelijk focuspunt, leesbare typografie, beheerste compositie en consistent ritme | 9/10 |
| Merkconsistentie | Goedgekeurd beeldmerk, kleuren, typografische rollen, toon en consistente componenttoestanden | 9,5/10 |
| Informatiearchitectuur | Herkenbare volgorde, heldere labels, voorspelbare navigatie en vindbare volgende stap | 9/10 |
| Originaliteit | Herkenbare, inhoudelijk passende Grow Faster-keuzes die verder gaan dan generieke patronen | 9/10 |
| Mobiele UX | Leesbare reflow in NL/FR, bruikbare aanraakdoelen en een ononderbroken bezoekerspad | 9/10 |

Score-ankers: **0–4** wezenlijk afwezig of onbruikbaar, **5–6** meerdere duidelijke tekortkomingen, **7–8** functioneel met zichtbare tekortkomingen, **9** voldoet aantoonbaar met hoogstens kleine polishpunten, **10** overtuigend en consistent over de volledige getoetste scope. Een kritieke regressie blokkeert ongeacht de score.

Bereken voor een volledig ontwerp het ongewogen gemiddelde van de vijf scores maal tien. Minimum **90/100**, ambitie **95/100**. Elke toepasselijke minimumscore geldt afzonderlijk. Bij beperkte scope beoordeelt de reviewer de geraakte criteria en motiveert waarom andere buiten scope vallen. Rapporteer dan de losse scores zonder websitebrede totaalscore. Vereist bewijs dat ontbreekt krijgt de status **onbekend**. Dat houdt die gate open.

## Technisch en functioneel bewijs

- **Lighthouse premiumdrempels:** mediaan ≥ 95 voor Performance, Accessibility en SEO per gemeten route/profiel waar relevant. Meet op het gebouwde lokale artifact met gelijke instellingen en sequentiële samples volgens het bestaande testplan. Neem de relevante NL/FR-paden mee bij taaleffect. Voor meetdekking buiten de huidige suite documenteer je de aanvullende meting. De bestaande CI-drempels en budgetten blijven gelden. Een groene CI onder de premiumdrempel betekent dat de premiumgate openblijft.
- **Kritieke regressies: 0.** Blokkeer bij een gebroken primaire taak, een blokkerende toegankelijkheids- of taalregressie, verlies van essentiële route-/SEO-functionaliteit of schending van een bindende releasecontrole.
- **Ongeautoriseerde designafwijkingen: 0.** Leg een bewuste afwijking van een goedgekeurde merk-, structuur- of paginabeslissing vooraf voor aan de bevoegde eigenaar volgens de governance. Een eerdere baselinefout of oude goedkeuring telt niet als vrijstelling.
- **Bewijsmatrix:** scope en omgeving → bewijs per route/locale/profiel → geslaagd, gefaald, onbekend of gemotiveerd buiten scope → reviewer → open bevindingen. Geef pas een positief premiumoordeel als elke toepasselijke controle is onderbouwd en geslaagd. Leg de bevoegde beslissing over eventuele afwijkingen apart vast volgens de bestaande governance.
