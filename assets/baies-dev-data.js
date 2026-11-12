/* BAEIS DEV: fixed, source-linked reference records. Not a live intelligence feed. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.BAEIS_DEV_DATA = data;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  return Object.freeze({
    snapshotDate: '2026-11-11',
    records: [
      {
        id:'BE-AI-001', sector:'Cross-sector', roles:['CEO','CFO','CIO','COO'], score:{belgium:5,value:4,urgency:3,evidence:5,cross:5},
        source:'Statbel', published:'2025-12-02', type:'Official statistics', confidence:'High',
        url:'https://statbel.fgov.be/nl/nieuws/artificiele-intelligentie-wordt-steeds-belangrijker-voor-belgische-bedrijven',
        metric:'34,5%',
        title:{nl:'AI bereikt meer dan één op drie Belgische ondernemingen',fr:'L’IA touche plus d’une entreprise belge sur trois'},
        claim:{nl:'Volgens de Statbel ICT-enquête gebruikte 34,5% van de onderzochte Belgische ondernemingen in 2025 minstens één AI-technologie.',fr:'Selon l’enquête TIC de Statbel, 34,5 % des entreprises belges étudiées utilisaient au moins une technologie d’IA en 2025.'},
        limit:{nl:'Adoptie toont gebruik, niet bewezen winst, productiviteit of ROI. Onderzoekspopulatie en definitie verschillen van andere barometers.',fr:'L’adoption mesure l’utilisation, pas un bénéfice, une productivité ou un retour sur investissement prouvé. Les définitions diffèrent selon les enquêtes.'},
        decision:{nl:'Onderzoek of bestaande AI-toepassingen gekoppeld zijn aan concrete proces-KPI’s en een financiële baseline.',fr:'Vérifier si les usages de l’IA sont liés à des KPI de processus et à une situation financière de référence.'}
      },
      {
        id:'BE-AI-002', sector:'SME', roles:['CEO','CFO','CIO'], score:{belgium:5,value:4,urgency:3,evidence:4,cross:4},
        source:'VLAIO / ECOOM', published:'2026-03-18', type:'Survey', confidence:'Medium',
        url:'https://www.vlaio.be/en/node/15666',
        metric:'58,8%',
        title:{nl:'Vlaamse AI-barometer bevestigt snelle adoptie',fr:'Le baromètre flamand confirme l’adoption rapide de l’IA'},
        claim:{nl:'De Vlaamse AI-barometer 2025 meldt 58,8% AI-gebruik. De enquête rapporteert 2.915 bruikbare antwoorden uit een steekproef van 9.610 bedrijven.',fr:'Le baromètre flamand 2025 indique 58,8 % d’utilisation de l’IA, avec 2 915 réponses exploitables sur un échantillon de 9 610 entreprises.'},
        limit:{nl:'Vlaamse studie, geen Belgisch totaal. Niet rechtstreeks vergelijken met Statbel: andere populatie en meetmethode.',fr:'Étude flamande, non belge. Elle n’est pas directement comparable à Statbel : population et méthodologie différentes.'},
        decision:{nl:'Segmenteer AI-adoptie per bedrijfsfunctie en identificeer waar onvoldoende governance of vaardigheden bestaan.',fr:'Segmenter les usages par fonction et repérer les lacunes de gouvernance ou de compétences.'}
      },
      {
        id:'BE-EC-003', sector:'Cross-sector', roles:['CEO','CFO','COO'], score:{belgium:5,value:4,urgency:5,evidence:4,cross:5},
        source:'Nationale Bank van België', published:'2026-06-12', type:'Economic forecast', confidence:'Medium',
        url:'https://www.nbb.be/nl/publicaties-en-onderzoek/publicaties/alle-publicaties/economic-projections-belgium-june-2026',
        metric:'0,6%',
        title:{nl:'NBB voorziet beperkte Belgische groei in 2026',fr:'La BNB prévoit une croissance belge limitée en 2026'},
        claim:{nl:'In de projecties van juni 2026 raamt de NBB de Belgische bbp-groei op 0,6% in 2026 en 1,1% in 2027.',fr:'Dans ses projections de juin 2026, la BNB estime la croissance du PIB belge à 0,6 % en 2026 et 1,1 % en 2027.'},
        limit:{nl:'Dit zijn macro-economische prognoses, geen gerealiseerde cijfers. Er is geen bewijs dat AI deze groeivooruitzichten veroorzaakt of zelfstandig kan keren.',fr:'Il s’agit de prévisions, non de résultats observés. Rien ne prouve que l’IA explique ou inversera à elle seule ces prévisions.'},
        decision:{nl:'Evalueer AI-projecten op verifieerbare productiviteitsverbetering, uitvoeringskosten en scenario-onzekerheid.',fr:'Évaluer les projets IA selon leur productivité mesurable, leurs coûts et les incertitudes de scénario.'}
      },
      {
        id:'BE-EC-004', sector:'Manufacturing', roles:['CEO','CFO','COO'], score:{belgium:5,value:4,urgency:4,evidence:5,cross:4},
        source:'Nationale Bank van België', published:'2026-10-29', type:'Preliminary economic estimate', confidence:'High',
        url:'https://www.nbb.be/nl/statistieken/laatste-cijfers/inr-flash-estimate-2026q3',
        metric:'+0,3%',
        title:{nl:'Belgische economie groeit 0,3% in het derde kwartaal',fr:'L’économie belge progresse de 0,3 % au troisième trimestre'},
        claim:{nl:'De flashraming van 29 oktober 2026 meldt +0,3% kwartaal-op-kwartaal bbp-groei in 2026 Q3; de industriële toegevoegde waarde veranderde volgens de eerste raming met −0,1%.',fr:'L’estimation flash du 29 octobre 2026 indique +0,3 % de croissance trimestrielle du PIB au T3 2026 ; la valeur ajoutée de l’industrie recule de 0,1 % selon la première estimation.'},
        limit:{nl:'Voorlopige macro-economische raming, later herzienbaar. Hieruit volgt geen causaal effect van AI op industrie of bbp.',fr:'Estimation macroéconomique provisoire susceptible de révision. Aucun effet causal de l’IA ne peut en être déduit.'},
        decision:{nl:'Koppel eventuele AI-usecases voor industrie aan gemeten wachttijden, foutkosten en doorlooptijden; maak een nulmeting.',fr:'Relier les cas d’usage IA industriels aux délais, coûts d’erreur et temps de cycle mesurés.'}
      },
      {
        id:'BE-SME-005', sector:'SME', roles:['CEO','CFO'], score:{belgium:5,value:3,urgency:3,evidence:5,cross:3},
        source:'Statbel', published:'2026-09-23', type:'Official statistics', confidence:'High',
        url:'https://statbel.fgov.be/nl/nieuws/structurele-ondernemingsstatistieken-van-2024-961-van-de-belgische-bedrijven-zijn-micro',
        metric:'96,1%',
        title:{nl:'Micro-ondernemingen domineren het Belgische bedrijfslandschap',fr:'Les microentreprises dominent le tissu économique belge'},
        claim:{nl:'Statbel meldt dat 96,1% van de bedrijven in de niet-financiële marktgerichte economie in 2024 minder dan tien werknemers had.',fr:'Statbel indique que 96,1 % des entreprises de l’économie marchande non financière comptaient moins de dix salariés en 2024.'},
        limit:{nl:'Deze statistiek omvat de niet-financiële marktgerichte economie, niet alle Belgische sectoren. Ze zegt niets rechtstreeks over AI-opbrengsten.',fr:'Cette statistique concerne l’économie marchande non financière et ne mesure pas les bénéfices de l’IA.'},
        decision:{nl:'Differentieer AI-readiness en productaanbod tussen microbedrijven, KMO’s en grotere ondernemingen.',fr:'Adapter la préparation à l’IA et les offres selon la taille des entreprises.'}
      }
    ]
  });
});
