(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GFDemoCases = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const text = (nl, fr) => ({ nl, fr });
  const names = {
    strategy: text('Strategie', 'Stratégie'), people: text('Mensen en vaardigheden', 'Personnes et compétences'),
    process: text('Processen en waardestromen', 'Processus et flux de valeur'), governance: text('Besluitvorming en governance', 'Décisions et gouvernance'),
    data: text('Data en kennis', 'Données et connaissances'), technology: text('Technologie en AI', 'Technologie et IA')
  };
  function dimensions(observations) { return Object.keys(names).map((id, index) => ({ id, name: names[id], observation: observations[index] })); }
  const cases = [
    {
      id: 'external', kind: 'external', title: text('Een klant vraagt traceerbare AI-ondersteuning', 'Un client demande une assistance IA traçable'),
      summary: text('Fictief extern signaal: een distributieklant vraagt binnen zes maanden aantoonbare herkomst en menselijke controle bij AI-ondersteunde leveringsbeloften.', 'Signal externe fictif : un client de distribution demande, dans les six mois, une provenance démontrable et un contrôle humain des promesses de livraison assistées par IA.'),
      source: text('Verzonnen klantvraag in een voorbeeld-tender; geen echte klant of regelgeving.', 'Demande client inventée dans un appel d’offres illustratif; aucun client réel ni texte réglementaire.'), date: '2026-11-13',
      implication: text('Managementinterpretatie: betrouwbare leveringsinformatie kan een concurrentievoorwaarde worden. Eerst onderzoeken welke brondata en beslisrechten ontbreken.', 'Interprétation managériale : la fiabilité des informations de livraison pourrait devenir une condition concurrentielle. Examiner d’abord les données sources et les droits de décision manquants.'),
      evidence: text('Uitsluitend fictieve oefengegevens: de tendertekst en een verzonnen steekproef van 40 orders. Geen marktbewijs of geverifieerde wettelijke plicht.', 'Données d’exercice uniquement : texte inventé et échantillon fictif de 40 commandes. Aucune preuve de marché ni obligation légale vérifiée.'),
      uncertainty: text('Onbekend of andere klanten dit vragen, welke prestatieverbetering haalbaar is en of de bestaande data voldoende betrouwbaar zijn.', 'On ignore si d’autres clients expriment ce besoin, quel progrès est possible et si les données existantes sont assez fiables.'),
      dimensions: dimensions([
        text('Welke klantenbelofte en strategische prioriteit rechtvaardigen een proef?', 'Quelle promesse client et quelle priorité stratégique justifient un essai ?'),
        text('Planners moeten uitzonderingen kunnen beoordelen; opleiding en beschikbare tijd zijn onbekend.', 'Les planificateurs doivent pouvoir apprécier les exceptions; la formation et le temps disponible restent inconnus.'),
        text('De overdracht tussen verkoop, voorraad en transport is nog niet als geheel beschreven.', 'Le passage entre vente, stock et transport n’est pas encore décrit de bout en bout.'),
        text('Een planner blijft besliseigenaar; commerciële en operationele escalaties moeten worden afgesproken.', 'Un planificateur reste responsable de la décision; les escalades commerciales et opérationnelles doivent être convenues.'),
        text('Voorraadactualiteit, orderstatus en bronherkomst moeten vóór automatisering worden onderzocht.', 'L’actualité des stocks, le statut des commandes et la provenance doivent être examinés avant l’automatisation.'),
        text('Onderzoek eerst bestaande systemen; een nieuw AI-platform is geen vooraf gekozen oplossing.', 'Examiner d’abord les systèmes existants; une nouvelle plateforme IA n’est pas une solution préchoisie.')
      ]),
      canvas: {
        question: text('Hoe beantwoorden we de klantvraag met betrouwbare leveringsbeloften zonder onbeheersbaar automatiseringsrisico?', 'Comment répondre au client avec des promesses de livraison fiables sans risque d’automatisation incontrôlable ?'),
        situation: text('Fictieve distributeur met 180 medewerkers. Verkoop en planning gebruiken verschillende overzichten; huidige foutgraad en herstelkosten zijn nog niet gemeten.', 'Distributeur fictif de 180 personnes. Vente et planification utilisent des vues différentes; le taux d’erreur et les coûts de correction ne sont pas encore mesurés.'),
        options: [
          { id: 'wait', label: text('Nog niet automatiseren', 'Ne pas automatiser pour l’instant'), description: text('Vraag verduidelijken en huidige handmatige controle behouden; risico op vertraging in de tender.', 'Clarifier la demande et conserver le contrôle manuel; risque de retard dans l’appel d’offres.') },
          { id: 'pilot', label: text('Beperkte gecontroleerde proef', 'Essai limité et contrôlé'), description: text('Eén productgroep onderzoeken met menselijke goedkeuring en expliciete bronverwijzing.', 'Étudier une famille de produits avec approbation humaine et provenance explicite.') },
          { id: 'scale', label: text('Direct breed uitrollen', 'Déployer largement immédiatement'), description: text('Snel breed automatiseren; datakwaliteit, kosten en gevolgen zijn nog onvoldoende onderbouwd.', 'Automatiser rapidement à grande échelle; qualité des données, coûts et conséquences restent insuffisamment étayés.') }
        ],
        value: text('Hypothese: betrouwbaardere beloften en minder herstelwerk. Geen omzet- of ROI-claim; eerst huidige prestaties en klantverwachtingen vastleggen.', 'Hypothèse : promesses plus fiables et moins de corrections. Aucune affirmation de chiffre d’affaires ou de ROI; établir d’abord les performances actuelles et attentes client.'),
        resources: text('Fictieve planningsaanname: maximaal 20 werkuren in totaal, verdeeld over verkoop, planning en dataonderzoek. Leverancierskosten en operationele impact zijn onbekend.', 'Hypothèse fictive de planification : au maximum 20 heures de travail au total, réparties entre vente, planification et analyse des données. Les coûts fournisseurs et l’impact opérationnel restent inconnus.'),
        risks: text('Onjuiste voorraadgegevens, onduidelijk eigenaarschap, leverancierafhankelijkheid en onbedoeld bindende klantbeloften. Geen klantgegevens naar AI-diensten sturen.', 'Stocks inexacts, responsabilité floue, dépendance fournisseur et promesses engageantes involontaires. Ne transmettre aucune donnée client à des services IA.'),
        unknowns: text('Vraag de klant om acceptatiecriteria. Voer een nulmeting uit en onderzoek bronactualiteit, uitzonderingen, bescherming van persoonsgegevens en beschikbare capaciteit.', 'Demander au client ses critères d’acceptation. Établir une mesure de référence et examiner l’actualité des données sources, les exceptions, la protection des données personnelles et la capacité disponible.'),
        recommendation: text('Voorstel, niet goedgekeurd: start alleen een afgebakende proef nadat brondata, eigenaar en stopcriteria zijn besproken.', 'Proposition non approuvée : lancer uniquement un essai délimité après discussion des données sources, du responsable et des critères d’arrêt.'),
        owner: text('Fictieve COO, samen met verkoopverantwoordelijke en planner; echte eigenaar nog te bevestigen.', 'COO fictif, avec responsable commercial et planificateur; responsable réel à confirmer.'), decisionDate: '2026-11-27',
        success: text('Voorstel: iedere proefbelofte heeft een herleidbare bron en menselijke beoordeling; vergelijk correcties en doorlooptijd met een vastgelegde nulmeting. Stop bij onverklaarde bronnen of onveilige beloften.', 'Proposition : chaque promesse de l’essai dispose d’une source traçable et d’un examen humain; comparer corrections et délai à une référence établie. Arrêter en cas de source inexpliquée ou de promesse dangereuse.')
      }
    },
    {
      id: 'internal', kind: 'internal', title: text('Orderuitzonderingen blijven tussen teams liggen', 'Les exceptions de commande restent bloquées entre équipes'),
      summary: text('Fictief intern signaal: verkoop en operations melden herhaaldelijk vertraging bij afwijkende orders, terwijl de teams aangeven individueel voldoende capaciteit te hebben.', 'Signal interne fictif : vente et opérations signalent des retards répétés pour les commandes exceptionnelles, alors que les équipes estiment disposer individuellement d’une capacité suffisante.'),
      source: text('Verzonnen operationeel overleg en fictief proceslog; geen informatie van een bestaande onderneming.', 'Réunion opérationnelle et journal de processus inventés; aucune donnée d’une entreprise réelle.'), date: '2026-11-13',
      implication: text('Managementinterpretatie: overdrachten en beslisrechten kunnen meer vertragen dan de uitvoering zelf. Meer AI lost dat niet automatisch op.', 'Interprétation managériale : les transferts et droits de décision pourraient ralentir davantage que le travail lui-même. Davantage d’IA ne résout pas automatiquement ce problème.'),
      evidence: text('Fictieve illustratie: in 12 van 30 voorbeeldorders ontbreekt een benoemde besliseigenaar. De steekproef is niet echt en bewijst geen oorzakelijk verband.', 'Illustration fictive : pour 12 commandes sur 30, aucun responsable de décision n’est nommé. L’échantillon est inventé et ne démontre aucune causalité.'),
      uncertainty: text('De echte verdeling van wachttijd, complexiteit en herstelwerk is onbekend; de rol van capaciteit en seizoensdruk moet nog worden onderzocht.', 'La répartition réelle entre attente, complexité et correction est inconnue; le rôle de la capacité et de la saisonnalité reste à étudier.'),
      dimensions: dimensions([
        text('Stem af welke klantuitzonderingen strategisch belangrijk zijn en welke standaard kunnen worden afgehandeld.', 'Déterminer quelles exceptions client sont stratégiques et lesquelles peuvent suivre le traitement standard.'),
        text('Teams hebben mogelijk verschillende definities en escalatievaardigheden; valideer dit met betrokkenen.', 'Les équipes utilisent peut-être des définitions différentes et ne disposent pas des mêmes compétences pour gérer les escalades; le vérifier avec les personnes concernées.'),
        text('Breng wachttijd en overdrachten in één end-to-end waardestroom in kaart.', 'Cartographier attente et transferts dans un seul flux de valeur de bout en bout.'),
        text('Wijs per uitzonderingssoort een eigenaar en escalatiemoment aan; geen automatische AI-beslissing.', 'Désigner un responsable et un moment d’escalade par exception; aucune décision IA automatique.'),
        text('Leg status, aankomsttijd, besluit en heropening eenduidig vast voordat een effect wordt berekend.', 'Enregistrer de manière cohérente statut, arrivée, décision et réouverture avant de calculer un effet.'),
        text('Bestaande wachtrij en eenvoudige signalering kunnen volstaan; toets eerst de noodzaak van AI.', 'Une file existante et des alertes simples peuvent suffire; vérifier d’abord le besoin d’IA.')
      ]),
      canvas: {
        question: text('Hoe verkorten we de afhandeling van orderuitzonderingen zonder kwaliteit of verantwoordingsplicht te verliezen?', 'Comment raccourcir le traitement des exceptions de commande sans perdre en qualité ni responsabilité ?'),
        situation: text('Fictieve logistieke onderneming met 240 medewerkers. Teams hebben eigen werkvoorraden; wachttijden over teamgrenzen en oorzaken van heropening zijn nog niet betrouwbaar gemeten.', 'Entreprise logistique fictive de 240 personnes. Chaque équipe a sa file; attente entre équipes et causes de réouverture ne sont pas encore mesurées de manière fiable.'),
        options: [
          { id: 'wait', label: text('Huidige werkwijze behouden', 'Conserver le fonctionnement actuel'), description: text('Niets wijzigen totdat meer data beschikbaar zijn; terugkerende vertraging kan blijven bestaan.', 'Ne rien changer avant davantage de données; les retards récurrents peuvent persister.') },
          { id: 'pilot', label: text('Eén uitzonderingsstroom herontwerpen', 'Reconcevoir un flux d’exceptions'), description: text('Maak eigenaarschap, wachttijd en escalatie zichtbaar in één afgebakende proef.', 'Rendre visibles responsabilité, attente et escalade dans un essai limité.') },
          { id: 'scale', label: text('Onmiddellijk volledig automatiseren', 'Tout automatiser immédiatement'), description: text('Groot traject met nieuwe software; mogelijk worden onduidelijke beslisregels versneld in plaats van opgelost.', 'Grand programme avec nouveau logiciel; les règles floues pourraient être accélérées plutôt que résolues.') }
        ],
        value: text('Hypothese: minder wachten en heropeningen, betrouwbaardere klantreacties. Vrijgekomen uren zijn geen automatisch gerealiseerde cashbesparing.', 'Hypothèse : moins d’attente et de réouvertures, réponses client plus fiables. Des heures libérées ne sont pas automatiquement des économies de trésorerie.'),
        resources: text('Fictieve aanname: twee begeleide sessies en een proef van twee weken met bestaande systemen. Werkelijke inzet, budget en beschikbaarheid nog vaststellen.', 'Hypothèse fictive : deux ateliers guidés et un essai de deux semaines avec les systèmes existants. Effort, budget et disponibilité réels à établir.'),
        risks: text('Schijnverbetering door eenvoudige orders te kiezen; verplaatste wachtrij; kwaliteitsverlies; ontbrekend mandaat. Gebruik geen persoonsgegevens in de oefencasus.', 'Amélioration apparente en choisissant des commandes simples; déplacement de la file; perte de qualité; mandat absent. Ne pas utiliser de données personnelles dans cet exercice.'),
        unknowns: text('Leg start/eind van doorlooptijd, vergelijkbare ordertypen en kwaliteitsmaat vast. Onderzoek de werkelijke bottleneck vóór technologiekeuze.', 'Définir début et fin du délai, types de commandes comparables et mesure de qualité. Examiner le véritable goulot avant de choisir la technologie.'),
        recommendation: text('Voorstel, niet goedgekeurd: test één stroom met duidelijke besliseigenaar en escalatiemoment; vergelijk met de nulmeting en beoordeel ook heropeningen.', 'Proposition non approuvée : tester un flux avec responsable de décision et moment d’escalade clairs; comparer à la référence et examiner aussi les réouvertures.'),
        owner: text('Fictieve operationeel verantwoordelijke, samen met verkoop en procesmedewerkers; mandaat nog te bevestigen.', 'Responsable opérationnel fictif, avec vente et équipes processus; mandat à confirmer.'), decisionDate: '2026-11-27',
        success: text('Voorstel: alle proefuitzonderingen hebben een eigenaar, tijdstempels en reden van heropening. Vergelijk mediane doorlooptijd en kwaliteit voor vergelijkbare orders; schaal alleen na gezamenlijke beoordeling.', 'Proposition : pour chaque exception de l’essai, un responsable, des horodatages et un motif de réouverture sont consignés. Comparer le délai médian et la qualité pour des commandes comparables; élargir uniquement après un examen conjoint.')
      }
    }
  ];
  function freeze(value) { Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child); }); return Object.freeze(value); }
  return freeze(cases);
});
