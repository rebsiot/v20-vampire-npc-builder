# V20 NPC Builder v0.1.8 — candidate test and release evidence

**Owner:** component 03, V20 Foundry NPC Builder
**Verified source baseline:** GitHub v0.1.7, exact main commit `5fc0824de0afb86620a254b408386b135cf7f7d5`.
**Candidate branch:** `fix/npc-derived-totals-audit-0.1.8`, PR #1.
**Installed version:** Unknown; live source ZIP not provided.
**VTT/system:** user confirmed Foundry 14, WoD20 7.3.2 in exported files; do not infer exact installed Builder version.

## Mock/automated
- Derived field audit test: a 3-dot Dexterity with stale total 1 detects total 3, plus soak and initiative; no Actor writes during audit.
- Guarded restore test: identity checks, modified-field conflict checks, unmarked Actor rejection and active-effect safety.
- Existing launcher regression adapted for GM-only secondary repair controls.
- Syntax, manifest, complete installer layout and ZIP archive integrity are verified by nonpublishing PR workflow.
- GitHub Actions successful candidate run: `43645746619`, commit `80b4858c5536202fef8f80087a7afd6cf6fcd6cb` (additional documentation changes require rerun).
- Published software release: **NO**; no new stable manifest or tag has been issued.

## Not tested live
- New PC-type Vampire NPC creation/recalculation with native WoD20 7.3.2 and real Item bonuses.
- Audit/preflight, backup download, repair, restoration, GM/non-GM permissions and multiple browser clients.
- Native attack, soak, health and initiative after repairing Marianne in real Foundry.
- Existing portrait/Tokenizer, custom Abilities and full template/blueprint round trip.

## Installation/rollback
Back up the live world and module directory. Candidate can be installed only after backup and user acceptance of pre-release status. Stop Foundry before manual replacement, restart, hard-refresh, run audit preview. Restore derived fields using the candidate UI and its exported JSON or restore world snapshot; then return to published v0.1.7 if needed. Older code cannot undo existing Actor edits.

## Adjacent owner
Combat Workflow (W17) may optionally classify PC-type Actors tagged with `flags.v20-vampire-npc-builder.npc` as NPCs for GM roll-review, in its own source/owner thread. No Combat Workflow or core WoD20 changes here.
