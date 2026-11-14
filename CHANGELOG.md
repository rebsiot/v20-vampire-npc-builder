# Changelog — V20 Vampire NPC Builder

For complete historical details, consult the versioned [GitHub releases](https://github.com/rebsiot/v20-vampire-npc-builder/releases).

## v0.1.8 — 2026-11-14 (candidate; live verification pending)
- Calculate native WoD20 derived combat fields for new Vampire Builder NPCs after creation; preserve Actor IDs, primary stats, Items and custom content.
- GM-only opt-in audit, per-Actor preview and selection, full JSON backup, explicit saved-backup confirmation, and in-place derived-field repair.
- Selective restoration from backup; stop on changed derived values or mismatched Actor/world identity. No automatic migrations.
- Skip Actors with active effects rather than silently override their effective values.
- Add regression test, nonpublishing candidate CI, rollback/release instructions. Combat Workflow integration remains separately owned.
- No claim of live Foundry installation or full Actor-system compatibility until tested.

## v0.1.7 — 2026-10-18
- Changed the **visible Foundry module title** to **WoD20 — V20 Vampire NPC Builder** for easier identification in Manage Modules. Module ID, Actor data and APIs unchanged.
- Reorganized the public README around installation and first use, with a sanitized UI preview, example NPC and clearer export/import scope.
- Published a version-specific ZIP URL in the release manifest. GitHub stable manifest URL remains unchanged.
- Updated release checks for manifest consistency, module title and preservation of the original package contents.
- No data migration. New title and setup may require restarting the world and hard-refreshing clients.
- Automated tests passed; no live v0.1.7 Foundry verification recorded.

## v0.1.6 — 2026-10-15
- Added the GM-only **Create Vampire NPC** launcher to the Actors sidebar; removed the prior Token Controls launcher.
- No changes to portrait/Tokenizer 2 processing or the NPC blueprint schema.
- Automated UI/launcher tests; live sidebar verification remained pending.

## v0.1.5 — 2026-10-15
- Added optional Actor portrait selection and Tokenizer 2 automatic/manual token creation.
- NPCs without portraits still create normally; existing Actors are not replaced.
- User confirmed a hard refresh resolved a missing portrait section; this is not a full Tokenizer 2 live test.

## v0.1.4 and earlier
- Resizable dot editor, clan-first Disciplines, saved draft picker, custom trait support, native Actor generation, V20 JSON and printable/fillable PDF features.
- Earlier fix for Foundry v14 ApplicationV2 state handling.
