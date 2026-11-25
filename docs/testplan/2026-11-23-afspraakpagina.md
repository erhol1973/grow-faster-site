## Afspraakpagina, 23 november 2026

Beslissing van de eigenaar: "Plan een pilotgesprek" opent geen mail meer maar afspraak.html. Stap 1: onderwerp kiezen (Algemene vraag, Vragenlijsten automatisch invullen met AI, Workflow-automatisering, Organisatieontwikkeling, Training), voorgeselecteerd via `?onderwerp=` vanaf de pagina waar de bezoeker vandaan komt. Stap 2: de gratis Google Agenda-boekingspagina (één schema van een uur) opent in een nieuw venster; de site laadt zelf niets van Google. Google mailt de klant en Erlend met datum, uur en de antwoorden. Geen adres gevraagd (dataminimalisatie). Privacybeleid versie 1.5 vermeldt de boekingsgegevens en Google Agenda.

Beperking van de gratis versie: het onderwerp wordt niet automatisch doorgegeven; de klant vult het in Google opnieuw in bij "Onderwerp".

Tests: nieuw tests/afspraak.test.cjs en tests/browser/afspraak.spec.cjs; de tests die een mail als gespreksknop verwachtten, verwachten nu de afspraaklink met het juiste onderwerp. Het abonnement op het Maandelijks Magazine en "Liever mailen?" blijven mailto-links.
