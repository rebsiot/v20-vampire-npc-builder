# V20 Quick Vampire NPC Builder v0.1.5

**Separate from Mage Charamancer.** No Mage module changes or dependencies.

## Requirements

- Foundry VTT version 14
- Johan Falt's **World of Darkness 20th edition** system, version 7.3.1 or newer (`worldofdarkness`)
- GM access
- Optional: **Tokenizer 2** (`tokenizer-2`), installed and enabled in the same world for automatic tokens and token editing. The legacy Tokenizer (`vtta-tokenizer`) is **not** used by this integration.
- The default *modern Vampire* PC/Splat template installed in the system compendiums

## Installation

1. Shut down the world or disable the module while updating it.
2. Extract the `v20-vampire-npc-builder` folder into Foundry `Data/modules/`.
3. Enable **V20 Quick Vampire NPC Builder** in Manage Modules for the world.
4. Reload the world as a GM.
5. Select the **Actors sidebar** toolbar. Click the blood-drop **Quick Vampire NPC** button.

## Build directly in Foundry

- Fill the NPC's name, Clan, Sect, Generation, concept and other details.
- Click dots to set Attributes, Talents, Skills, Knowledges, Disciplines, Backgrounds, Virtues and trackers. Clicking an already-filled final dot clears it by one.
- The NPC editor has no point budgets, creation steps or XP costs.
- Use `Suggest capacity from Generation` to populate blood capacity/current/per-turn (all editable).
- Optionally select or upload a portrait in **Portrait & Token (Optional)**. If Tokenizer 2 is enabled, the builder automatically generates a token from it. You may instead choose **Edit Token in Tokenizer 2** before creating the NPC to arrange, crop, or make a pop-out token.
- Click **Create Foundry Actor**. This creates a *new* GM-owned PC-type actor using the system's Vampire Splat template (which is the system's recommended shared character sheet). No existing actor is overwritten. No portrait is required.
- Save / Load locally stores NPC drafts in the GM's Foundry client settings. Export JSON for portable backups.

## Browser -> Foundry

1. Open the accompanying `v20-vampire-npc-browser/index.html` in Chrome, Edge, Firefox or another modern browser.
2. Fill the dots, click **Export Foundry JSON**, and retain the `.v20-npc.json` file.
3. Open the Vampire NPC Builder window in Foundry and click **Import JSON**.
4. Select the file, verify the visible traits, then click **Create Foundry Actor**.

The exported JSON is a portable *V20 NPC blueprint*, not a direct Foundry actor export. Do **not** use Mage Charamancer's Import Web Character; its format is different.

## Foundry console API (GM)

- `game.v20VampireNPC.open()` opens the NPC editor.
- `game.v20VampireNPC.importFile()` imports a blueprint file and creates a Vampire actor.
- `game.v20VampireNPC.loadActor(actor)` loads a module-created Vampire back into the editor.
- `game.v20VampireNPC.exportActor(actor)` exports the latest native trait ratings in a blueprint, for NPCs originally created by this module.

## Important implementation notes

- Actor type is `PC` with `system.settings.splat/game/variantsheet = vampire`. This is how current WoD20 implements its unified Vampire character sheet, even for GM NPCs.
- Discipline **ratings** become base Discipline `Power` items. Individual named Discipline powers, rituals and custom mechanics must still be added from normal Foundry Items and compendiums if desired. The builder does **not** automatically generate their effects.
- Backgrounds become native `Feature` Items, Abilities become native `Ability` Items and tracked advantages become `Advantage` Items.
- The original blueprint is stored in the module flags for editing, auditing, or re-exporting.
- Any failed actor creation rolls back the partially created new actor instead of leaving a broken duplicate.
- Generation-based blood values are suggestions, never forced; elders, bloodlines and story exceptions can be assigned manually.
- For best results verify the character sheet, Disciplines and vitae trackers after import. No live Foundry world was available during development; v0.1.0 is a first test release.

## Browser compatibility and backup

The HTML editor runs without a server or online account. Its Save/Load uses browser-local storage; moving machines, clearing storage or opening another browser does not move saved NPCs. Export JSON for portable backups and Foundry import. Use the browser's Print / PDF function to save a printable sheet.

## v0.1.1 fix

- Resolved the Foundry V14 `ApplicationV2.state` getter collision preventing the editor from opening.
- Uses a private NPC draft field and editor-controller field instead, including save/load and reopening an existing editor.


V20 character-sheet PDF export: click V20 Sheet / PDF and use the Print / Save as PDF button on the generated sheet. It follows the V20 character sheet section layout, supports rated non-core traits, and automatically adds an appendix for overflow or NPC notes.
Merits, flaws, weakness, health boxes and current Willpower can be filled directly in the editor.

## v0.1.3 - Fillable PDFs
Select V20 Sheet / PDF, then Download fillable PDF for an interactive AcroForm sheet (traits, trackers, identity and XP). Print (static PDF) remains available. PDF edits are independent of the Foundry actor.

## v0.1.4
Wider responsive editor, compact theme-aware styling, clan-first Discipline display, collapsible additional traits and notes, selectable saved-NPC dialog.

## v0.1.5 — Optional portraits and Tokenizer 2 integration (2026-10-15)

The Foundry builder now has a **Portrait & Token (Optional)** section immediately below Identity. This feature does **not** alter the browser companion or its JSON schema.

1. **Without artwork:** leave the portrait blank and create the NPC as before. Foundry's normal default Actor and Prototype Token images remain.
2. **With artwork:** click **Choose / Upload Portrait** to open Foundry v14's image picker (including its upload controls). The chosen image becomes the Actor portrait. With Tokenizer 2 active, the module invokes its documented `tokenize(actor, { useActorImg: true })` API after successful Actor creation to produce and assign the Prototype Token.
3. **Optional pre-creation edits:** choose **Edit Token in Tokenizer 2** before creating the Actor. The standalone editor can center/zoom the image, adjust a frame, and prepare pop-out effects. On Save, its token patch and layer stack are attached to the newly created Actor instead of running automatic generation again. Cancel leaves existing artwork choices intact.
4. **After creation:** **Adjust Created Token** opens Tokenizer 2 on the newly created Actor so the GM can refine its frame and image. Existing Actors can also be edited using Tokenizer 2 from their Actor sheets. The adjustment button is linked only to the current, unchanged NPC draft.
5. **Without Tokenizer 2:** the Actor and optional portrait are still created. The new token is not generated; the module displays a warning. If artwork upload/tokenization fails, the already-created Vampire NPC is not deleted.

**Persistence and compatibility:** The selected portrait path for an unsaved *editor draft* is retained in a separate GM client setting (`draftPortrait`) when the window closes. Starting, importing, duplicating, or loading another blueprint clears the in-progress artwork selection, avoiding accidental portrait reuse. Saved NPC blueprints, exported `.v20-npc.json` files, and native Vampire system data remain unchanged and do **not** embed image files or Tokenizer 2 layer stacks. Keep Foundry artwork directories in your server backups. Tokenizer 2 stores its own generated files in the locations configured for that module.

**No migration or overwrites:** This release creates new Actors only, just like v0.1.4. It does not retokenize previously created Actors or update existing placed Scene Tokens. Tokenizer 2 is a *soft* integration: the NPC builder itself does not require Tokenizer 2 to be enabled.

### Upgrade and rollback

1. Back up `Z:\Data\modules\v20-vampire-npc-builder` and, for a full safety snapshot, the relevant Foundry world data and portrait/token asset folders.
2. Stop Foundry, replace the complete `Z:\Data\modules\v20-vampire-npc-builder` folder with this release, restart Foundry, and enable/update **Tokenizer 2** in the intended world if you want automatic tokens.
3. Hard-refresh the Foundry client. Open the **Actors sidebar** toolbar and use **Quick Vampire NPC**.
4. For rollback, stop Foundry and restore the backup of v0.1.4 or its complete ZIP. Actor creations and uploaded/generated images are world/data changes, **not** automatically reverted by restoring the code. No schema migration is introduced by v0.1.5.

### Recommended live smoke test

In Foundry v14 with the installed WoD20 system: create an NPC with no portrait (default art); create a second NPC with a portrait and confirm the Actor portrait and Prototype Token; edit that token in Tokenizer 2; then create one with the module disabled and verify the Actor remains usable. Verify Clan, Disciplines, Abilities, Backgrounds and vitae trackers still populate on the native Vampire sheet.

### Developer references

- Tokenizer 2 integration API: https://docs.ddb.mrprimate.co.uk/docs/tokenizer-2/api
- Foundry v14 FilePicker: https://foundryvtt.com/api/classes/foundry.applications.apps.FilePicker.html
- Test status: see `TEST-REPORT.md`. No claim of live Foundry verification is made.
