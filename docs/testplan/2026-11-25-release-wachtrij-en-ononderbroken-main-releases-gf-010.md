## Release-wachtrij en ononderbroken main-releases (GF-010), 25 november 2026

`.github/workflows/release.yml` annuleert een lopende run nog alleen bij een nieuwe push op dezelfde pull request; een release op `main` (deploy en publieke verificatie) wordt niet meer afgebroken door een volgende merge. Geen test, gate of drempel gewijzigd. Procesregel: één merge-poort naar main via issue #122 (AGENTS.md, OPERATING-MODEL §3a).
