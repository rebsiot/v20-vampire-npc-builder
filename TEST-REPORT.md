# V20 NPC Builder v0.1.6 — test report (2026-10-15)

**Status: Automated and simulated tests passed; live Foundry v14 Actor Directory verification remains pending.**

## Scope

- Baseline: published Foundry v0.1.5 module source, same module ID and V20 NPC blueprint v1.
- Changed only the GM launcher location in `scripts/main.js` and its button CSS. The older Token Controls launcher is removed.
- **No portrait code change:** The user confirmed that hard-refreshing the Foundry client restored the v0.1.5 portrait selector; therefore `scripts/portrait.js` remains identical to v0.1.5.
- No modifications to `scripts/actor.js`, `scripts/core.js`, `scripts/fillable.js`, `scripts/sheet.js`, `scripts/pdf-lib.min.js`, native Actor construction, or Tokenizer 2 APIs.

## Automated checks actually executed

- Node 22 JavaScript syntax checks for source and bundled `pdf-lib`, module.json JSON parse and ID/version/manifest checks.
- Node simulated Foundry sidebar test (`node tests/launcher-smoke.cjs`): GM-only launcher, WoD20-system restriction, one button on duplicate render, existing native button retained, click launches existing editor without creating an Actor, actor-directory popout path, Token Controls hook absent.
- Headless Chromium via system `/usr/bin/chromium` and Python Playwright, testing duplicate mounts, native button retention and click flow, GM-only/non-WoD20 suppression, and popout rendering in a simulated directory HTML tree.
- Compared the portrait module and the remaining non-UI source to v0.1.5; these are byte-for-byte unchanged.
- ZIP structure and manifest entries verified independently; publication workflow runs Node checks and refuses to overwrite an existing release tag.

## User-provided live signal

- The v0.1.5 portrait panel was absent before hard refresh and **appeared after hard refresh** in the user's live Foundry world. This is an observed v0.1.5 UI result, not a v0.1.6 Actors-sidebar verification.

## Still unverified

- Live Foundry v14 Actors sidebar render, including the specific WoD20 theme/sidebar variations.
- Live portrait upload/Tokenizer 2 generation, editable pop-out masks and native WoD20 Actor results.

## First live v0.1.6 smoke test

1. Back up world/module, update to v0.1.6, enter world as GM and hard refresh the client.
2. Open **Actors** tab; confirm **Create Vampire NPC** is visible directly below native directory controls and the old Token Controls blood-drop action is gone.
3. Click the button; confirm it opens the existing NPC editor, does not instantly create an Actor, and the optional **Portrait & Token** panel remains visible under Identity.
4. If desired, repeat as a player and confirm no button. Only after that check a real NPC/Token flow.

**No live Foundry deployment, Actor import or real-world mutation was performed during development.**

---

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
