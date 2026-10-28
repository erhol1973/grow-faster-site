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

## Nog te activeren op GitHub
De workflowbestanden alleen veranderen de bestaande GitHub Pages-instelling niet. Bij publicatie rechtstreeks vanaf een branch kan de site verschijnen voordat tests klaar zijn. De eigenaar moet expliciet instemmen met:
- Pages-bron omschakelen naar GitHub Actions;
- verplichte statuscontroles en bescherming van main, zonder onbedoelde uitzonderingen;
- de beperkte Pages-deploymentrechten van de workflow.

Tot deze instellingen zijn gecontroleerd en geactiveerd is de releaseblokkering voorbereid, niet afgedwongen. Publiceer testbestanden en rapporten nooit als website-inhoud.

## Beveiliging
Deze website heeft geen eigen backend. Relevante risico’s zijn accountmisbruik, onbedoeld gepubliceerde bestanden, externe scripts, onveilige browsercode en kwetsbare ontwikkelafhankelijkheden. Scanners beperken risico’s en bewijzen niet dat een site niet gehackt kan worden. Gebruik voor het GitHub-account sterke meervoudige authenticatie en minimale toegangsrechten; wijzig accountinstellingen alleen met toestemming van de eigenaar.

Loadtests blijven lokaal. Ze meten het testpakket en de lokale server; ze voorspellen geen GitHub Pages/CDN-capaciteit. Productiescans blijven beperkt tot gewone, niet-destructieve leesverzoeken.

## Onderhoud
Beoordeel dependency-updates en pas lockfile en browserinstallatie samen aan. Leg prestatiedrempels en uitzonderingen met reden vast. Houd nieuwe pagina’s en gebruikerspaden in de tests bij. Onderzoek mislukte tests eerst; herstarten is geen oplossing voor instabiele tests.
