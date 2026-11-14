/* GM-only, explicit, selective repair of existing V20 Builder NPC derived values.
 * No automatic Actor migration. No replacement of Actor, Item, Token or user content.
 */
const MODULE = 'v20-vampire-npc-builder';
const FORMAT = 'v20-npc-derived-repair-backup';
const FORMAT_VERSION = 1;
const SYSTEM_TOTALS = '/systems/worldofdarkness/module/scripts/totals.js';
const DAMAGE_TYPES = ['bashing', 'lethal', 'aggravated'];
const MAX_RESTORE_BYTES = 25 * 1024 * 1024;

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function readPath(obj, path) { return path.split('.').reduce((value, key) => value?.[key], obj); }
function isNumber(value) { return Number.isFinite(value) && typeof value === 'number'; }
function same(a, b) { return Object.is(a, b); }
function requireGM() {
  if (!game.user?.isGM || game.system?.id !== 'worldofdarkness')
    throw new Error('Only a GM in a WoD20 world can review or repair Vampire NPCs.');
}
function eligible(actor) {
  return actor?.type === 'PC' && actor?.flags?.[MODULE]?.npc === true &&
    String(actor.system?.settings?.splat ?? '').toLowerCase() === 'vampire';
}
function hasActiveEffects(actor) {
  return [...(actor.effects ?? [])].some(effect => !effect.disabled && !effect.isSuppressed);
}

// Exported for deterministic fixture tests. Every path is a derived value;
// no saved base ratings, Items, health damage, ownership or flags are changed.
export function derivedDiff(before, calculated) {
  const changes = [];
  const add = (path) => {
    const oldValue = readPath(before, path);
    const newValue = readPath(calculated, path);
    if (!isNumber(oldValue) || !isNumber(newValue)) return;
    if (!same(oldValue, newValue)) changes.push({path, before: oldValue, after: newValue});
  };
  for (const name of Object.keys(before?.system?.attributes ?? {})) {
    // Only an existing, correctly shaped Attribute can be recalculated.
    if (isNumber(readPath(before, `system.attributes.${name}.value`)))
      add(`system.attributes.${name}.total`);
  }
  for (const type of DAMAGE_TYPES) add(`system.soak.${type}`);
  add('system.initiative.base');
  add('system.initiative.total');
  return changes;
}

export async function computeRepairPlan(actor, calculate) {
  requireGM();
  if (!eligible(actor)) throw new Error('Actor is not a marked Vampire Builder NPC.');
  if (hasActiveEffects(actor)) return {actor, changes: [], blocked: 'Active Effects present: review on the native sheet before attempting repair.'};
  const before = actor.toObject();
  // Use the WoD20-owned attribute/soak/initiative calculations including
  // native bonuses, armor, wound penalty and fixed-value effects.
  const work = foundry.utils.deepClone(before);
  const result = await calculate(work);
  if (!result?.system) throw new Error('WoD20 total calculator returned an invalid Actor snapshot.');
  return {actor, changes: derivedDiff(before, result), before, modifiedTime: actor._stats?.modifiedTime ?? null};
}

let calculatePromise;
async function systemCalculator() {
  calculatePromise ??= import(SYSTEM_TOTALS).then(m => {
    if (typeof m.calculateTotals !== 'function') throw new Error('WoD20 calculateTotals export unavailable.');
    return m.calculateTotals;
  }).catch(err => { calculatePromise = undefined; throw err; });
  return calculatePromise;
}
export async function refreshCreatedNPC(actor) {
  requireGM();
  const calculator = await systemCalculator();
  const plan = await computeRepairPlan(actor, calculator);
  if (plan.blocked) throw new Error(plan.blocked);
  if (plan.changes.length) await actor.update(Object.fromEntries(plan.changes.map(x => [x.path, x.after])));
  return plan.changes;
}

function downloadJSON(filename, payload) {
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  try { anchor.click(); }
  finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 20000); }
}
function snapshotEntry(plan) {
  return {actorId: plan.actor.id, actorUuid: plan.actor.uuid, actorName: plan.actor.name,
    sourceModifiedTime: plan.modifiedTime, fullActorJSON: plan.before,
    changes: plan.changes.map(x => ({path:x.path, before:x.before, after:x.after}))};
}
function makeBackup(entries, intent) {
  return {format:FORMAT, schemaVersion:FORMAT_VERSION, intent,
    worldId:game.world.id, systemId:game.system.id, systemVersion:game.system.version,
    moduleId:MODULE, moduleVersion:game.modules.get(MODULE)?.version ?? 'unknown',
    createdAt:new Date().toISOString(), entries};
}
function inputSelected(result, id) { return result?.[`actor_${id}`] !== undefined && result[`actor_${id}`] !== false && result[`actor_${id}`] !== 'false'; }
async function confirmAfterDownload(count, action) {
  const result = await foundry.applications.api.DialogV2.input({
    window:{title:'Confirm saved backup'},
    content:`<p>A full Actor JSON backup was offered for download (${count} Actor${count===1?'':'s'}). Check your browser downloads and retain it somewhere safe before proceeding.</p>
      <label class="v20-repair-ack"><input type="checkbox" name="saved" value="yes"> I have saved the backup file and understand this affects existing Actors.</label>`,
    ok:{label:action}, rejectClose:false, modal:true
  });
  return result?.saved === 'yes' || result?.saved === true;
}
function differences(changes) {
  return `<details><summary>${changes.length} calculated field${changes.length===1?'':'s'} to update</summary><ul>${changes.map(c =>
    `<li><code>${esc(c.path.replace(/^system\./,''))}</code>: ${esc(c.before)} → ${esc(c.after)}</li>`).join('')}</ul></details>`;
}
function showReport(title, message, details=[]) {
  const content = `<p>${esc(message)}</p>${details.length?`<ul>${details.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}`;
  return foundry.applications.api.DialogV2.input({window:{title},content,
    ok:{label:'Close'}, rejectClose:false, modal:false});
}

export async function openRepairAudit() {
  try {
    requireGM();
    const calculate = await systemCalculator();
    const actors = game.actors.filter(eligible);
    if (!actors.length) return showReport('Vampire NPC audit', 'No Actors tagged as created by the Vampire NPC Builder were found. Nothing was changed.');
    const plans = [], blocked = [];
    for (const actor of actors) {
      try {
        const plan = await computeRepairPlan(actor, calculate);
        if (plan.blocked) blocked.push(`${actor.name}: ${plan.blocked}`);
        else if (plan.changes.length) plans.push(plan);
      } catch (error) { blocked.push(`${actor.name}: ${error.message}`); }
    }
    if (!plans.length) return showReport('Vampire NPC audit',
      `Scanned ${actors.length} Builder NPC(s); no safe derived-value repairs proposed. No changes made.`, blocked);
    const rows = plans.map(p => `<div class="v20-repair-row">
      <label><input type="checkbox" name="actor_${esc(p.actor.id)}" value="yes" checked>
      <strong>${esc(p.actor.name)}</strong></label>${differences(p.changes)}</div>`).join('');
    const answer = await foundry.applications.api.DialogV2.input({
      window:{title:`Vampire NPC audit — ${plans.length} flagged`},
      content:`<div class="v20-repair-audit"><p><strong>Preview only.</strong> Scanned ${actors.length} Vampire Builder NPCs; ${plans.length} have stale derived values. Unmarked Actors, health damage, Items, bonuses, portraits, notes and tokens are not replaced.</p>
        ${rows}${blocked.length?`<p class="v20-repair-warning">Not eligible for automatic repair: ${blocked.map(esc).join('; ')}</p>`:''}
        <p class="v20-repair-warning">Select only the Actors to repair. Next you will receive a full JSON backup and must confirm you saved it. No repair happens merely by opening this audit.</p></div>`,
      ok:{label:'Prepare Backup for Selected'}, rejectClose:false, modal:true
    });
    if (!answer) return;
    const chosen = plans.filter(p => inputSelected(answer, p.actor.id));
    if (!chosen.length) return ui.notifications.info('No Actors selected. Nothing changed.');
    const backup = makeBackup(chosen.map(snapshotEntry), 'before-repair');
    downloadJSON(`v20-npc-repair-${game.world.id}-${Date.now()}.json`, backup);
    if (!await confirmAfterDownload(chosen.length, 'Repair Selected Actors'))
      return ui.notifications.warn('Repair canceled. No Actor data changed.');
    let done = 0;
    const errors = [];
    for (const original of chosen) {
      const actor = game.actors.get(original.actor.id);
      if (!actor || !eligible(actor)) { errors.push(`${original.actor.name}: Actor was removed or no longer eligible`); continue; }
      try {
        // Avoid stomping a concurrent player/GM edit; audit state must still match.
        const fresh = await computeRepairPlan(actor, calculate);
        if (fresh.blocked || fresh.modifiedTime !== original.modifiedTime ||
            JSON.stringify(fresh.changes) !== JSON.stringify(original.changes)) {
          errors.push(`${actor.name}: Actor changed since audit; skipped`); continue;
        }
        await actor.update(Object.fromEntries(fresh.changes.map(x => [x.path, x.after])));
        done++;
      } catch (error) { errors.push(`${actor.name}: ${error.message}`); }
    }
    ui.notifications[errors.length?'warn':'info'](`Vampire NPC repair: updated ${done} Actor(s), skipped ${errors.length}.`);
    await showReport('Vampire NPC repair result', `${done} Actor(s) updated. Restore selected derived values using the downloaded backup file if required. No other Actor data was intentionally modified.`, errors);
  } catch (error) { console.error(MODULE+' | Audit failed',error); ui.notifications.error(`Vampire NPC audit failed: ${error.message}`); }
}

function chooseBackup() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type='file'; input.accept='.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (file.size > MAX_RESTORE_BYTES) return reject(new Error('Repair backup exceeds 25 MB.'));
      try { resolve(JSON.parse(await file.text())); } catch(e) { reject(e); }
    },{once:true});
    input.click();
  });
}
function validateBackup(payload) {
  if (payload?.format!==FORMAT || payload?.schemaVersion!==FORMAT_VERSION ||
      payload.worldId!==game.world.id || !Array.isArray(payload.entries))
    throw new Error('Wrong backup format/version or world. No changes made.');
  if (!payload.entries.length || payload.entries.length>500) throw new Error('Backup has invalid entry count.');
  return payload.entries;
}
// A strict whitelist prevents an edited/malicious JSON from writing any field.
function allowedPath(path) {
  return /^system\.attributes\.[a-z][a-z0-9]*\.total$/.test(path) ||
    /^system\.soak\.(bashing|lethal|aggravated)$/.test(path) ||
    /^system\.initiative\.(base|total)$/.test(path);
}
export function restorationDiff(entry, actor) {
  if (!eligible(actor) || actor.id !== entry.actorId || actor.uuid !== entry.actorUuid || !Array.isArray(entry.changes))
    throw new Error('Actor identity or repair record does not match.');
  const restores=[];
  for(const c of entry.changes) {
    if (!allowedPath(c.path) || !isNumber(c.before) || !isNumber(c.after)) throw new Error('Unsafe backup field.');
    const now = readPath(actor, c.path);
    if (!same(now,c.after)) throw new Error(`Field ${c.path} has changed since repair; no automatic restore.`);
    restores.push({path:c.path, before:c.before, after:c.after});
  }
  return restores;
}
export async function openRepairRestore() {
  try {
    requireGM();
    const payload=await chooseBackup(); if(!payload)return;
    const entries=validateBackup(payload);
    const plans=[],blocked=[];
    for(const entry of entries) {
      const actor=game.actors.get(entry.actorId);
      try {
        if(!actor)throw Error('Actor not found');
        if (hasActiveEffects(actor)) throw Error('Active Effects present');
        const changes=restorationDiff(entry,actor);
        if(changes.length)plans.push({actor,changes});
      }catch(error){blocked.push(`${entry.actorName||entry.actorId}: ${error.message}`);}
    }
    if(!plans.length)return showReport('Restore NPC derived values', 'No safely restorable Actor values were found. Nothing changed.',blocked);
    const answer=await foundry.applications.api.DialogV2.input({
      window:{title:'Restore derived values — preview'},
      content:`<div class="v20-repair-audit"><p>Only the derived values changed by the prior repair will be restored. NPC traits, health damage, other Items, token links and later edits stay untouched. Conflicts are skipped.</p>
        ${plans.map(p=>`<div class="v20-repair-row"><label><input type="checkbox" name="actor_${esc(p.actor.id)}" value="yes" checked><strong>${esc(p.actor.name)}</strong></label>${differences(p.changes.map(c=>({path:c.path,before:c.after,after:c.before})))}</div>`).join('')}
        ${blocked.length?`<p class="v20-repair-warning">Skipped: ${blocked.map(esc).join('; ')}</p>`:''}</div>`,
      ok:{label:'Prepare Pre-Restore Backup'},rejectClose:false,modal:true
    });
    if(!answer)return;
    const selected=plans.filter(p=>inputSelected(answer,p.actor.id));
    if(!selected.length)return;
    const safety=makeBackup(selected.map(p=>({actorId:p.actor.id,actorUuid:p.actor.uuid,actorName:p.actor.name,
      fullActorJSON:p.actor.toObject(),changes:p.changes.map(c=>({path:c.path,before:c.after,after:c.before}))})), 'before-restore');
    downloadJSON(`v20-npc-pre-restore-${game.world.id}-${Date.now()}.json`, safety);
    if(!await confirmAfterDownload(selected.length,'Restore Selected Values'))return;
    let done=0;const errors=[];
    for(const p of selected){
      try{
        const actor=game.actors.get(p.actor.id);
        const changes=restorationDiff({actorId:p.actor.id,actorUuid:p.actor.uuid,changes:p.changes},actor);
        await actor.update(Object.fromEntries(changes.map(c=>[c.path,c.before])));
        done++;
      }catch(e){errors.push(`${p.actor.name}: ${e.message}`);}
    }
    ui.notifications[errors.length?'warn':'info'](`Vampire NPC restore: restored ${done}, skipped ${errors.length}.`);
    await showReport('Restore result', `Restored derived values for ${done} Actor(s).`,errors);
  }catch(error){console.error(MODULE+' | Restore failed',error);ui.notifications.error('NPC restore failed: '+error.message);}
}
