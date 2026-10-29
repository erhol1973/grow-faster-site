# Releaseprocedure en verantwoordelijkheden

## Rollen
- Product owner/orchestrator: scope, acceptatiecriteria, risicoafweging en vrijgave.
- Lead tester: scenario’s, regressies, negatieve paden en testbewijs.
- DevOps-specialist: reproduceerbaar publicatiepakket, CI en gecontroleerde deployment.
- Engineer: fouten herstellen; geen falende test verwijderen om een release groen te maken.

## Werkwijze
1. Wijzigingen gaan via een pull request.
2. De pipeline maakt een schoon publicatiepakket met uitsluitend publieke websitebestanden.
3. Broncontroles, unit/integratietests, browserregressies, securitycontroles en lokale load/prestatiechecks moeten slagen.
4. Bekijk rapporten en beoordeel nieuwe veiligheidsbevindingen. Geen generieke uitzonderingen voor een volledige scanner.
5. Publiceer alleen hetzelfde geteste pakket vanaf main.
6. Controleer na publicatie homepage, navigatie, Inzichten en belangrijke assets met een beperkte smokecheck.
7. Bij een defect: herstel de vorige goedgekeurde commit via een nieuwe wijziging en voer dezelfde controles opnieuw uit.

## Actieve vrijgaveblokkering
Gecontroleerd op 29 oktober 2026: GitHub Pages publiceert via GitHub Actions; main vereist een pull request en de drie statuscontroles Website quality gate, JavaScript security gate en Secrets history gate. De deployment gebruikt hetzelfde geteste pakket en start pas nadat deze controles slagen. De bestaande Pages-vrijgave is geactiveerd. Publiceer testbestanden en rapporten nooit als website-inhoud.

## Beveiliging
Deze website heeft geen eigen backend. Relevante risico’s zijn accountmisbruik, onbedoeld gepubliceerde bestanden, externe scripts, onveilige browsercode en kwetsbare ontwikkelafhankelijkheden. Scanners beperken risico’s en bewijzen niet dat een site niet gehackt kan worden. Gebruik voor het GitHub-account sterke meervoudige authenticatie en minimale toegangsrechten; wijzig accountinstellingen alleen met toestemming van de eigenaar.

Loadtests blijven lokaal. Ze meten het testpakket en de lokale server; ze voorspellen geen GitHub Pages/CDN-capaciteit. Productiescans blijven beperkt tot gewone, niet-destructieve leesverzoeken.

## Onderhoud
Beoordeel dependency-updates en pas lockfile en browserinstallatie samen aan. Leg prestatiedrempels en uitzonderingen met reden vast. Houd nieuwe pagina’s en gebruikerspaden in de tests bij. Onderzoek mislukte tests eerst; herstarten is geen oplossing voor instabiele tests.

Elke foutoplossing of nieuwe functionaliteit bevat passende blijvende regressietests. Werk de gedeelde navigatiegevallen en betrokken integratie-, end-to-end-, load- en prestatiecontroles in dezelfde pull request bij. Unit tests horen bij afzonderlijke logica; niet elk tekst- of layoutdetail heeft een unit test nodig. Behoud positieve en negatieve scenario’s. Breid de suite gericht uit en verwijder verouderde of dubbele tests alleen met onderbouwde reden. Zie TESTPLAN.md voor dekking en beperkingen.
