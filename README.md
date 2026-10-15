# V20 Quick Vampire NPC Builder

An **unofficial, AI-assisted** Foundry VTT module for quickly creating Vampire: The Masquerade 20th Anniversary Edition NPCs on native World of Darkness 20th (WoD20) Actors. Built for a private St. Louis campaign.

> **Project and release warning:** This software is experimental and supplied **as-is, without warranty, guaranteed functionality, or support commitment**. This is a fan-made utility, **not an official World of Darkness, Vampire: The Masquerade, Foundry VTT, WoD20, or Tokenizer 2 product**. See [License](LICENSE.md) and [Third-Party Content and Rights](THIRD-PARTY-CONTENT.md) before using or redistributing anything.

## Publication and licensing

- **Proprietary, personal non-commercial use only.** This is **not open-source software**. The original software may be downloaded and used for a personal, non-commercial Foundry game under [LICENSE.md](LICENSE.md). Republishing, distributing copies or modified builds, commercial use, or bundling it with another product requires the copyright holder's prior written permission.
- A **public GitHub repository** permits viewing and on-platform forking under GitHub's terms; it does not grant broader redistribution rights. Separate third-party licenses still apply.
- **AI-assisted development:** substantial portions of this utility were developed with AI assistance and reviewed/tested with automated tools. Do not interpret repository publication or mock tests as a guarantee of compatibility.
- **No licensed game content, portraits, tokens, or paid assets are provided.** You must independently obtain Foundry, the compatible WoD20 system, and any artwork or third-party modules you choose to use.
- The World of Darkness and Vampire intellectual property belongs to its rights holders. See [Third-Party Content and Rights](THIRD-PARTY-CONTENT.md), including the official Dark Pack policy. Nothing here implies endorsement or a sublicense to game content.

## Requirements

- Foundry Virtual Tabletop **v14**.
- **World of Darkness 20th Edition** system (`worldofdarkness`) **v7.3.1 or later**, including the system's modern Vampire PC/Splat template; live compatibility beyond the tested/mocked paths is not guaranteed.
- GM permissions to create Actors and upload artwork.
- **Optional:** MrPrimate's **Tokenizer 2** (`tokenizer-2`) enabled in the same world. The legacy Tokenizer is not used by the v0.1.5 integration.

## NPC building

- Fill in an NPC's identity, clan, sect, generation, Attributes, Abilities, Backgrounds, Virtues, Disciplines, and other traits using dot controls.
- Create a **new** WoD20 Actor from the configured Vampire template. The builder does not overwrite an existing Actor.
- A portrait is **optional**. With artwork selected, it can assign the Actor portrait and invoke Tokenizer 2 to create a Prototype Token. Tokenizer 2's editor can be used for centering, framing and pop-out effects. If Tokenizer 2 is absent or tokenization fails, NPC creation can continue.
- Supports the module's V20 NPC blueprint JSON workflow, print/PDF output, and draft save/load. The browser companion is a separate application; its saves are browser-local, not server backups.

## Safety and limitations

**Back up your Foundry world and the existing module before upgrading.** Back up artwork and generated token files separately: reverting the module's code does not undo new Actors, uploaded portraits or generated tokens.

- Portrait selection is not mandatory; token editing is optional. Tokens already placed on Scenes are not automatically updated when an Actor's Prototype Token changes.
- Native Discipline **ratings** are populated; named Discipline powers, rituals and effects may still require normal Foundry Item setup.
- The interchange format is a **V20 NPC blueprint**, not a native Actor export or a Mage Charamancer file. Do not publish your private NPC/Actor exports, campaign notes or players' data in issues, pull requests or releases.
- Keep any files and images created from third-party artwork private unless the rights holder authorizes redistribution.
- Verify the resulting Actor sheet, Clan, Disciplines, blood pool, portraits, and tokens in a test world before relying on them in a campaign.

## Current repository and testing status

**Local build documented: v0.1.5 (2026-10-15).** Its JavaScript/JSON and mocked Foundry v14/Tokenizer 2 workflows passed automated checks, but **live Foundry and Tokenizer 2 verification is still pending**. In particular, image upload/storage, Tokenizer layers/pop-out, and actual WoD20 compendium integration have not been confirmed in the campaign world.

**GitHub release v0.1.5 is published.** The repository contains the complete module source and an automated release workflow. The tagged release includes a Foundry-installable ZIP and a manifest, but live Foundry/Tokenizer 2 verification remains pending.

**Install from Foundry:** Open **Setup → Add-on Modules → Install Module**, paste the following into **Manifest URL**, then click **Install**:

`https://github.com/rebsiot/v20-vampire-npc-builder/releases/latest/download/module.json`

The versioned [v0.1.5 release](https://github.com/rebsiot/v20-vampire-npc-builder/releases/tag/v0.1.5) also contains `v20-vampire-npc-builder.zip`. Enable this module in the world, and enable Tokenizer 2 if you want optional automatic tokens. Back up your world, module folder and artwork first. This GitHub distribution check does not constitute a live Foundry installation test.

**Automatic releases:** Changes to module source or the packaging workflow trigger validation and a new GitHub Release only when `module.json` has an unused version number. An existing release tag is not overwritten.

## Third parties, support and rights

- [Software license: personal, non-commercial, no redistribution](LICENSE.md)
- [Third-party rights, World of Darkness/Dark Pack, Tokenizer 2 and bundled libraries](THIRD-PARTY-CONTENT.md)
- [Foundry VTT license and module-development documentation](https://foundryvtt.com/article/license/)
- [World of Darkness Dark Pack Agreement](https://www.paradoxinteractive.com/games/world-of-darkness/community/dark-pack-agreement)

**No formal support or response-time commitment.** Issues and suggestions may be reviewed at the maintainer's discretion. Do not attach copyrighted game books, private campaign documents, credentials, or unlicensed artwork.

Copyright (c) 2026 rebsiot. All rights reserved in the original software, subject to the separately licensed third-party components and applicable law.
