## Correcties ECA-vragenlijst

Alle twintig vragen vereisen een expliciete keuze; N/A blijft ongescoord en de minimale numerieke dekking blijft gelijk. Model- en browsertests onderscheiden ontbrekende antwoorden van expliciete N/A. De browser controleert foutmelding/focus, normaal vraaggewicht, genummerde antwoordlabels, compacte antwoordhoogte, de echte contactbestemming en de oude deep link. De kritieke matrix controleert de taalafhankelijke native formulier-ID voor EN/NL/FR; axe scant vragen en uitslag in alle drie talen op desktop en mobiel. Native taalvarianten zijn expliciet toegestaan door de eigenaar en behouden het propertycontract en optionele marketingtoestemming. De alleen-lezen livecontrole ondersteunt --lang=en, --lang=nl en --lang=fr.


Antwoordlabels ECA: op verzoek zijn de zichtbare cijfers en punten verwijderd in EN/NL/FR. De bestaande browserverwachtingen volgen de nieuwe tekst en controleren alle antwoordlabels op numerieke voorvoegsels. Vraagnummers en onderliggende scorewaarden blijven gelijk.

De eerste label-PR-controle blokkeerde op één instabiele mobiele WebKit-casus: een gesimuleerde tik tijdens de automatische resultaat-scroll activeerde het formulier niet. Trace en foutbeelden blijven bewaard. De resultaat-overgang scrolt nu direct en geeft de uitslagkop focus; de bestaande scenario’s controleren die focus voor de eerste formulierklik. Geen wachttijd, retry of vrijgavegrens is verruimd. De nieuwe focuscontrole faalde eerst op de oude implementatie.

De tweede CI-uitvoering blokkeerde op WebKit-tikken na de validatiefocus naar de eerste vraag. De ECA schakelt daarom ook de overgeërfde algemene smooth-scroll uit voor alle impliciete focus- en ankerovergangen. De bestaande validatie-/selectietest controleert de berekende scrollstijl; die controle faalde op de oude smooth-stijl. Klik-/check-acties, timeouts, retries en alle vrijgavegrenzen blijven behouden. Beide mislukte CI-rapporten worden bewaard.
