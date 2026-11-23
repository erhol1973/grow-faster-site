# Afspraken op grow-faster.be

Sinds 23 november 2026 boeken klanten een gesprek via onze eigen module in plaats van Google Agenda. Google verstuurde de bevestigingen vanaf het Gmail-adres, en erlend@grow-faster.be is geen Microsoft 365-account, dus Microsoft Bookings of HubSpot konden de agenda niet lezen.

## Hoe het werkt

1. De klant kiest op `afspraak.html` een onderwerp, een dag en een uur, en vult naam, e-mail, telefoon, organisatie en functie in.
2. `assets/booking.js` vraagt de vrije uren op bij de Edge Function `booking` en stuurt de aanvraag daarheen.
3. De functie controleert de regels in `supabase/functions/booking/rules.js` (ma-vr, start 09:00 tot 16:00, een uur, minstens 24 uur vooraf, Belgische feestdagen dicht, geblokkeerde periodes en bestaande afspraken uitgesloten).
4. De database (`supabase/migrations/20261123_booking.sql`) bewaart de afspraak in het private schema. Een unieke index maakt een dubbele boeking onmogelijk.
5. De functie mailt de klant (NL of FR) en Erlend vanaf info@grow-faster.be, met een agenda-uitnodiging (.ics) in de bijlage. Die zet de afspraak met één klik in Outlook, Google of Apple.
6. Erlend beheert afspraken en blokkeert momenten op `admin-afspraken.html`, met hetzelfde account als de contentstudio.

De live site gebruikt project growfaster-prod. Elke andere host (branch previews, lokaal) gebruikt growfaster-test.

## Eenmalig instellen per project

De functie verstuurt pas mails als SMTP_PASS bestaat. Zet ze in het Supabase-dashboard onder Edge Functions, Secrets. Ze horen nooit in de repository of in een chat.

| Naam | Waarde |
|---|---|
| SMTP_PASS | wachtwoord van de mailbox info@grow-faster.be (verplicht, het enige geheim) |
| SMTP_HOST | optioneel, standaard v031.belgianhosting.be (Belgian Hosting, opgegeven door Erlend) |
| SMTP_PORT | optioneel, standaard 465 met SSL (Supabase blokkeert uitgaand verkeer op 25 en 587) |
| SMTP_USER, MAIL_FROM | optioneel, standaard info@grow-faster.be |
| OWNER_EMAIL | optioneel, standaard erlend@grow-faster.be |
| IP_SALT | aanbevolen: willekeurige tekst van minstens 32 tekens |

Zonder deze instellingen wordt de afspraak wel opgeslagen, en toont de beheerpagina "de bevestigingsmail is niet verstuurd".

## Productie in gebruik nemen

1. Migratie `20261123_booking.sql` uitvoeren op growfaster-prod.
2. Functie `booking` deployen op growfaster-prod (zonder JWT-controle; de functie valideert zelf).
3. Secrets zetten, dan een echte testboeking doen en annuleren in de beheerpagina.
4. Pas daarna de pull request mergen, zodat de live pagina nooit een functie aanroept die nog niet bestaat.

## Bekende grenzen

- Annuleren in de beheerpagina stuurt geen mail. Erlend laat de klant het zelf weten.
- Privé-afspraken in Google of Outlook blokkeren niet automatisch. Erlend blokkeert ze in de beheerpagina (keuze van 23 november 2026).
- Spamweerstand: verborgen veld, minimale invultijd van 3 seconden en maximaal 5 pogingen per uur per IP-adres. Het IP-adres wordt alleen als versleutelde code een dag bewaard.
