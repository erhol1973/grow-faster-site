# Releaseprocedure en verantwoordelijkheden

## Nederlandse taalscan, 11 november 2026

`nl-language-audit.yml` staat los van publicatie: uitsluitend `contents: read`, geen Pages- of CMS-toegang en geen automatische registermutaties. Planning 08:07 Europe/Brussels wordt pas actief op de standaardbranch. Baselinepromotie en extractiecontractwijzigingen gaan via een aparte branch/PR; zie `NL-LANGUAGE-AUDIT.md`. De drie beschermde statuscontroles en alle bestaande kwaliteitsvoorwaarden blijven behouden. Deze implementatie autoriseert geen main-merge of deployment.

Vervolg op verzoek van de eigenaar, 11 november: activering wordt voorbereid met onafhankelijke agents voor technische audit, taaltriage en dekkingsuitbreiding, onder één orchestrator. De actuele CMS-main moet eerst zonder verlies worden geïntegreerd; eerdere groene checks gelden niet voor de nieuwe revision. Samenvoegen gebeurt uitsluitend via de beschermde PR-route na de actuele gates. Daarna wordt de read-only workflow handmatig op main uitgevoerd en worden release-/smokeresultaten gevolgd. Dit autoriseert geen CMS-login, herstelmail, concept-/publicatiemutatie, migratie of media-acceptatietest op productie. Een nog open CMS-acceptatiepunt wordt niet als geslaagd voorgesteld.

## Rollen
- Product owner/orchestrator: scope, acceptatiecriteria, risicoafweging en vrijgave.
- Lead tester: scenario’s, regressies, negatieve paden en testbewijs.
- DevOps-specialist: reproduceerbaar publicatiepakket, CI en gecontroleerde deployment.
- Engineer: fouten herstellen; geen falende test verwijderen om een release groen te maken.

## Werkwijze
1. Wijzigingen gaan via een pull request.
2. De pipeline maakt een schoon publicatiepakket met uitsluitend publieke websitebestanden.
3. Broncontroles, unit/integratietests, browserregressies op vijf profielen, axe, securitycontroles, lokale loadchecks en herhaalde Lighthouse-metingen moeten slagen. Instabiele tests na retry blokkeren.
4. Bekijk rapporten en beoordeel nieuwe veiligheidsbevindingen. Geen generieke uitzonderingen voor een volledige scanner.
5. Publiceer alleen hetzelfde geteste pakket vanaf main.
6. De publieke smokecheck controleert Home/Enterprise Coherence/Inzichten naar Contact en scriptfouten; bewaar ook de aanvullende publieke snelheidsmeting. Onderzoek mislukte nacontroles en herstel zo nodig de vorige goedgekeurde versie via dezelfde procedure.
7. Bij een defect: herstel de vorige goedgekeurde commit via een nieuwe wijziging en voer dezelfde controles opnieuw uit.

## Actieve vrijgaveblokkering
Gecontroleerd op 29 oktober 2026: GitHub Pages publiceert via GitHub Actions; main vereist een pull request en de drie statuscontroles Website quality gate, JavaScript security gate en Secrets history gate. De deployment gebruikt hetzelfde geteste pakket en start pas nadat deze controles slagen. De bestaande Pages-vrijgave is geactiveerd. Publiceer testbestanden en rapporten nooit als website-inhoud.

## Beveiliging
Deze website heeft geen eigen backend. Relevante risico’s zijn accountmisbruik, onbedoeld gepubliceerde bestanden, externe scripts, onveilige browsercode en kwetsbare ontwikkelafhankelijkheden. Scanners beperken risico’s en bewijzen niet dat een site niet gehackt kan worden. Gebruik voor het GitHub-account sterke meervoudige authenticatie en minimale toegangsrechten; wijzig accountinstellingen alleen met toestemming van de eigenaar.

Loadtests blijven lokaal. Ze meten het testpakket en de lokale server; ze voorspellen geen GitHub Pages/CDN-capaciteit. Productiescans blijven beperkt tot gewone, niet-destructieve leesverzoeken.

## Onderhoud
Beoordeel dependency-updates en pas lockfile en browserinstallatie samen aan. Leg prestatiedrempels en uitzonderingen met reden vast. Houd nieuwe pagina’s en gebruikerspaden in de tests bij. Onderzoek mislukte tests eerst; herstarten is geen oplossing voor instabiele tests.

Elke foutoplossing of nieuwe functionaliteit bevat passende blijvende regressietests. Werk de gedeelde navigatiegevallen en betrokken integratie-, end-to-end-, load- en prestatiecontroles in dezelfde pull request bij. Unit tests horen bij afzonderlijke logica; niet elk tekst- of layoutdetail heeft een unit test nodig. Behoud positieve en negatieve scenario’s. Breid de suite gericht uit en verwijder verouderde of dubbele tests alleen met onderbouwde reden. Zie TESTPLAN.md voor dekking en beperkingen.

## Intrekken van interne Executive Radar-inhoud

Een inhoudsintrekking is pas voltooid wanneer de huidige bron en het volledige geteste publicatiepakket vrij zijn van de interne About-/sprintpagina én eerder gedeelde onveilige previewdeployments zijn ingetrokken. De gedeelde inhoudspolicy wordt bij build en artifact-security uitgevoerd; de publieke nacontrole controleert beide Radar-routes in NL/FR, inclusief oude #about-ingangen. Een fout blokkeert publicatie. Normale bedrijfspagina’s Over Erlend en publiek toegestane sprintbesprekingen vallen buiten dit verbod.

Cloudflare-preview-URL’s zijn historische momentopnamen. Alleen nieuwe bron publiceren of een alias verleggen verwijdert zo’n oude URL niet. Bewaar een intrekkingsregister met exacte deployment-ID, oorspronkelijke URL/alias, inhoudsbewijs en verificatie na intrekking. Verwijder uitsluitend bevestigde onveilige previews van dit project; verander geen productie-DNS, toegangsinstellingen of andere projecten. Bron- en goedkeuringsprocedures blijven verplicht. De inhoudelijke en productie-Go/No-go voor de nieuwe CEO-pilot blijft een afzonderlijke sponsorbeslissing.

## Browserruntime publieke nacontrole, 13 november 2026

De publieke nacontrole gebruikt de vooraf geïnstalleerde Chromium-browser uit dezelfde vastgezette Playwright-image als de geteste release. Houd de imageversie gelijk aan de vergrendelde Playwright-packageversie. De netwerkvrije startproef draait zowel vóór vrijgave als in de nacontrole; daarna blijven de bestaande publieke functionele controles en mobiele Lighthouse-observatie verplicht. Geen APT/browserdownload, automatische retry, ruimere timeout of versoepelde assertie wordt toegevoegd. Een infrastructuurfout moet herkenbaar worden gerapporteerd en geldt niet als geslaagde publieke verificatie. Beoordeel de actuele PR-gates vóór samenvoegen en volg de eerste main-nacontrole tot de eindstatus. Deze wijziging wijzigt geen afzonderlijke sponsoracceptatie of productie-Go/No-go van onvrijgegeven productedities.
