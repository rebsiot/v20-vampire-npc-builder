# V20 NPC Builder v0.1.8 — Derived combat totals and existing NPC repair (candidate)

This candidate addresses Vampire NPCs whose saved Attribute ratings are correct but whose derived values remain at default values. Example: Dexterity value 3, calculated total 1 caused Bite to roll one die when Brawl was untrained 0.

## What's changed
- After creating a Builder NPC, calculate native WoD20 derived Attribute totals, soak and initiative, without replacing the Actor or its Items.
- As GM, open the Actors sidebar and select **Audit existing Vampire NPC combat stats**. Preview eligible Builder NPC differences, optionally select particular Actors, download each selected Actor's complete JSON in one backup file, and explicitly confirm before writing only changed derived fields.
- **Restore derived stats from a repair backup** shows the reverse changes before applying them. Restoration rejects mismatched Actor IDs, worlds or modified derived fields; never recreates an Actor from a blueprint.
- Existing health damage, traits, Backgrounds, Disciplines, Notes, portraits, token links, hotbars and completed combat rolls are not intentionally modified. Unmarked Actors and Actors with active effects are skipped.

## Before upgrading or repairing
1. Back up the Foundry world data and `Data/modules/v20-vampire-npc-builder`.
2. Install the complete release module folder, restart Foundry, enable it in the world and **Shift+F5** on GM/player clients.
3. Audit first. Read each proposed field change. Save the exported JSON backup before confirming.
4. Check Marianne's calculated Dexterity and Bite dice after repair: Dexterity value 3 plus Brawl 0 should use three attack dice when no other penalties apply.

## Limits
- This repair is opt-in and restricted to Actors tagged `flags.v20-vampire-npc-builder.npc=true`, with native type PC and Vampire splat. Other imported or hand-built Actors are not modified.
- The correction uses native WoD20 calculation code for the currently installed system. Native system API compatibility must be checked in Foundry v14 before calling this live-safe.
- It does **not** rewind earlier ChatMessages, dice results, wounds or completed combat. Retain the world snapshot for a full undo of gameplay history.
- The module does not rewrite Combat Workflow; a separate integration test is required for GM review of PC-type NPC flags.
- Automated mock testing is not a live Foundry test.

## Rollback
Restore the full previous Builder module ZIP (v0.1.7) with Foundry stopped. For already repaired Actor derived fields, use the saved repair-backup restore UI while on this candidate version, or restore the saved world snapshot. Reverting module code alone does not reverse Actor updates.

**Source candidate:** base GitHub commit `5fc0824de0afb86620a254b408386b135cf7f7d5`; patch branch `fix/npc-derived-totals-audit-0.1.8`. No published release or live world deployment is implied by this file.
