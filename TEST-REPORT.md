# V20 NPC Builder v0.1.7 — test and release evidence

**Release scope:** Rename `module.json.title` for more reliable identification in Foundry's Manage Modules. No change to the module ID, Actor creation, JSON schema, Tokenizer 2 implementation, settings or user content. Public documentation/packaging updated under project standard 104.

## Source provenance

- Baseline: [GitHub v0.1.6](https://github.com/rebsiot/v20-vampire-npc-builder/releases/tag/v0.1.6), tag target `d887bbd31fe79fb9d8b1f2a596d320f8cadc7bd6`.
- Locally available source ZIP: `v20-vampire-npc-builder-foundry-0.1.6.zip`; `module.json`, `scripts/main.js` and `styles/builder.css` Git blob hashes matched repository source at the release tag.
- Exact final v0.1.7 GitHub source commit and release tag: *record only after publication is verified*.
- Installed v0.1.7 in a user's live world: **not observed**.

## Automated checks

- Manifest: internal ID unchanged, new visible title, compatible system and version unchanged, stable manifest and pinned matching release ZIP URL.
- Byte-for-byte regression: all previous JS, CSS, template and bundled PDF code from v0.1.6 unchanged.
- Node syntax validation for the module JS.
- Existing launcher mock test: only a GM with WoD20 gets one Actors-sidebar button, no duplicate, and opening it does not create an Actor.
- New manifest smoke test and complete ZIP archive integrity/layout checks.
- Screenshot: sanitized browser-mock preview from prior automated tests, **not** a claim of live Foundry display verification.

## Live testing (pending)

1. Update a test world to v0.1.7; open **Manage Modules** and verify the new title and enabled checkbox.
2. As GM open **Actors → Create Vampire NPC**; verify portrait selection below Identity.
3. Create an NPC with actual Attributes/Abilities/Disciplines, open the native WoD20 Actor sheet, confirm dot data, export its blueprint and import it back without losing ratings.
4. If Tokenizer 2 is enabled, confirm the Actor portrait and Prototype Token can be generated and edited.

## Upgrade / rollback

Back up module folder, Foundry world and artwork separately; update via stable manifest, reload world and hard-refresh. Roll back to the tagged v0.1.6 ZIP and reload; reverting source will not undo any Actors or artwork created afterward. No migrations are included in this release.

No v0.1.7 live test or deployment is claimed by these automated results.
