---
name: premiumdesign
description: Toets Grow Faster-websitewijzigingen aan de Premium Design-standaard. Gebruik bij ontwerp, implementatie of review van layout, navigatie, UI-copy, merk, media en interacties.
metadata:
  version: "1.0.0"
---

# Grow Faster Premium Design

De Design Lead bewaakt de standaard, de CPO coördineert en de Executive Sponsor beslist over nieuwe creatieve richting en productie binnen de bestaande governance. Lees de root- en toepasselijke scope-instructies. Gebruik het [beslissingenregister](../../../docs/governance/DECISION-REGISTER.md), het [Operating Model](../../../docs/governance/OPERATING-MODEL.md), het [testplan](../../../docs/TESTPLAN.md) en het [releasebeleid](../../../docs/RELEASE.md).

## Baseline en ontwerp

- Start vanuit de relevante sponsorbesluiten en de Website Architecture & Content Blueprint (GF-001). Gebruik de actuele read-only bron als die beschikbaar is. Als de volledige blueprint ontbreekt, werk voor een beperkte wijziging binnen de bevestigde besluiten en noteer de lacune. Leg een keuze die afhangt van ontbrekende broninformatie voor aan de CPO.
- Leg vóór het werk de vergelijkingsrevisie, routes, templates, bezoekerspad, beide talen en relevante schermformaten vast. Leg op de gebouwde referentie de relevante schermen, toestanden en metingen vast. Bepaal vooraf per Lighthouse-categorie of de wijziging die kan beïnvloeden en motiveer eventuele uitsluitingen. Noteer bestaande afwijkingen afzonderlijk. Een oudere screenshot of onafgewerkte preview geldt alleen als historisch bewijs.
- Ontwerp voor Belgische KMO-bedrijfsleiders. Maak direct duidelijk welk praktisch probleem Grow Faster helpt oplossen, hoe menselijke controle werkt en welke volgende stap de bezoeker kan nemen. Gebruik concrete voorbeelden en onderbouwde claims.
- Kies een rustige, herkenbare B2B-uitstraling met één visuele focus per sectie, sterke typografische hiërarchie en voldoende witruimte. Hergebruik goedgekeurde logo's, blauwe merkaccenten, typografische rollen en bestaande fontstacks met Hanken Grotesk waar gebruikt. Controleer ook lokale overrides en bewezen uitzonderingen. Gebruik doelgerichte beelden en beweging die informatie of bediening ondersteunen. Vermijd generieke kaartstapelingen, zware randen en decoratieve interacties.
- Schaal het onderzoek mee met de wijziging. Toon bij een gerichte fix de relevante voor/na-vergelijking. Bij een expliciet opgedragen sitebrede herpositionering of redesign: audit de belangrijkste journeys en templates, benchmark minstens tien relevante voorbeelden, vergelijk drie wezenlijk verschillende richtingen via onafhankelijke review en laat de sponsor de richting kiezen vóór uitwerking. Vertaal de gekozen richting naar herbruikbare componenten en tokens binnen de bestaande architectuur.

## Toets de gebouwde kandidaat

Gebruik de [rubriek](references/quality-gate.md) voor de relevante routes en toestanden. Hergebruik de bestaande controles en voeg regressiedekking toe waar AGENTS.md en het testplan die vereisen.

- **NL/FR.** Controleer NL-BE en FR-BE op betekenis, terminologie, natuurlijke lokale copy, formeel Frans waar passend, lengte, afbreking, labels, alternatieve teksten en feedback. Controleer bij taal- of route-impact de taalwissel, URL, documenttaal en terugval. Behoud bestaande uitzonderingen voor uitgaven in hun brontaal.
- **Toegankelijkheid.** Toets de gewijzigde onderdelen aan WCAG 2.2 AA. Combineer automatische controle met toetsenbord, zichtbare logische focus, semantiek en namen, contrast, zoom/reflow, aanraking, foutmeldingen en reduced motion waar relevant. Registreer beperkingen rond fysieke apparaten en screenreaders. Een hoge Lighthouse- of axe-score ondersteunt slechts een deel van de beoordeling.
- **Performance.** Vergelijk dezelfde gebouwde variant, routes, talen en desktop-/mobielprofielen onder gelijke omstandigheden. Behoud de repo-budgetten en controleer bij impact beelden, fonts, scripts, cache en layoutverschuiving. Bewaar individuele Lighthouse-metingen en medianen. Benoem lab- en veldbewijs afzonderlijk.
- **SEO.** Controleer bij impact titels en beschrijvingen, koppen, crawlbare links en rendering, statuscodes en redirects, canonical, indexeerbaarheid, sitemap, taalalternatieven en gestructureerde data volgens het bestaande route- en localecontract. Voeg alleen alternatieve URL's toe die werkelijk bestaan.
- **Conversie.** Volg in NL en FR de gewijzigde bezoekersroute tot de relevante actie, inclusief mobiel. Controleer bedoeling, bestemmingspagina, toegankelijke bediening, bevestiging en fout-/herstelpad waar geraakt. Behoud CMS-, toestemmings- en integratiecontracten. Gebruik lokale of toegestane testdata. Rapporteer een werkende route als functioneel bewijs en een conversie-effect alleen met gemeten gebruikersdata.

## Onafhankelijke review en overdracht

Laat een reviewer die de wijziging niet maakte de huidige revisie en het bewijs read-only beoordelen. Gebruik de bestaande rolverdeling en schrijfgrenzen. Vraag een afzonderlijke reviewer of menselijke review volgens de geldende bevoegdheid. Bij ontbreken blijft de onafhankelijke gate open. Laat betekenisvolle vervolgwijzigingen opnieuw beoordelen.

Lever scope, basis- en kandidaatrevisie, eventuele artifact-hash, routes, locales, profielen, voor/na-beelden, testcommando's, scores, bevindingen, afwijkingen, reviewer en resterend werk aan. Gebruik het bestaande werkitem en bij testimpact het bestaande testplanformaat. Bewaar gevoelige screenshots, data en intern onderzoek buiten repository en website. Geef de CPO bij releasewerk de bewijsverwijzingen voor het bestaande interne releaseregister.

Houd ontwerpacceptatie, technische/integratieacceptatie, productie-GO en gemeten productuitkomsten herkenbaar in de overdracht. Volg GF-010 en de geldende productiehold. Een ontwerpbesluit, preview, kwaliteitsbeoordeling of groene CI geeft geen productiebevoegdheid. Productie en elke merge die haar activeert vereisen vooraf expliciete sponsor-GO en de bestaande releaseprocedure.
