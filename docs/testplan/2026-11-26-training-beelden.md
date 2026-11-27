## Training met nieuw hoofdbeeld en groter trainersportret, 26 november 2026

Aanleiding: op Training vervangt de aangeleverde groepsfoto het bestaande hoofdbeeld en krijgt het bestaande portret van de trainer meer ruimte in rechthoekig formaat. De referentie is main op 6f11dc12557fb50ab3a4a19826c7869fd948b59e.

- De hero gebruikt dezelfde positie in de pagina, met een breed kader op desktop en een 3:2-kader op mobiel. De afbeeldingsvarianten van 640, 800, 1200 en 1536 pixels gebruiken WebP en blijven elk onder 60 kB. De preload en de daadwerkelijke afbeelding bieden hetzelfde bronaanbod.
- Het portret gebruikt de bestaande 4:5-bron en een breedte van 192 tot 248 pixels. De browsertest controleert de verhoudingen, de afronding en de ongewijzigde toegankelijke naam. Aanvullende NL/FR-controle op desktop en mobiel valideert de afbeelding, reflow en aanklikbare trainerslink.
- Controleer lokale build, broncontroles, NL/FR-browserregressies, toegankelijkheid van de betrokken sectie en de bestaande Lighthouse-metingen op de Training-routes. De lokale metingen en screenshots blijven buiten de website-uitvoer.
- Preview via de concept-PR. De productiefoto in Content Studio is afzonderlijk beheerd.
