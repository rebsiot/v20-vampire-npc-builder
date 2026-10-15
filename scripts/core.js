/* Shared, browser-safe V20 NPC state, validation and HTML editor. */
(function(){
'use strict';
const SCHEMA='wod20-vampire-npc', VERSION=1;
const ATTRIBUTES={Physical:['Strength','Dexterity','Stamina'],Social:['Charisma','Manipulation','Appearance'],Mental:['Perception','Intelligence','Wits']};
const ABILITIES={Talents:['Alertness','Athletics','Awareness','Brawl','Empathy','Expression','Intimidation','Leadership','Streetwise','Subterfuge'],Skills:['Animal Ken','Crafts','Drive','Etiquette','Firearms','Larceny','Melee','Performance','Stealth','Survival'],Knowledges:['Academics','Computer','Finance','Investigation','Law','Medicine','Occult','Politics','Science','Technology']};
const CLANS={Brujah:['Celerity','Potence','Presence'],Gangrel:['Animalism','Fortitude','Protean'],Malkavian:['Auspex','Dementation','Obfuscate'],Nosferatu:['Animalism','Obfuscate','Potence'],Toreador:['Auspex','Celerity','Presence'],Tremere:['Auspex','Dominate','Thaumaturgy'],Ventrue:['Dominate','Fortitude','Presence'],Assamite:['Celerity','Obfuscate','Quietus'],"Followers of Set":['Obfuscate','Presence','Serpentis'],Giovanni:['Dominate','Necromancy','Potence'],Lasombra:['Dominate','Obtenebration','Potence'],Ravnos:['Animalism','Chimerstry','Fortitude'],Tzimisce:['Animalism','Auspex','Vicissitude'],Caitiff:[],Other:[]};
const DISCIPLINES=['Animalism','Auspex','Celerity','Chimerstry','Dementation','Dominate','Fortitude','Necromancy','Obfuscate','Obtenebration','Potence','Presence','Protean','Quietus','Serpentis','Thaumaturgy','Vicissitude','Temporis','Melpominee','Valeren','Daimoinon','Mytherceria','Obeah','Thanatosis'];
const BACKGROUNDS=['Allies','Alternate Identity','Contacts','Domain','Fame','Generation','Herd','Influence','Mentor','Resources','Retainers','Status'];
const VIRTUES=['Conscience','Self-Control','Courage'];
const slug=s=>String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'').trim();
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,lo=0,hi=10)=>Math.min(hi,Math.max(lo,Number.isFinite(Number(v))?Math.trunc(Number(v)):lo));
const suggestedBlood=g=>{const gen=clamp(g,3,16);if(gen>=10)return [10,1];return ({9:[12,2],8:[15,3],7:[20,4],6:[30,6],5:[40,8],4:[50,10],3:[100,10]})[gen]||[10,1];};
function blank(){return {schema:SCHEMA,version:VERSION,identity:{name:'',clan:'Ventrue',sect:'Camarilla',generation:13,sire:'',concept:'',nature:'',demeanor:'',chronicle:'',pathName:'Humanity'},attributes:Object.fromEntries(Object.values(ATTRIBUTES).flat().map(n=>[slug(n),1])),abilities:{},disciplines:{},backgrounds:{},virtues:{conscience:3,selfcontrol:3,courage:3},traits:{willpower:5,willpowerCurrent:5,healthDamage:0,experience:0,path:7,bloodMax:10,bloodCurrent:10,bloodPerTurn:1},notes:'',merits:'',flaws:'',weakness:'',custom:{talent:[],skill:[],knowledge:[],discipline:[],background:[]}};}
function valid(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schema!==SCHEMA||raw.version!==VERSION)throw Error('Not a supported V20 Vampire NPC file. Choose a JSON exported from this builder.');
 const s=blank(),i=raw.identity||{};for(const key of Object.keys(s.identity)){if(key==='generation')s.identity[key]=clamp(i[key]??13,3,16);else s.identity[key]=String(i[key]??s.identity[key]).slice(0,500);}
 if(!s.identity.name.trim())throw Error('Give the NPC a name first.');
 for(const attr of Object.keys(s.attributes))s.attributes[attr]=clamp(raw.attributes?.[attr]??1,1,10);
 for(const k of ['abilities','disciplines','backgrounds']){
  if(raw[k]&&(!raw[k]||typeof raw[k]!=='object'||Array.isArray(raw[k])||Object.keys(raw[k]).length>150))throw Error('Invalid '+k+' section.');
  for(const [name,value] of Object.entries(raw[k]||{})){if(!/^[a-z0-9 -]{1,70}$/i.test(name))throw Error('Invalid '+k+' trait name.');if(Number(value)>0)s[k][name]=clamp(value,0,10);}
 }
 for(const v of Object.keys(s.virtues))s.virtues[v]=clamp(raw.virtues?.[v]??3,0,5);
 for(const key of Object.keys(s.traits))s.traits[key]=clamp(raw.traits?.[key]??s.traits[key],key==='bloodMax'?1:0,key==='experience'?10000:100);
 s.traits.willpower=clamp(s.traits.willpower,0,10);s.traits.willpowerCurrent=clamp(raw.traits?.willpowerCurrent??s.traits.willpower,0,s.traits.willpower);s.traits.healthDamage=clamp(s.traits.healthDamage,0,7);s.traits.experience=clamp(s.traits.experience,0,10000);s.traits.path=clamp(s.traits.path,0,10);s.traits.bloodCurrent=Math.min(s.traits.bloodCurrent,s.traits.bloodMax);s.traits.bloodPerTurn=clamp(s.traits.bloodPerTurn,1,20);
 s.notes=String(raw.notes||'').slice(0,20000);for(const key of ['merits','flaws','weakness'])s[key]=String(raw[key]||'').slice(0,key==='weakness'?800:4000);
 for(const k of Object.keys(s.custom))s.custom[k]=Array.isArray(raw.custom?.[k])?raw.custom[k].filter(n=>typeof n==='string'&&n.length<70).slice(0,40):[];
 return s;
}
function normalizeDraft(data){const d=blank();if(!data||!data.identity?.name?.trim())return d;try{return valid(data);}catch{return d;}}
function download(data,filename){const blob=new Blob([JSON.stringify(valid(data),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function dots(path,value,max=5){const current=Number(value)||0;return `<div class="v20-dots" role="group" aria-label="Rating ${escape(path)}">${Array.from({length:max},(_,i)=>`<button type="button" class="v20-dot ${i<current?'filled':''}" data-dot="${escape(path)}" data-rating="${i+1}" title="${i+1} dots" aria-label="${i+1} dots" aria-pressed="${i<current}"></button>`).join('')}</div>`;}
function ratingGroup(title,names,collection,s,max=5){return `<div class="v20-trait-group"><h3>${escape(title)}</h3>${names.map(name=>{const id=slug(name),v=Number(s[collection]?.[id]||0);return `<div class="v20-trait"><span>${escape(name)}</span>${dots(`${collection}.${id}`,v,max)}</div>`;}).join('')}</div>`;}
function section(title,subtitle,body){return `<section class="v20-panel"><div class="v20-panel-header"><h2>${escape(title)}</h2>${subtitle?`<p>${escape(subtitle)}</p>`:''}</div>${body}</section>`;}
function field(k,title,v,options=null,type='text'){
 const opts=options?`<select data-field="${k}">${options.map(o=>`<option value="${escape(o)}" ${String(v)===String(o)?'selected':''}>${escape(o)}</option>`).join('')}</select>`:`<input data-field="${k}" type="${type}" value="${escape(v)}" ${type==='number'?'min="0" max="100"':''} />`;
 return `<label class="v20-field"><span>${escape(title)}</span>${opts}</label>`;
}
function traitNames(s,key,standard){return [...new Set([...standard,...(s.custom?.[key]||[])])];}
function customForm(category){return `<details class="v20-collapsible v20-custom-panel" data-panel="custom-${category}"><summary>Add custom ${escape(category)}</summary><div class="v20-custom"><input aria-label="Add custom ${escape(category)}" placeholder="Custom ${escape(category)} name" data-custom-input="${category}" maxlength="70"/><button type="button" data-add-custom="${category}">+ Add</button></div></details>`;}
function render(s){
 const id=s.identity,traits=s.traits;
 const hdr=`<div class="v20-hero"><h1>V20 · Quick Vampire NPC</h1><p>Set dots directly. No creation points, priorities, Freebies or XP.</p><div class="v20-actions"><button type="button" data-action="export">Export Foundry JSON</button><button type="button" data-action="import">Import JSON</button><button type="button" data-action="save">Save locally</button><button type="button" data-action="load">Load saved</button><button type="button" data-action="duplicate">Duplicate</button><button type="button" data-action="new">New NPC</button><button type="button" data-action="print">V20 Sheet / PDF</button><button type="button" class="v20-create-foundry" data-action="create">Create Foundry Actor</button></div></div>`;
 const identity=section('Identity','Clan, concept, and role in the chronicle.',`<div class="v20-fields">${field('identity.name','Name',id.name)}${field('identity.clan','Clan',id.clan,Object.keys(CLANS))}${field('identity.sect','Sect',id.sect,['Camarilla','Anarch','Sabbat','Independent','Inconnu','Other'])}${field('identity.generation','Generation',id.generation,null,'number')}${field('identity.concept','Concept',id.concept)}${field('identity.sire','Sire',id.sire)}${field('identity.nature','Nature',id.nature)}${field('identity.demeanor','Demeanor',id.demeanor)}${field('identity.chronicle','Chronicle',id.chronicle)}${field('identity.pathName','Humanity / Path name',id.pathName)}</div>`);
 const attrs=section('Attributes','Attributes begin at one dot; elder values up to ten supported.',`<div class="v20-columns">${Object.entries(ATTRIBUTES).map(([n,v])=>ratingGroup(n,v,'attributes',s,10)).join('')}</div>`);
 const abilities=section('Abilities','Talents, Skills and Knowledges; custom abilities are allowed.',`<div class="v20-columns">${Object.entries(ABILITIES).map(([n,v])=>`<div>${ratingGroup(n,v,'abilities',s,10)}${(s.custom?.[n.toLowerCase().slice(0,-1)]||[]).length?ratingGroup('Additional / GM-approved',s.custom[n.toLowerCase().slice(0,-1)],'abilities',s,10):''}${customForm(n.toLowerCase().slice(0,-1))}</div>`).join('')}</div>`);
 const clanPicks=CLANS[id.clan]||[];
 const selectedOut=traitNames(s,'discipline',DISCIPLINES).filter(n=>!clanPicks.includes(n)&&Number(s.disciplines[slug(n)]||0)>0);
 const unselected=traitNames(s,'discipline',DISCIPLINES).filter(n=>!clanPicks.includes(n)&&!selectedOut.includes(n));
 const discs=section('Disciplines','Clan Disciplines appear first. All other Disciplines remain available.',`${clanPicks.length?ratingGroup('Clan Disciplines · recommended',clanPicks,'disciplines',s,10):'<p class="v20-hint">No fixed clan Disciplines for this selection.</p>'}${selectedOut.length?ratingGroup('Other selected Disciplines',selectedOut,'disciplines',s,10):''}<details class="v20-collapsible" data-panel="other-disciplines"><summary>Other Disciplines (${unselected.length} available)</summary>${ratingGroup('Available Disciplines',unselected,'disciplines',s,10)}</details>${customForm('discipline')}`);
 const backgrounds=section('Backgrounds','Generation here is separate from your vitae capacity setting.',`${ratingGroup('Backgrounds',BACKGROUNDS,'backgrounds',s,10)}${(s.custom.background||[]).length?ratingGroup('Custom Backgrounds',s.custom.background,'backgrounds',s,10):''}${customForm('background')}`);
 const virtues=section('Virtues & Resources','Set permanent ratings and starting blood pool.',`<div class="v20-columns"><div class="v20-trait-group"><h3>Virtues</h3>${VIRTUES.map(n=>`<div class="v20-trait"><span>${escape(n)}</span>${dots('virtues.'+slug(n),s.virtues[slug(n)],5)}</div>`).join('')}</div><div class="v20-trait-group"><h3>Other ratings</h3>${[['Willpower','willpower'],['Humanity / Path','path']].map(([n,k])=>`<div class="v20-trait"><span>${n}</span>${dots('traits.'+k,traits[k],10)}</div>`).join('')}<div class="v20-fields">${field('traits.willpowerCurrent','Current Willpower',traits.willpowerCurrent,null,'number')}${field('traits.healthDamage','Health boxes marked (0-7)',traits.healthDamage,null,'number')}${field('traits.experience','Experience',traits.experience,null,'number')}${field('traits.bloodMax','Blood capacity',traits.bloodMax,null,'number')}${field('traits.bloodCurrent','Starting blood',traits.bloodCurrent,null,'number')}${field('traits.bloodPerTurn','Blood per turn',traits.bloodPerTurn,null,'number')}</div><button type="button" data-action="blood">Suggest capacity from Generation</button></div></div>`);
 const extras=section('Sheet Details','Optional printable-sheet details.',`<div class="v20-fields">${field('weakness','Clan weakness / bane',s.weakness)}</div><div class="v20-columns"><label class="v20-field"><span>Merits (one per line; optional cost)</span><textarea data-field="merits" rows="4">${escape(s.merits)}</textarea></label><label class="v20-field"><span>Flaws (one per line; optional cost)</span><textarea data-field="flaws" rows="4">${escape(s.flaws)}</textarea></label></div>`);
 const notes=section('Story & Combat Notes','Keep the essentials for play: feeding, tactics, weakness, gear, haven, connections.',`<textarea data-field="notes" rows="7" placeholder="Personality, tactics, equipment, special attacks...">${escape(s.notes)}</textarea>`);
 return `<div class="v20-app">${hdr}<div class="v20-body">${identity}${attrs}${abilities}<div class="v20-two">${discs}${backgrounds}</div>${virtues}<details class="v20-optional-panel v20-collapsible" data-panel="details"><summary>Sheet Details · Merits, Flaws & Weakness</summary>${extras}</details><details class="v20-optional-panel v20-collapsible" data-panel="notes"><summary>Story & Combat Notes</summary>${notes}</details><div class="v20-actions v20-bottom"><button type="button" data-action="export">Export Foundry JSON</button><button type="button" data-action="create" class="v20-create-foundry">Create Foundry Actor</button></div><p class="v20-footer">Vampire: The Masquerade 20th Anniversary Edition · Built for the Foundry World of Darkness 20th system. Independent of the Mage Charamancer.</p></div></div>`;
}
function setPath(obj,path,val){const [group,key]=path.split('.');if(!key)obj[group]=val;else if(obj[group]&&typeof obj[group]==='object')obj[group][key]=val;}
function enableEditor(root,initial,handlers={}){
 let state=normalizeDraft(initial);let expanded=new Set();let paintQueued=false;const repaint=()=>{if(paintQueued)return;paintQueued=true;requestAnimationFrame(()=>{paintQueued=false;expanded=new Set([...root.querySelectorAll('details[data-panel][open]')].map(el=>el.dataset.panel).concat([...expanded].filter(k=>!root.querySelector(`[data-panel="${k}"]`))));root.innerHTML=render(state);root.querySelectorAll('details[data-panel]').forEach(el=>{el.open=expanded.has(el.dataset.panel);});if(!handlers.onCreate)root.querySelectorAll('[data-action="create"]').forEach(el=>el.style.display='none');if(handlers.onChange)handlers.onChange(state);});};
 root.addEventListener('toggle',event=>{const el=event.target;if(el.matches?.('details[data-panel]')){if(el.open)expanded.add(el.dataset.panel);else expanded.delete(el.dataset.panel);}},true);
 root.addEventListener('click',async event=>{
  const dot=event.target.closest('[data-dot]');if(dot&&root.contains(dot)){const path=dot.dataset.dot,clicked=Number(dot.dataset.rating),[group,key]=path.split('.');const old=Number(state[group]?.[key]||0);setPath(state,path,clicked===old?clicked-1:clicked);repaint();return;}
  const add=event.target.closest('[data-add-custom]');if(add&&root.contains(add)){const category=add.dataset.addCustom,inp=root.querySelector(`[data-custom-input="${category}"]`),name=inp?.value.trim();if(!name||name.length>70||!/^[a-z0-9 -]+$/i.test(name))return alert('Enter a short name using letters, numbers, spaces or hyphens.');const key=slug(name);if(!state.custom[category].some(n=>slug(n)===key))state.custom[category].push(name);repaint();return;}
  const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
  try{
   if(action==='export')download(state,(state.identity.name.trim()||'vampire-npc').replace(/[^a-z0-9-]+/gi,'-')+'.v20-npc.json');
   if(action==='import')handlers.onImport?.();
   if(action==='save')handlers.onSave?.(structuredClone(state));
   if(action==='load'){const chosen=await handlers.onLoad?.();if(chosen){state=normalizeDraft(chosen);handlers.onReplace?.('load');repaint();}}
   if(action==='duplicate'){state.identity.name=(state.identity.name||'NPC')+' (Copy)';handlers.onReplace?.('duplicate');repaint();}
   if(action==='new'){if(confirm('Start a new NPC? Export or save the current one first.')){state=blank();handlers.onReplace?.('new');repaint();}}
   if(action==='print')globalThis.V20NPCSheet.open(state);
   if(action==='blood'){const [cap,per]=suggestedBlood(state.identity.generation);state.traits.bloodMax=cap;state.traits.bloodCurrent=cap;state.traits.bloodPerTurn=per;repaint();}
   if(action==='create'){await handlers.onCreate?.(valid(state));}
  }catch(error){handlers.onError?.(error)||alert(error.message);}
 });
 root.addEventListener('change',e=>{const field=e.target.closest('[data-field]');if(!field)return;const path=field.dataset.field;let value=field.value;if(field.type==='number')value=clamp(value,path==='identity.generation'?3:0,path==='traits.bloodMax'?100:100);setPath(state,path,value);if(path==='traits.bloodMax')state.traits.bloodCurrent=Math.min(Number(state.traits.bloodCurrent),value);repaint();});
 root.addEventListener('input',e=>{if(['notes','merits','flaws'].includes(e.target.dataset.field))state[e.target.dataset.field]=e.target.value;if(e.target.dataset.field?.startsWith('identity.')&&e.target.tagName==='INPUT'&&e.target.type==='text'){setPath(state,e.target.dataset.field,e.target.value);}});
 repaint();return {get:()=>structuredClone(state),load:(d)=>{state=normalizeDraft(d);repaint();}};
}

function chooseSaved(all){
 if(!all?.length)return Promise.resolve(null);
 return new Promise(resolve=>{
  const overlay=document.createElement('div');overlay.className='v20-modal-overlay';overlay.setAttribute('role','presentation');
  const panel=document.createElement('div');panel.className='v20-modal';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Load saved Vampire NPC');
  const h=document.createElement('h2');h.textContent='Load saved NPC';panel.append(h);
  const hint=document.createElement('p');hint.textContent='Choose a locally saved character. Loading replaces the current editor draft.';panel.append(hint);
  const list=document.createElement('div');list.className='v20-saved-list';
  let selected=0;const buttons=[];
  all.forEach((npc,i)=>{const b=document.createElement('button');b.type='button';b.className='v20-saved-option';b.textContent=`${npc.identity?.name||'Unnamed'} — ${npc.identity?.clan||'Unknown clan'}`;b.addEventListener('click',()=>{selected=i;update();});buttons.push(b);list.append(b);});
  function update(){buttons.forEach((b,i)=>{b.classList.toggle('selected',i===selected);b.setAttribute('aria-pressed',i===selected?'true':'false');});}
  update();panel.append(list);
  const actions=document.createElement('div');actions.className='v20-modal-actions';
  const cancel=document.createElement('button');cancel.textContent='Cancel';
  const load=document.createElement('button');load.textContent='Load NPC';load.className='v20-modal-primary';
  const done=(npc)=>{overlay.remove();document.removeEventListener('keydown',onKey,true);resolve(npc);};
  function onKey(e){if(e.key==='Escape'){e.preventDefault();done(null);}else if(e.key==='Enter'){e.preventDefault();done(all[selected]);}}
  cancel.addEventListener('click',()=>done(null));load.addEventListener('click',()=>done(all[selected]));
  overlay.addEventListener('click',e=>{if(e.target===overlay)done(null);});
  actions.append(cancel,load);panel.append(actions);overlay.append(panel);document.body.append(overlay);document.addEventListener('keydown',onKey,true);buttons[0].focus();
 });
}
globalThis.V20NPC={SCHEMA,VERSION,ATTRIBUTES,ABILITIES,CLANS,DISCIPLINES,BACKGROUNDS,blank,valid,normalizeDraft,render,enableEditor,slug,suggestedBlood,download,chooseSaved};
})();
