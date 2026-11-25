## Work with me, Home in the menu and book presentation, 3 November 2026

The home hero states the role (Enterprise & AI Transformation Lead) and availability in Belgium, and its single primary action opens the two routes on `about.html#work-with-me`: a permanent role and a long-term assignment. Each route opens the visitor's email with a short template in English, Dutch or French; the template follows a language switch without reload, and the address itself stays assembled at runtime. Coverage: `tests/work-routes.test.cjs` (hero action, both routes, localised templates, translations) and browser cases for the hero route in three languages and the language switch.

Home is now the first item of the main menu on every page; `tests/navigation-cases.json` lists it first among the primary routes, so HTTP navigation, Contact, accessibility, load and performance coverage follow automatically. `scripts/verify-production.cjs` now expects Home plus four categories.

Both books on `books.html` share the same structure (cover, label, title, subtitle, summary, three takeaways, action, meta, access) and are shown as 3D book objects. *Design for Coherence* uses a new transparent mockup (`img/design-for-coherence-book-*.png/.webp`) on Home, About and Books. Coverage: `tests/books.test.cjs`.
