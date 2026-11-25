# Homepage-herwerking: copy (NL/FR)

Status: voorstel van de copy-agent, 25 november 2026. Volgorde volgt de IA in BRIEF.md. Vertalingen staan ook in `docs/home-redesign/i18n-home.json` (formaat van `window.I18N`).

## Regels voor de integratie

- Elke regel hieronder is precies één tekstnode. Zet er geen inline-opmaak (`<strong>`, `<a>`, `<br>`) in, anders vindt `site.js` de vertaling niet meer.
- In de FR-tekst staat een harde spatie (U+00A0) vóór `? : ; !`, binnen `« »`, tussen duizendtallen en vóór `€`. In deze markdown is die spatie onzichtbaar; neem de FR-tekst altijd uit `i18n-home.json`, niet door over te typen.
- NL gebruikt de typografische apostrof (’) zoals de rest van de site (kmo’s, pdf’s).
- Sleutels met de opmerking "bestaand" hebben al een vertaling in `assets/i18n.js`; de FR-tekst is daaruit overgenomen. Kaarttitels behouden hun huidige `data-cms`-sleutel omdat de tekst niet wijzigt. Alle andere teksten krijgen een nieuwe `home-v2-`-sleutel.
- De drie kaartlabels (Vandaag / Wij bereiden voor / Uw medewerker) zijn per kaart dezelfde tekst. Geef ze per kaart een eigen sleutel als het CMS ze per kaart moet kunnen wijzigen: `home-v2-apps-N-label-today|prep|keep` (N = 1-4).
- Geen nieuwe CTA-links in deze secties: de bestaande pilot-CTA in hero en final blijft de enige `afspraak.html`-link (test `the single call to action...`).

## 1. hero (verfijnen)

- `home-v2-hero-eyebrow` · eyebrow (optioneel, boven h1)
  - NL: Workflow-automatisering en AI voor kmo’s
  - FR: Automatisation des workflows et IA pour les PME
- `home-v2-hero-reassure` · p onder de CTA’s
  - NL: Wij bereiden voor. Uw team kijkt na en beslist.
  - FR: Nous préparons. Votre équipe vérifie et décide.

## 2. toepassingen (vier kaarten)

Elke kaart: titel, dan drie korte delen met een klein label. De kaartlinks ("Zo werkt Orion →", "Workflow-automatisering →") blijven zoals vandaag. Het huidige `toep-pilot`-blok verhuist naar `aanpak`.

- `home-v2-apps-eyebrow` · eyebrow
  - NL: Toepassingen
  - FR: Applications
- `home-v2-apps-h` · h2
  - NL: Vier toepassingen, één werkwijze
  - FR: Quatre applications, une même méthode
- `home-v2-apps-p` · lede
  - NL: In elk voorbeeld ziet u wat het vandaag kost, wat wij voorbereiden en wat uw medewerker zelf blijft doen.
  - FR: Chaque exemple montre ce que la tâche coûte aujourd’hui, ce que nous préparons et ce que votre collaborateur continue à faire lui-même.
- `home-v2-apps-label-today` · label (herhaald in elke kaart, één sleutel per kaart: home-v2-apps-N-label-today)
  - NL: Vandaag
  - FR: Aujourd’hui
- `home-v2-apps-label-prep` · label (idem, home-v2-apps-N-label-prep)
  - NL: Wij bereiden voor
  - FR: Nous préparons
- `home-v2-apps-label-keep` · label (idem, home-v2-apps-N-label-keep)
  - NL: Uw medewerker
  - FR: Votre collaborateur
- `home-apps-1-h` · h3 kaart 1 (bestaand, ongewijzigd) (bestaand)
  - NL: Kwaliteit in de voedingsproductie
  - FR: Qualité dans la production alimentaire
- `home-v2-apps-1-today` · kaart 1: vandaag
  - NL: Elke klant stuurt een eigen vragenlijst. Iemand van de kwaliteitsdienst zoekt de antwoorden op in specificaties, certificaten en oude lijsten, en typt ze over.
  - FR: Chaque client envoie son propre questionnaire. Une personne du service qualité recherche les réponses dans les spécifications, les certificats et les anciens questionnaires, puis les ressaisit.
- `home-v2-apps-1-prep` · kaart 1: wij bereiden voor
  - NL: Orion vult de lijst in vanuit uw eigen documenten en toont bij elk antwoord de bron.
  - FR: Orion remplit le questionnaire à partir de vos propres documents et indique la source de chaque réponse.
- `home-v2-apps-1-keep` · kaart 1: uw medewerker
  - NL: Uw kwaliteitsverantwoordelijke kijkt elk antwoord na, keurt goed en verstuurt.
  - FR: Votre responsable qualité vérifie chaque réponse, valide et envoie.
- `home-apps-2-h` · h3 kaart 2 (bestaand, ongewijzigd) (bestaand)
  - NL: Technisch onderhoud
  - FR: Maintenance technique
- `home-v2-apps-2-today` · kaart 2: vandaag
  - NL: Na een inspectie typt een technieker de vaststellingen over in een werkbon of in het onderhoudssysteem.
  - FR: Après une inspection, un technicien ressaisit les constats dans un bon de travail ou dans le système de maintenance.
- `home-v2-apps-2-prep` · kaart 2: wij bereiden voor
  - NL: Wij maken uit het inspectieverslag een conceptwerkbon met de voorgestelde acties.
  - FR: À partir du rapport d’inspection, nous préparons un projet de bon de travail avec les actions proposées.
- `home-v2-apps-2-keep` · kaart 2: uw medewerker
  - NL: Uw onderhoudsteam beslist welke acties het registreert en inplant.
  - FR: Votre équipe de maintenance décide des actions qu’elle enregistre et planifie.
- `home-apps-3-h` · h3 kaart 3 (bestaand, ongewijzigd) (bestaand)
  - NL: Administratie
  - FR: Administration
- `home-v2-apps-3-today` · kaart 3: vandaag
  - NL: Facturen, bestelbonnen en aanvragen komen binnen per mail of als pdf. Iemand neemt de gegevens met de hand over in uw systeem.
  - FR: Factures, bons de commande et demandes arrivent par e-mail ou en PDF. Quelqu’un reprend les données à la main dans votre système.
- `home-v2-apps-3-prep` · kaart 3: wij bereiden voor
  - NL: Wij halen de gegevens uit het document en zetten een conceptaanvraag klaar.
  - FR: Nous extrayons les données du document et préparons un projet de demande.
- `home-v2-apps-3-keep` · kaart 3: uw medewerker
  - NL: Uw medewerker controleert het concept en registreert het in uw eigen systeem.
  - FR: Votre collaborateur vérifie le projet et l’enregistre dans votre propre système.
- `home-apps-4-h` · h3 kaart 4 (bestaand, ongewijzigd) (bestaand)
  - NL: Logistiek
  - FR: Logistique
- `home-v2-apps-4-today` · kaart 4: vandaag
  - NL: Iemand vergelijkt leveringsdocumenten lijn per lijn met de bestelling en mailt de verschillen door.
  - FR: Quelqu’un compare les documents de livraison ligne par ligne avec la commande et transmet les écarts par e-mail.
- `home-v2-apps-4-prep` · kaart 4: wij bereiden voor
  - NL: Wij lezen de leveringsdocumenten in, vergelijken ze met de bestelling en zetten de afwijkingen op een rij.
  - FR: Nous lisons les documents de livraison, les comparons avec la commande et listons les écarts.
- `home-v2-apps-4-keep` · kaart 4: uw medewerker
  - NL: De medewerker die de afwijking kan opvolgen, beslist wat er gebeurt.
  - FR: Le collaborateur qui peut assurer le suivi de l’écart décide de la suite.

## 3. terugkerend (nieuw kernblok)

Opbouw: eyebrow, h2, lede; dan vier blokken met elk een h3: waar het werk zit (lijst), waarom niemand het ziet (twee alinea’s), wat het kost (rekenvoorbeeld, visueel als één kader met label "Rekenvoorbeeld"), zo herkent u het (checklist van 7). Slotzin onderaan, met een rustige verwijzing naar `#aanpak`.

- `home-v2-rec-eyebrow` · eyebrow
  - NL: Terugkerend werk
  - FR: Travail répétitif
- `home-v2-rec-h` · h2 (bestaande tekst, verhuist van toepassingen; nieuwe sleutel) (bestaand)
  - NL: Welk terugkerend werk kost uw team tijd?
  - FR: Quel travail répétitif coûte du temps à votre équipe ?
- `home-v2-rec-lede` · lede
  - NL: Meestal gaat het om kleine handelingen die elke dag terugkomen, op bijna elke afdeling. Apart lijken ze onbelangrijk. Samen lopen ze op tot uren per week.
  - FR: Il s’agit le plus souvent de petites opérations qui reviennent chaque jour, dans presque tous les services. Prises une à une, elles semblent anodines. Ensemble, elles représentent des heures chaque semaine.
- `home-v2-rec-tasks-h` · h3
  - NL: Waar het werk zit
  - FR: Où se trouve ce travail
- `home-v2-rec-task-1` · li
  - NL: Kwaliteit zoekt specificaties en certificaten op in mappen en typt dezelfde antwoorden over in elke nieuwe klantvragenlijst.
  - FR: La qualité recherche les spécifications et les certificats dans des dossiers et ressaisit les mêmes réponses dans chaque nouveau questionnaire client.
- `home-v2-rec-task-2` · li
  - NL: Onderhoud zet inspectieverslagen en notities om in werkbonnen en rapporten.
  - FR: La maintenance transforme les rapports d’inspection et les notes en bons de travail et en rapports.
- `home-v2-rec-task-3` · li
  - NL: Administratie neemt gegevens uit mails en pdf’s over in Excel en daarna nog eens in het ERP.
  - FR: L’administration reprend les données des e-mails et des PDF dans Excel, puis une nouvelle fois dans l’ERP.
- `home-v2-rec-task-4` · li
  - NL: Logistiek vergelijkt leveringsbonnen met bestellingen en stuurt afwijkingen per mail door.
  - FR: La logistique compare les bons de livraison avec les commandes et transmet les écarts par e-mail.
- `home-v2-rec-task-5` · li
  - NL: Verkoop en klantendienst beantwoorden dezelfde klantvragen telkens opnieuw.
  - FR: La vente et le service clientèle répondent sans cesse aux mêmes questions des clients.
- `home-v2-rec-why-h` · h3
  - NL: Waarom niemand het ziet
  - FR: Pourquoi personne ne le voit
- `home-v2-rec-why-p1` · p
  - NL: Dit werk staat in geen enkele planning. Het is verspreid over korte momenten: tien minuten zoeken, een kwartier overtypen, een mail doorsturen en wachten op antwoord. Niemand meet het, dus niemand ziet het totaal. Wie het al jaren doet, vindt het gewoon deel van de job.
  - FR: Ce travail ne figure dans aucun planning. Il est dispersé en courts moments : dix minutes de recherche, un quart d’heure de ressaisie, un e-mail à transférer et une réponse à attendre. Personne ne le mesure, donc personne ne voit le total. Ceux qui le font depuis des années le considèrent simplement comme une partie du travail.
- `home-v2-rec-why-p2` · p
  - NL: Het kost ook meer dan tijd. Bij elke keer overtypen kan een fout insluipen. En een klant wacht op antwoord tot de juiste collega vrij is.
  - FR: Le coût ne se limite pas au temps. Chaque ressaisie peut introduire une erreur. Et un client attend sa réponse jusqu’à ce que le bon collègue soit disponible.
- `home-v2-rec-cost-h` · h3
  - NL: Wat het kost: reken het zelf uit
  - FR: Ce que cela coûte : faites le calcul
- `home-v2-rec-calc-label` · label boven de berekening (verplicht zichtbaar)
  - NL: Rekenvoorbeeld
  - FR: Exemple de calcul
- `home-v2-rec-calc-1` · aanname
  - NL: Stel: 3 medewerkers besteden elk 2 uur per week aan opzoeken en overtypen.
  - FR: Supposons : 3 collaborateurs consacrent chacun 2 heures par semaine à rechercher et à ressaisir des informations.
- `home-v2-rec-calc-2` · regel berekening
  - NL: 3 × 2 uur = 6 uur per week.
  - FR: 3 × 2 heures = 6 heures par semaine.
- `home-v2-rec-calc-3` · regel berekening
  - NL: 6 uur × 46 werkweken = 276 uur per jaar.
  - FR: 6 heures × 46 semaines de travail = 276 heures par an.
- `home-v2-rec-calc-4` · regel berekening
  - NL: 276 uur × € 45 loonkost per uur = € 12.420 per jaar.
  - FR: 276 heures × 45 € de coût salarial par heure = 12 420 € par an.
- `home-v2-rec-calc-note` · kleine noot
  - NL: 46 werkweken: 52 weken min ongeveer 6 weken verlof en feestdagen. Loonkost per uur: een aanname. Vervang de cijfers door die van uw eigen team.
  - FR: 46 semaines de travail : 52 semaines moins environ 6 semaines de congés et de jours fériés. Coût salarial par heure : une hypothèse. Remplacez ces chiffres par ceux de votre équipe.
- `home-v2-rec-calc-close` · p
  - NL: De uitkomst toont een orde van grootte. Hoeveel tijd u daarvan echt terugwint, meten we in een pilot.
  - FR: Le résultat donne un ordre de grandeur. Le temps que vous récupérez réellement, nous le mesurons lors d’un pilote.
- `home-v2-rec-check-h` · h3
  - NL: Zo herkent u het
  - FR: Comment le reconnaître
- `home-v2-rec-check-1` · li checklist
  - NL: Dezelfde gegevens worden in twee of meer systemen ingetikt.
  - FR: Les mêmes données sont saisies dans deux systèmes ou plus.
- `home-v2-rec-check-2` · li checklist
  - NL: Iemand zoekt elke week in mappen of mails naar een certificaat, een specificatie of een oud antwoord.
  - FR: Chaque semaine, quelqu’un cherche un certificat, une spécification ou une ancienne réponse dans des dossiers ou des e-mails.
- `home-v2-rec-check-3` · li checklist
  - NL: Klanten stellen vragen die u al eens beantwoord hebt, en het antwoord wordt opnieuw opgesteld.
  - FR: Des clients posent des questions auxquelles vous avez déjà répondu, et la réponse est rédigée à nouveau.
- `home-v2-rec-check-4` · li checklist
  - NL: Een Excel-lijst houdt het werk tussen twee systemen bij elkaar.
  - FR: Un fichier Excel fait le lien entre deux systèmes.
- `home-v2-rec-check-5` · li checklist
  - NL: Rapporten of werkbonnen worden telkens met de hand opgemaakt, in hetzelfde stramien.
  - FR: Les rapports ou les bons de travail sont chaque fois établis à la main, selon le même modèle.
- `home-v2-rec-check-6` · li checklist
  - NL: Is één collega ziek of met verlof, dan blijft een taak liggen.
  - FR: Si un collègue est malade ou en congé, une tâche reste en attente.
- `home-v2-rec-check-7` · li checklist
  - NL: Niemand weet hoeveel tijd een taak per week kost.
  - FR: Personne ne sait combien de temps une tâche prend par semaine.
- `home-v2-rec-close` · slotzin (leidt naar #aanpak)
  - NL: Herkent u er twee of meer? Kies de taak die het vaakst terugkomt. Met die ene taak starten we de pilot.
  - FR: Vous en reconnaissez deux ou plus ? Choisissez la tâche qui revient le plus souvent. C’est avec cette seule tâche que nous démarrons le pilote.

## 4. aanpak (nieuw, drie fases)

- `home-v2-aanpak-eyebrow` · eyebrow
  - NL: Aanpak
  - FR: Approche
- `home-v2-aanpak-h` · h2
  - NL: Zo starten we
  - FR: Notre façon de démarrer
- `home-v2-aanpak-lede` · lede (bestaande toep-pilot-titel, nieuwe sleutel) (bestaand)
  - NL: Verbeter één werkproces met de systemen die u al gebruikt.
  - FR: Améliorez un processus de travail avec les systèmes que vous utilisez déjà.
- `home-v2-aanpak-1-h` · h3 fase 1 (bestaande tekst) (bestaand)
  - NL: Workflowscan
  - FR: Scan des workflows
- `home-v2-aanpak-1-p` · p fase 1
  - NL: We kiezen samen één taak die uw team vaak herhaalt. We meten hoeveel tijd die vandaag vraagt en waar het werk vastloopt.
  - FR: Nous choisissons ensemble une tâche que votre équipe répète souvent. Nous mesurons le temps qu’elle demande aujourd’hui et l’endroit où le travail bloque.
- `home-v2-aanpak-2-h` · h3 fase 2
  - NL: Pilot op één taak
  - FR: Pilote sur une tâche
- `home-v2-aanpak-2-p` · p fase 2
  - NL: We automatiseren die ene taak, zo veel mogelijk met de systemen die u al gebruikt. Samen bepalen we waar uw medewerkers moeten blijven nakijken.
  - FR: Nous automatisons cette seule tâche, autant que possible avec les systèmes que vous utilisez déjà. Ensemble, nous déterminons les points que vos collaborateurs doivent continuer à vérifier.
- `home-v2-aanpak-3-h` · h3 fase 3
  - NL: Meten en beslissen
  - FR: Mesurer et décider
- `home-v2-aanpak-3-p` · p fase 3
  - NL: We vergelijken de tijd vóór en na. Daarna beslist u: uitbreiden naar een volgende taak of stoppen.
  - FR: Nous comparons le temps avant et après. Ensuite, vous décidez : passer à une tâche suivante ou arrêter.

## 5. fundament (alleen eyebrow)

- `home-v2-fundament-eyebrow` · eyebrow
  - NL: Fundament
  - FR: Fondations

## 6. kloof (alleen eyebrow; Statbel/OECD-tekst ongewijzigd)

- `home-v2-kloof-eyebrow` · eyebrow
  - NL: Cijfers
  - FR: Chiffres

## 7. vertrouwelijk (alleen eyebrow; bestaande tekst ongewijzigd)

- `home-v2-trust-eyebrow` · eyebrow
  - NL: Controle
  - FR: Contrôle

## 8. proof (alleen eyebrow; bestaande tekst ongewijzigd)

- `home-v2-proof-eyebrow` · eyebrow
  - NL: Achtergrond
  - FR: Parcours

## 9. final (alleen eyebrow; bestaande tekst en CTA ongewijzigd)

- `home-v2-final-eyebrow` · eyebrow
  - NL: Pilot
  - FR: Pilote

## Woordtellingen

- terugkerend, NL lopende tekst (zonder eyebrow en koppen): 351 woorden
- terugkerend, NL alles: 379 woorden
- toepassingen, nieuwe NL kaarttekst: 204 woorden
- aanpak, nieuwe NL tekst: 71 woorden
- totaal nieuwe NL tekst: 666 woorden

## Voor de sponsor om te bevestigen

1. Rekenvoorbeeld: de aannames 3 medewerkers, 2 uur per week, 46 werkweken en € 45 loonkost per uur. Het bedrag is een aanname, geen gemeten cijfer, en staat zo gelabeld. Wilt u liever alleen uren tonen, schrap dan `home-v2-rec-calc-4` en het woord "Loonkost per uur" uit de noot.
2. De vraag "Welk terugkerend werk kost uw team tijd?" verhuist van `toepassingen` naar het nieuwe blok `terugkerend`. `toepassingen` krijgt als titel "Vier toepassingen, één werkwijze".
3. Herokop-eyebrow "Workflow-automatisering en AI voor kmo’s" is optioneel; de hero heeft een h1 en geen h2.
4. Geruststellende regel in de hero: "Wij bereiden voor. Uw team kijkt na en beslist." (variant op de brief, die "Uw team kijkt na. U beslist." voorstelde).
5. Logistiekkaart: "mailt de verschillen door" en de takenlijst beschrijven een typische werkwijze, geen vastgestelde situatie bij een klant.
6. Fase 3 van de aanpak noemt twee uitkomsten: uitbreiden naar een volgende taak of stoppen. Er staat geen duur en geen prijs bij.
