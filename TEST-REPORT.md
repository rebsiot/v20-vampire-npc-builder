# Test report — V20 NPC Builder v0.1.5 (2026-10-15)

**Status: Automated/mock-tested. Live Foundry verification pending.**

## Source and scope

- Edited source: user-supplied `v20-vampire-npc-builder-foundry-0.1.4.zip`.
- Owning component: `03-V20-NPC-BUILDER-FOUNDRY.md` (the numbered handoff was not attached to this development turn; no edits to it are claimed).
- Unchanged character-core `actor.js`; unchanged original `sheet.js`, `fillable.js`, and PDF library.
- Shared blueprint schema/version preserved as `wod20-vampire-npc` / 1. Browser builder not changed.

## Checks executed

- JavaScript parse/syntax checks with Node.js on each non-vendor `.js` source.
- JSON parse on `module.json` and manifest version / ID inspection.
- Browser-like simulated core and portrait UI in headless Chromium with mocked Foundry/Tokenizer 2 APIs, including: no artwork, Foundry image chooser callback, draft repaint after dot change, automatic generation from Actor portrait, editor on created Actor, pre-creation editor applying prototype-token patch and layer flags, missing Tokenizer 2, artwork generation failure, and mobile horizontal overflow.
- Simulated Foundry v14 ApplicationV2/editor lifecycle in headless Chromium: settings registration, no-art creation path, image picker, auto tokenize, closing/reopening draft with portrait path, duplicate-create guard, custom token patch and flags.
- Zip structure and binary comparison against the supplied v0.1.4 sources.

## What was not tested

- **Not confirmed live:** Tokenizer 2 installed in the actual St. Louis Foundry v14 world.
- **Not confirmed live:** Tokenizer 2 output upload path and persistence after real Actor creation.
- **Not confirmed live:** Pop-out effects / masks and placement on a real Scene.
- **Not confirmed live:** Real WoD20 Vampire compendium / sheet rendering or embedded Disciplines and Advantages.
- **Not confirmed live:** Foundry file selection/upload permissions and network storage.

## First live verification

1. Enable Tokenizer 2 and this module in the intended Foundry v14 world.
2. Create one NPC with no portrait, verify the native Vampire sheet and default token.
3. Create one NPC with a portrait, verify `img` and `prototypeToken.texture.src`, and open **Adjust Created Token**.
4. Repeat with **Edit Token in Tokenizer 2** before creation and confirm the saved composition can be reopened.
5. Disable Tokenizer 2 and repeat with a portrait, verifying NPC creation and portrait assignment still succeed.
6. Confirm Disciplines, Backgrounds, merits/flaws, blood pool and export schema are unchanged.

No world, installation, or live server modifications were performed by this build process.
