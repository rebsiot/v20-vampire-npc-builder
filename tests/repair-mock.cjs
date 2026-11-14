const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const source = fs.readFileSync(path.join(__dirname, '../scripts/repair.js'), 'utf8');
  const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  global.game = {user:{isGM:true},system:{id:'worldofdarkness',version:'7.3.2'},world:{id:'m20-stl-campaign'},modules:new Map()};
  global.foundry = {utils:{deepClone:structuredClone}};
  const system={
    settings:{splat:'vampire'},
    attributes:{dexterity:{value:3,bonus:0,total:1},strength:{value:3,bonus:0,total:1},stamina:{value:4,bonus:0,total:1},wits:{value:4,bonus:0,total:1}},
    soak:{bashing:0,lethal:0,aggravated:0},initiative:{base:0,total:0},
    health:{damage:{bashing:2,lethal:1,aggravated:0}}
  };
  const copy=structuredClone(system);
  const actor={id:'FST1QtlKOFIViDk4',uuid:'Actor.FST1QtlKOFIViDk4',name:'Sanitized vampire NPC',type:'PC',
    flags:{'v20-vampire-npc-builder':{npc:true}},system,items:[],effects:[],_stats:{modifiedTime:5},
    toObject(){return {_id:this.id,type:this.type,name:this.name,flags:this.flags,system:structuredClone(this.system),items:[],effects:[]}}};
  const calc=async work=>{for(const entry of Object.values(work.system.attributes))entry.total=entry.value+entry.bonus;
    work.system.soak.bashing=4;work.system.soak.lethal=4;work.system.initiative.base=7;work.system.initiative.total=7;
    return work;};
  const plan=await mod.computeRepairPlan(actor,calc);
  assert.equal(plan.changes.length,8); // 4 attributes, 2 soak, 2 initiative
  assert.equal(plan.changes.find(x=>x.path==='system.attributes.dexterity.total').after,3);
  assert.equal(plan.changes.find(x=>x.path==='system.soak.bashing').after,4);
  assert.equal(actor.system.attributes.dexterity.total,1,'audit must not mutate Actor');
  assert.equal(actor.system.health.damage.bashing,2,'existing wounds must remain untouched');
  const patched=structuredClone(actor.toObject());
  for(const c of plan.changes){let obj=patched;const keys=c.path.split('.');for(const k of keys.slice(0,-1))obj=obj[k];obj[keys.at(-1)]=c.after;}
  const live={...actor,system:patched.system};
  const restoring=mod.restorationDiff({actorId:actor.id,actorUuid:actor.uuid,changes:plan.changes},live);
  assert.equal(restoring.length,plan.changes.length);
  live.system.attributes.dexterity.total=9;
  assert.throws(()=>mod.restorationDiff({actorId:actor.id,actorUuid:actor.uuid,changes:plan.changes},live),/changed since repair/);
  assert.deepEqual(system,copy,'original Actor state preserved');
  await assert.rejects(mod.computeRepairPlan({...actor,flags:{}},calc),/not a marked/);
  const effectPlan=await mod.computeRepairPlan({...actor,effects:[{disabled:false,isSuppressed:false}]},calc);
  assert.match(effectPlan.blocked,/Active Effects/);
  console.log('V20 NPC derived repair mock tests passed; no Actors updated');
})().catch(e=>{console.error(e);process.exitCode=1;});
