# Install, update and rollback

**Module ID:** `v20-vampire-npc-builder` (unchanged from all prior releases)

## From Foundry Setup (recommended)

1. Back up the Foundry world, the existing `Data/modules/v20-vampire-npc-builder` directory, and any separately stored/generated artwork. A module ZIP is **not** a backup of world Actors or portrait files.
2. In Setup > Add-on Modules, use **Update** for an existing manifest installation, or **Install Module** with `https://github.com/rebsiot/v20-vampire-npc-builder/releases/latest/download/module.json`.
3. Enable the module in the desired world's **Manage Modules** dialog. Installed does not always mean enabled.
4. Restart/reload the world and hard-refresh the browser so the new module title becomes visible.
5. As GM, use Actors > **Create Vampire NPC**, and verify the portrait panel under Identity. Confirm the native NPC sheet after creation.

## Manual installation

Stop Foundry before replacing module files. Extract the ZIP **contents** directly into `Data/modules/v20-vampire-npc-builder/` with `module.json` at its root. For the St. Louis Windows/Samba installation, `Z:\Data\modules` is the Data/modules directory; `Z:\` alone is not it. Restart Foundry and refresh clients.

## Rollback

Restore the backed-up v0.1.6 module folder or use the [v0.1.6 tagged release](https://github.com/rebsiot/v20-vampire-npc-builder/releases/tag/v0.1.6), then restart and hard-refresh. This version does not migrate or delete world documents; reverting the module **does not delete new Actors or artwork generated during use**. To reverse subsequent user actions, restore a matching world/artwork snapshot, not just the code.

## Verification status

- Checked: exact v0.1.6 source ZIP/source files, new manifest version/title/link, unchanged Actor-creation and portrait code, static/tests/package structure.
- Not checked live: Foundry v14 module manager updated title, WoD20 native NPC/Discipline round trip, Tokenizer 2 integration. Perform these in the actual server world.
