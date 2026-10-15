/* Foundry V14 / World of Darkness 20th 7.3.1 integration. */
const ID='v20-vampire-npc-builder';
const core=()=>globalThis.V20NPC;
const values=x=>!x?[]:Array.isArray(x)?x:Object.values(x);
const norm=x=>String(x??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const clone=x=>foundry.utils.deepClone(x);
const itemFor=(actor,type,id)=>actor.items.find(i=>i.type===type&&norm(i.system?.id)===norm(id));
function packItems(){return Array.from(game.packs).filter(p=>p.documentName==='Item'&&(p.collection?.startsWith('worldofdarkness.')||p.metadata?.packageName==='worldofdarkness'));}
async function vampireTemplate(){
 const choices=[];
 for(const pack of packItems()){
  let index;try{index=await pack.getIndex({fields:['type','system.settings.id','system.settings.game','system.settings.variant','system.settings.era','system.settings.variantsheet']});}catch{continue;}
  for(const it of index){if(it.type!=='Splat')continue;
   const settings={id:foundry.utils.getProperty(it,'system.settings.id'),game:foundry.utils.getProperty(it,'system.settings.game'),variantsheet:foundry.utils.getProperty(it,'system.settings.variantsheet')};
   const str=Object.values(settings).map(norm),name=norm(it.name);
   if(!str.includes('vampire')&&name!=='vampire')continue;
   let doc;try{doc=await pack.getDocument(it._id);}catch{continue;}if(!doc)continue;
   const adv=values(doc.system?.advantages).map(i=>norm(i.system?.id));
   let score=(norm(doc.system?.settings?.id)==='vampire'?100:0)+(norm(doc.system?.settings?.game)==='vampire'?100:0)+(norm(doc.system?.settings?.variantsheet)==='vampire'?100:0);
   if(adv.includes('willpower'))score+=50;if(adv.includes('bloodpool'))score+=80;if(adv.includes('path'))score+=80;if(adv.includes('courage'))score+=20;
   const era=String(doc.system?.settings?.era??'').toLowerCase();if(era.includes('modern'))score+=90;if(name==='vampire')score+=30;
   if(era.includes('dark')||era.includes('victorian'))score-=90;
   choices.push({doc,score,adv});
  }
 }
 choices.sort((a,b)=>b.score-a.score);
 if(!choices.length||choices[0].score<220)throw Error('Could not locate the standard Vampire PC template in the worldofdarkness compendiums. Install the V20 system content and try again.');
 return choices[0].doc;
}
function bioPath(actor,aliases){const fields=actor.system?.bio?.splatfields||{};const needles=aliases.map(norm);for(const [key,obj] of Object.entries(fields)){const id=norm(key),label=norm(obj?.label),localized=norm(game.i18n.localize(obj?.label||''));if(needles.some(n=>id.includes(n)||label.includes(n)||localized.includes(n)))return `system.bio.splatfields.${key}.value`;}return null;}
function itemSettings(){return {iscreated:true,isupdated:false,isvisible:true,isremovable:true,version:game.system.version};}
async function createMissingAbility(actor,name,category,rating){const slug=core().slug(name);const id='v20npc-'+slug;const old=itemFor(actor,'Ability',slug)||itemFor(actor,'Ability',id);if(old)return old;
 const [created]=await actor.createEmbeddedDocuments('Item',[{name,type:'Ability',system:{id,type:'wod.abilities.'+category,label:name,value:rating,total:rating,bonus:0,max:10,speciality:'',settings:itemSettings()},flags:{[ID]:{customAbility:true}}}]);return created;
}
function allAbilityCatalog(){const catalog={};for(const [type,names] of Object.entries(core().ABILITIES))for(const name of names)catalog[core().slug(name)]={name,category:type.toLowerCase().slice(0,-1)};return catalog;}
async function installAbilities(actor,s){
 const catalog=allAbilityCatalog(),updates=[];
 for(const [key,value] of Object.entries(s.abilities)){
  const r=Number(value);if(!r)continue;
  const aliases={crafts:'craft',animalhandling:'animalken',animalempathy:'animalken'};
  let item=actor.items.find(i=>i.type==='Ability'&&(norm(i.system?.id)===norm(key)||norm(i.name)===norm(key)||norm(i.system?.id)===aliases[key]));
  const category=catalog[key]?.category||Object.entries(s.custom).find(([k,v])=>['talent','skill','knowledge'].includes(k)&&v.some(n=>core().slug(n)===key))?.[0]||'knowledge';
  if(!item){const name=catalog[key]?.name||s.custom[category]?.find(n=>core().slug(n)===key)||key;item=await createMissingAbility(actor,name,category,r);}
  if(!item)throw Error('Could not install Ability '+key);
  updates.push({_id:item.id,'system.value':r,'system.max':Math.max(5,r),'system.settings.isvisible':true});
 }
 if(updates.length)await actor.updateEmbeddedDocuments('Item',updates);
 for(const [key,r] of Object.entries(s.abilities))if(r>0&&!actor.items.some(i=>i.type==='Ability'&&(norm(i.system?.id)===norm(key)||norm(i.name)===norm(key)||(key==='crafts'&&norm(i.system?.id)==='craft'))&&Number(i.system?.value)===r))throw Error('Ability import did not verify: '+key);
}
async function installFeatures(actor,s){
 const docs=[];
 for(const [key,rating] of Object.entries(s.backgrounds)){if(!rating)continue;
  const name=[...core().BACKGROUNDS,...s.custom.background].find(n=>core().slug(n)===key)||key;
  docs.push({name,type:'Feature',system:{type:'wod.types.background',level:rating,value:rating,max:Math.max(5,rating),placement:'feature',description:'',settings:itemSettings()},flags:{[ID]:{npcBackground:true}}});}
 if(docs.length)await actor.createEmbeddedDocuments('Item',docs);
}
const powerCache=new Map();
async function indexSystemPower(name){
 if(powerCache.has(name))return powerCache.get(name);
 for(const pack of packItems().sort((a,b)=>/vampire|discipline/i.test(b.collection||'')-/vampire|discipline/i.test(a.collection||''))){
  let entries;try{entries=await pack.getIndex({fields:['type','system.type','system.game']});}catch{continue;}
  const target=entries.find(e=>e.type==='Power'&&norm(e.name)===norm(name)&&/discipline/i.test(String(foundry.utils.getProperty(e,'system.type')||'')));
  if(target){try{const doc=await pack.getDocument(target._id);powerCache.set(name,doc);return doc;}catch{continue;}}
 }
 powerCache.set(name,null);return null;
}
async function installDisciplines(actor,s){
 const created=[];
 for(const [key,rating] of Object.entries(s.disciplines)){
  if(!rating)continue;
  const name=[...core().DISCIPLINES,...s.custom.discipline].find(n=>core().slug(n)===key)||key;
  let existing=actor.items.find(i=>i.type==='Power'&&norm(i.name)===norm(name));
  if(!existing){const compendium=await indexSystemPower(name);let data=compendium?.toObject()||{name,type:'Power',system:{game:'vampire',type:'wod.types.discipline',settings:itemSettings()}};
   delete data._id;delete data.folder;delete data._stats;data.name=name;data.type='Power';data.system??={};data.system.game='vampire';data.system.type=data.system.type||'wod.types.discipline';data.system.settings={...data.system.settings,...itemSettings()};
   data.flags={...data.flags,[ID]:{npcDiscipline:true,source:compendium?.uuid||null}};
   const [added]=await actor.createEmbeddedDocuments('Item',[data]);existing=added;
  }
  if(!existing)throw Error('Failed to install Discipline: '+name);
  await actor.updateEmbeddedDocuments('Item',[{_id:existing.id,'system.level':rating,'system.value':rating,'system.max':Math.max(5,rating),'system.settings.isvisible':true}]);
  created.push(name);
 }
 for(const name of created){const selected=s.disciplines[core().slug(name)];const found=actor.items.find(i=>i.type==='Power'&&norm(i.name)===norm(name));if(!found||Number(found.system?.level??found.system?.value)!==selected)throw Error('Discipline rating did not verify: '+name);}
}
async function installAdvantages(actor,s,splat){
 const updates=[];
 const setup={willpower:{permanent:s.traits.willpower,temporary:s.traits.willpowerCurrent,roll:s.traits.willpower},path:{permanent:s.traits.path,value:s.traits.path,roll:s.traits.path,custom:s.identity.pathName},bloodpool:{temporary:s.traits.bloodCurrent,max:s.traits.bloodMax,perturn:s.traits.bloodPerTurn},conscience:{permanent:s.virtues.conscience,roll:s.virtues.conscience},selfcontrol:{permanent:s.virtues.selfcontrol,roll:s.virtues.selfcontrol},courage:{permanent:s.virtues.courage,roll:s.virtues.courage}};
 for(const [id,properties] of Object.entries(setup)){
  let item=itemFor(actor,'Advantage',id);
  if(!item){const source=values(splat.system?.advantages).find(i=>norm(i.system?.id)===id);const data=source?clone(source):{name:id,type:'Advantage',system:{id,settings:itemSettings()}};
   delete data._id;delete data.folder;delete data._stats;data.type='Advantage';data.system??={};data.system.id=id;data.system.settings={...data.system.settings,...itemSettings()};
   const [added]=await actor.createEmbeddedDocuments('Item',[data]);item=added;
  }
  if(!item)throw Error('Could not install V20 Advantage: '+id);
  const update={_id:item.id};for(const [k,v] of Object.entries(properties))update['system.'+k]=v;updates.push(update);
 }
 if(updates.length)await actor.updateEmbeddedDocuments('Item',updates);
 for(const id of Object.keys(setup))if(!itemFor(actor,'Advantage',id))throw Error('Missing V20 Advantage '+id);
}
export async function createVampireNPC(data){
 if(!game.user.isGM)throw Error('Only a GM can create Vampire NPCs.');
 if(game.system.id!=='worldofdarkness')throw Error('This module requires the worldofdarkness system.');
 const s=core().valid(data),splat=await vampireTemplate();let actor;
 try{
  actor=await Actor.create({name:s.identity.name.trim(),type:'PC',ownership:{default:0,[game.user.id]:3},flags:{[ID]:{npc:true,sourceVersion:1,blueprint:clone(s)}}});
  if(!actor)throw Error('Actor creation failed.');
  const {default:DropHelper}=await import('/systems/worldofdarkness/module/scripts/drop-helpers.js');
  await DropHelper.DropSplatToActor(actor,splat);
  const updates={name:s.identity.name.trim(),'system.bio.name':s.identity.name.trim(),'system.bio.concept':s.identity.concept,'system.bio.nature':s.identity.nature,'system.bio.demeanor':s.identity.demeanor,'system.bio.chronicle':s.identity.chronicle,'system.settings.splat':'vampire','system.settings.game':'vampire','system.settings.variantsheet':'vampire','system.settings.iscreated':true,'system.settings.isupdated':false,'system.settings.hasbloodpool':true,'system.settings.haswillpower':true,'system.settings.hasvirtue':true,'system.settings.haspath':true};
  for(const [key,val] of Object.entries(s.attributes))if(actor.system?.attributes?.[key]){updates[`system.attributes.${key}.value`]=val;updates[`system.attributes.${key}.max`]=Math.max(5,val);}
  for(const [aliases,value] of [[['clan'],s.identity.clan],[['sect'],s.identity.sect],[['generation'],s.identity.generation],[['sire'],s.identity.sire],[['path'],s.identity.pathName]]){const p=bioPath(actor,aliases);if(p)updates[p]=value;}
  await actor.update(updates);
  await installAbilities(actor,s);
  await installAdvantages(actor,s,splat);
  await installDisciplines(actor,s);
  await installFeatures(actor,s);
  if(String(actor.system?.settings?.splat).toLowerCase()!=='vampire'||String(actor.system?.settings?.game).toLowerCase()!=='vampire')throw Error('System did not activate the Vampire sheet.');
  const missing=Object.entries(s.disciplines).filter(([k,n])=>n>0&&!actor.items.some(i=>i.type==='Power'&&norm(i.name)===norm(k)));
  if(missing.length)throw Error('Disciplines did not survive creation: '+missing.map(([k])=>k).join(', '));
  // Preserve exact GM intent where the system has no matching visible field.
  await actor.setFlag(ID,'npc',true);await actor.setFlag(ID,'blueprint',clone(s));
  actor.sheet?.render(true);
  return actor;
 }catch(error){if(actor){try{await actor.delete();}catch(e){console.error(ID+' | Failed to delete incomplete actor',e);}}throw error;}
}
export function blueprintFromActor(actor){
 if(!actor||actor.type!=='PC'||String(actor.system?.settings?.game).toLowerCase()!=='vampire')throw Error('Select a PC-type Vampire actor.');
 const saved=actor.getFlag(ID,'blueprint');
 if(!saved)throw Error('This Vampire was not created with NPC Builder. Export its sheet using Foundry instead.');
 const s=core().valid({...saved,identity:{...saved.identity,name:actor.name}});
 // Read current ratings from the native actor, not only the creation-time snapshot.
 for(const k of Object.keys(s.attributes))if(actor.system?.attributes?.[k])s.attributes[k]=Number(actor.system.attributes[k].value)||1;
 for(const item of actor.items){
  const name=norm(item.name),rated=Number(item.system?.value)||0;
  if(item.type==='Ability'&&(Object.hasOwn(s.abilities,name)||Object.hasOwn(s.abilities,norm(item.system?.id))||rated>0))s.abilities[name]=rated;
  if(item.type==='Power'&&(Object.hasOwn(s.disciplines,name)||item.flags?.[ID]?.npcDiscipline))s.disciplines[name]=Number(item.system?.level??item.system?.value)||0;
  if(item.type==='Feature'&&item.system?.type==='wod.types.background'&&(Object.hasOwn(s.backgrounds,name)||item.flags?.[ID]?.npcBackground))s.backgrounds[name]=Number(item.system.level??item.system.value)||0;
  if(item.type!=='Advantage')continue;
  const value=Number(item.system?.permanent??item.system?.value)||0,id=norm(item.system?.id);
  if(id==='willpower'){s.traits.willpower=value;s.traits.willpowerCurrent=Number(item.system?.temporary??value);}
  if(id==='path')s.traits.path=value;
  if(id==='bloodpool'){s.traits.bloodMax=Number(item.system.max)||s.traits.bloodMax;s.traits.bloodCurrent=Number(item.system.temporary)||0;s.traits.bloodPerTurn=Number(item.system.perturn)||s.traits.bloodPerTurn;}
  if(Object.hasOwn(s.virtues,id))s.virtues[id]=value;
 }
 return core().valid(s);
}
