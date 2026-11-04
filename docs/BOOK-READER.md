# Executive preview reader

## The Coherent Enterprise, 4 November 2026

The foundation book has a separate reader at `boek/the-coherent-enterprise/index.html`. All its Home, Books and About preview links open this reader. Its nine pages are rendered at 2.5x from the supplied blue PDF, without editorial changes. The original PDF replaces the orange/copper preview at the existing PDF URL so old shared links receive the corrected document too. `tests/coherent-preview.json` records the source PDF and page checksums. A direct PDF download and a no-JavaScript image gallery remain available. The reader reuses the local PageFlip library, styling and controls; the separate handbook preview retains its original 26 images and order route. Permanent coverage checks the actual Dutch catalogue click, desktop/mobile layout, flips, last page, zoom/focus, fallback, accessibility and exact PDF bytes.

The handbook preview buttons on Home, Books and About open `boek/index.html` in a new tab. The supplied ZIP contains 25 preview pages plus one closing page. These 26 original JPEGs are copied unchanged; `tests/book-reader-pages.json` records their SHA-256 checksums. The reader is not a copy of the full 82-page book.

The supplied PageFlip 2.0.7 reader is hosted locally, including its MIT license. It makes no font/CDN/analytics requests. Controls follow the existing EN/NL/FR site preference; the book itself remains English. Desktop uses spreads and mobile uses a single page. Arrow buttons, keyboard arrows, page deep links and enlargement remain available. Escape closes enlargement and restores focus. A page gallery also works without JavaScript or when the library fails. The order link opens the existing Books order section and does not send an email.

The build explicitly includes the reader HTML and license, and only JPEGs from its page folder. Source ZIP files and installation notes remain outside the public artifact. The older PDF preview remains at its existing URL for previously shared links; current preview buttons use the reader.

Permanent checks cover ZIP-image integrity, asset boundaries, Home click-through, desktop/mobile orientation, flipping, enlargement/focus, final-page limits, missing-library fallback and absence of external requests. Existing book catalogue tests retain publication, order and first-book request coverage. Local load coverage includes the reader, scripts, stylesheet and first/last images. Full release gates remain required before main publication.
