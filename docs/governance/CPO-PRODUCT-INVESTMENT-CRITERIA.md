# Grow Faster — CPO Product Investment Criteria

**Status:** vastgesteld door Executive Sponsor op 21 november 2026  
**Eigenaar:** CPO  
**Geldt voor:** alle voorgestelde producten, apps, features, AI-workflows en materiële uitbreidingen.

## 1. Doorslaggevende vraag

> **Kan Grow Faster dit specifieke bedrijfsprobleem aantoonbaar beter, sneller en tegen een lagere totale kost oplossen dan de beste beschikbare oplossing voor deze klant?**

Een technisch mogelijke functie, een AI-label of een hoge WSJF-score is nooit voldoende reden om te bouwen. Vergelijk vanuit de klant: licenties, implementatie, integraties, training, beheer, veiligheid, ondersteuning en overstapkosten. Is niet op alle drie dimensies aantoonbare superioriteit bewezen, dan is een expliciet onderbouwde uitzondering met toestemming van de Executive Sponsor vereist.

## 2. Verplichte alternatievencontrole

Controleer vóór een bouwbeslissing de huidige software van de klant én relevante beschikbare oplossingen, inclusief standaardmogelijkheden, configuratie, extensies, workflowautomatisering en integraties:

- Salesforce en het ecosysteem;
- SAP en de relevante SAP-modules;
- ServiceNow;
- Microsoft Dynamics 365;
- Microsoft Dynamics 365 Business Central;
- Microsoft 365, Copilot, Power Automate, Power Apps en AI Builder;
- gespecialiseerde sectorsoftware, SaaS en bestaande interne processen.

Leg vast wat al mogelijk is, wat ontbreekt, implementatietijd, totale eigendomskosten, datarisico's en geschiktheid voor een Vlaamse kmo. Een oplossing is niet uniek omdat de functionaliteit niet standaard zichtbaar is.

## 3. Beslisvolgorde (verplicht)

1. **Valideer het probleem:** gesprekken, frequentie, ernst, huidige werkwijze, nulmeting.
2. **Onderzoek bestaande oplossingen:** klantstack én beste reële externe alternatief.
3. **Build / Buy / Integrate / Reject:** motiveer de minst kostelijke verantwoorde aanpak; bouw geen duplicaat zonder overtuigende reden.
4. **Vergelijk klantwaarde en economie:** voordelen, doorlooptijd, totale kosten, risico's, betalingsbereidheid.
5. **Bereken WSJF:** uitsluitend voor kandidaten die de voorafgaande toetsen doorstaan.
6. **Vraag het sponsorbesluit:** GO, NO-GO, PIVOT of aanvullend onderzoek.

## 4. WSJF

**WSJF = (Business Value + Time Criticality + Risk Reduction / Opportunity Enablement) / Job Size.**

Gebruik een consistente relatieve schaal, bijvoorbeeld 1, 2, 3, 5, 8, 13. Noteer aannames en onzekerheid. Job Size is de *resterende* inspanning, met architectuur, security, testen en exploitatie; herbruikbare code telt mee. WSJF vervangt nooit productvalidatie, beveiliging of sponsorbevoegdheid.

## 5. Minimale inhoud investeringsdossier

| Verplicht onderdeel | Minimaal bewijs |
|---|---|
| Klantprobleem | Doelgroep, gesprekken, frequentie, tijdverlies en nulmeting |
| Alternatieven | Bestaande ERP/CRM/workflow/SaaS en toepasselijke licenties/modules |
| Voordeel | Meetbaar beter, sneller en goedkoper of expliciet goedgekeurde uitzondering |
| Businesscase | Businesswaarde, kosten, prijs, betalingsbereidheid, terugverdientijd |
| Risico's | Security, privacy, AI-betrouwbaarheid, compliance, leveranciers |
| Architectuur | Modulair ontwerp, hergebruik, impact op bestaande systemen |
| Prioriteit | WSJF-componenten met onderbouwing |
| Besluit | Build/Buy/Integrate/Reject, sponsor GO/NO-GO/PIVOT en datum |

## 6. Productgrenzen

- Grow Faster is **geen generieke AI-toolbox** of verzameling duplicaten van bestaande enterprise-software.
- Richt je op herhaalbare, bij voorkeur sectorspecifieke administratieve of operationele processen tussen organisaties, documenten en systemen, wanneer bestaande oplossingen aantoonbaar tekortschieten.
- Eerste segment: ondernemingen met 10–49 medewerkers in Oost- en West-Vlaanderen.
- Behoud menselijke goedkeuring voor materiële externe claims en risicovolle AI-uitkomsten; gebruik broncontrole en traceerbaarheid waar relevant.
- **Orion** blijft het bestaande product met zijn eigen bindende Poort 0, bouwstop en beslissingenregister: zie [Orion CLAUDE.md](https://github.com/erhol1973/vragenlijst-assistent/blob/main/CLAUDE.md). Dit document geeft geen aparte bouw- of pilotvrijgave.

## 7. Toepassing en bevoegdheden

- CPO beheert dit criterium, verzamelt bewijs en adviseert.
- Een onafhankelijke reviewer controleert concurrentieaannames, kosten, risico's en WSJF vóór een investeringsvoorstel.
- Alleen Executive Sponsor beslist over strategische uitzonderingen, investeringen en wijzigingen aan het criterium.
- Registreer beslissingen append-only in [DECISION-REGISTER.md](DECISION-REGISTER.md), met bron en datum.
- Voorkom dubbele documenten: verwijs naar dit canonieke bestand vanuit agents en werkstromen.
- Alle wijzigingen via PR/review; de productiepoort van [OPERATING-MODEL.md](OPERATING-MODEL.md) blijft gelden.

**Verplichte CPO-vraag:** Waarom koopt deze klant dit bij Grow Faster in plaats van het met zijn bestaande Salesforce-, SAP-, ServiceNow-, Dynamics-, Business Central-, Microsoft-omgeving of gespecialiseerde software op te lossen?

**Geen onderbouwd antwoord = geen bouwbeslissing.**
