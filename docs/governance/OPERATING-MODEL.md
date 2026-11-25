# Grow Faster — Operating Model en releasebevoegdheid

**Versie:** 1.0 (voorgesteld voor formalisering)  
**Datum:** 21 november 2026  
**Scope:** Grow Faster-website en portfolio. Orion behoudt zijn eigen governance.

## 1. Eén bron per soort feit

| Feit | Canonieke bron | Niet als vervanging gebruiken |
|---|---|---|
| Sponsorbesluiten voor Grow Faster | [DECISION-REGISTER.md](DECISION-REGISTER.md) en daar geciteerde oorspronkelijke beslissing | Samenvatting in een chat |
| CPO-investeringscriterium | [CPO-PRODUCT-INVESTMENT-CRITERIA.md](CPO-PRODUCT-INVESTMENT-CRITERIA.md) | Nieuwe losse prompt |
| Technische releasecriteria | [../RELEASE.md](../RELEASE.md), [../TESTPLAN.md](../TESTPLAN.md), [../../AGENTS.md](../../AGENTS.md) | Een mondelinge GO zonder tests |
| Actuele website-PR's en CI | [GitHub PR's](https://github.com/erhol1973/grow-faster-site/pulls), [GitHub Actions](https://github.com/erhol1973/grow-faster-site/actions) | Verouderde spreadsheet |
| Orion-werkafspraken en Poort 0 | [Orion CLAUDE.md](https://github.com/erhol1973/vragenlijst-assistent/blob/main/CLAUDE.md), [artifacten-index](https://github.com/erhol1973/vragenlijst-assistent/blob/main/docs/artifacten-index.md) | Een nieuw Orion-register in Grow Faster |
| Automatiseringen | De GitHub Actions-workflows in dit repository en het redactieproces van het Magazine in het Claude-project GROW FASTER (doc `magazine-redactieproces`) | Handmatig overgenomen telling; de vroegere ChatGPT-configuratie (gemigreerd naar Claude) |
| Chatgeschiedenis | Oorspronkelijke chats, met een catalogus als index | De catalogus als volledige bron |

Verwijzingen zijn toegestaan; het parallel onderhouden van dezelfde besluiten in meerdere concurrerende documenten niet.

## 2. Rollen en grenzen

| Rol | Mandaat | Verboden zonder aanvullende poort |
|---|---|---|
| Executive Sponsor | Productrichting, kosten/budget, strategische uitzonderingen, Poort 0, productie GO/NO-GO | Geen technische uitvoering vereist |
| CPO / orchestrator | Prioriteren, opdrachten afbakenen, backlog en afhankelijkheden coördineren, PR's laten reviewen, technisch mergen binnen bevoegdheden | Geen impliciete sponsorbesluiten, geen productie zonder expliciete GO |
| Product Owner per werkstroom | Scope en acceptatie per initiatief, één verantwoordelijke | Geen parallelle alternatieve productvisie |
| Engineer / builder | Wijzigingen op eigen branch en toegewezen schrijfoppervlak, tests toevoegen | Niet direct op main, niet eigen werk onafhankelijk goedkeuren |
| Onafhankelijke QA/security reviewer | Reviewt wijzigingen, bewijs, risico, acceptatie | Wijzigt niet tegelijk dezelfde code die hij beoordeelt |
| Releaseverantwoordelijke | CI, artifactintegriteit, rooktest, rollback | Geen productiepublicatie zonder sponsor GO |

Per werkitem: één eigenaar, één volgende actie, één bronlink en één expliciete status. Agents mogen geen taak dupliceren voordat bestaande issues/PR's/chats gecontroleerd zijn. Splits werkzaamheden waar mogelijk op exclusieve bestandsoppervlakken; reviewer en maker zijn niet dezelfde rol.

## 3. Productiepoort — sponsor beslist

**Bindende afspraak, bevestigd op 21 november 2026:** de CPO mag werkzaamheden organiseren, testen en toegestane PR's mergen, maar vraagt *altijd vooraf expliciete GO* van de Executive Sponsor voor een productierelease.

- Als merge naar main automatisch een deployment activeert, **is die merge zelf productie-gated**; nooit mergen zonder voorafgaande specifieke sponsor-GO.
- Ook documentatie-only merges naar een branch met automatische productiedeployment volgen deze poort zolang de pipeline geen aantoonbare productie-isolatie biedt.
- Voor een productie-GO legt CPO voor: scope, verwachte businesswaarde, huidige HEAD, groen test-/securitybewijs, risico's, rollback, expliciet GO/NO-GO-advies.
- Bij ontbrekende of falende CI, onbevestigde sponsoracceptatie of twijfel over deployment: **NO-GO**. Geen stilzwijgende uitzonderingen.
- Zie [releaseprocedure](../RELEASE.md) en [testplan](../TESTPLAN.md) voor alle bestaande kwaliteitscontroles. Dit document verlaagt geen enkele testdrempel.
- Oude drafts, historische previews en niet-goedgekeurde edities blijven zonder afzonderlijke release-GO buiten productie.

Een toestemming om 'PR's te mergen' vervangt **niet** de afzonderlijk vereiste productie-GO.

## 4. Werkbeperking en prioritering

**CPO-werkafspraak:** maximaal twee grote, gelijktijdige werkstromen, tenzij de Executive Sponsor anders beslist. Kleine noodzakelijke onderhoudstaken kunnen doorgaan zolang ze deze limiet niet feitelijk omzeilen.

Voorgestelde actuele prioriteiten:
1. Orion — klantgesprekken, inhoudelijke verificatie, Poort 0. Geen nieuw featurewerk zolang de eigen bouwstop geldt.
2. Website — operationele stabiliteit, privacy/security en bestaande releaseverplichtingen.
3. Grow Faster Magazine — maandelijkse editie op journal.html volgens het redactieproces met drie sponsorpoorten (onderwerp, tekst, release); geactiveerd door GF-006.

Radar, marketing en nieuwe productideeën zijn standaard onderhoud/discovery tenzij een expliciet besluit ze activeert. Een nieuwe build vereist eerst de CPO-investeringscriteria.

## 5. Standaard werkcyclus

1. **Intake:** leg doel, klantwaarde, bestaande werkitems en betrokken bron vast.
2. **Deduplicatie:** controleer actieve PR's/issues en chats, wijs unieke eigenaar toe.
3. **Triage:** risicoklasse, urgentie, dependency, WSJF wanneer productbeslissing.
4. **Uitvoering:** branch, exclusief schrijfoppervlak, concrete acceptatiecriteria.
5. **Controle:** blijvende regressies, onafhankelijke review, relevante CI; een rode gate blijft rood.
6. **Merge/release:** volgens de productiepoort, inclusief de automatische deployment-impact.
7. **Afsluiting:** bewijslinks, decision register indien besluit, geen nieuw concurrerend statusdocument.

## 6. Orion blijft onafhankelijk bestuurd

Orion (= vragenlijst-assistent release 1) blijft in de repository [vragenlijst-assistent](https://github.com/erhol1973/vragenlijst-assistent). De eigen agentafspraken, ADR's en Poort 0 zijn leidend. Grow Faster kan status en afhankelijkheden *lezen* en naar de primaire Orion-bronnen verwijzen, maar niet stilzwijgend Orion-productbeslissingen of de bouwstop vervangen. Het Groeiplatform is het commerciële kader; de applicatie wordt niet geïntegreerd zonder product-, architectuur- en sponsorpoort.

## 7. Control Tower

Zie [CONTROL-TOWER.md](CONTROL-TOWER.md) voor bronregels, statusconventies en reviewritme. Een export of spreadsheet is een snapshot, geen live bron van waarheid.
