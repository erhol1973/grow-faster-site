## CMS integration acceptance, 9 November 2026

Main a8fae016 and CMS head 00559b7 are integrated without dropping the 44-second playback-to-ended/no-subtitle assertions or the Coherence immediate-scroll regression. CMS browser coverage now explicitly dismisses and accepts publication confirmation, rejects publication before preview, and checks that filtering preserves every NL/FR text field including hidden edits. The public website supports NL/FR only; no English editor is introduced. Existing thresholds and retries are unchanged.

No release is authorised by this integration. Live Supabase publication tests must not use the shared production database. The prior accidental Books publication was withdrawn with exact identity/timestamp and unchanged draft/history checks; do not repeat that deletion. Real isolated Auth/Storage acceptance remains a release blocker.
CodeQL integration review: preview language URLs now use fixed NL/FR suffixes rather than concatenating a DOM-controlled value. A browser regression injects an unsupported selector value and verifies the NL fallback; no scanner rule is suppressed.
