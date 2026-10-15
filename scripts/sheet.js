/* V20-style vector printable character sheet, shared by browser and Foundry. */
(function(){
'use strict';
const C=()=>globalThis.V20NPC;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=x=>C().slug(x);
const all=(key,standard,s)=>[...new Set([...standard,...(s.custom?.[key]||[])])];
const names=(dict,names)=>names.filter(n=>Number(dict?.[slug(n)]||0)>0);
const rating=(dict,name)=>Number(dict?.[slug(name)]||0);
function track(value,max=10,square=false){
 const n=Math.max(0,Math.min(max,Number(value)||0));
 return `<span class="dots ${square?'square':''}" aria-label="${n} of ${max}">${Array.from({length:max},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
}
function bar(title){return `<div class="section-title"><span>${esc(title)}</span></div>`;}
function row(label,n,max=10){return `<div class="trait-row"><span class="trait-label">${esc(label)||'&nbsp;'}</span>${track(n,max)}</div>`;}
function sortedSlots(dict,base,custom=[],limit=11){
 const list=[...new Set([...base,...custom])];
 // Show rated custom traits on the main sheet, without hiding rated core traits.
 const scored=list.filter(n=>rating(dict,n)>0);
 const unrated=base.filter(n=>!scored.some(s=>slug(s)===slug(n)));
 const ordered=[...scored,...unrated];
 const printed=ordered.slice(0,limit);
 return {printed:[...printed,...Array(Math.max(0,limit-printed.length)).fill('')],overflow:ordered.slice(limit).filter(n=>rating(dict,n)>0)};
}
function traitColumn(title,dict,names){return `<div class="trait-column"><div class="column-title">${esc(title)}</div>${names.map(n=>row(n,n?rating(dict,n):0)).join('')}</div>`;}
function labelValue(label,value){return `<div class="identity-field"><b>${esc(label)}</b><span>${esc(value)||'&nbsp;'}</span></div>`;}
function textLines(value,max){const lines=String(value||'').split(/\r?\n/).filter(Boolean);return [...lines.slice(0,max),...Array(Math.max(0,max-lines.length)).fill('')];}
function notesList(text,maxRows){return textLines(text,maxRows).map(x=>`<div class="entry-line">${esc(x)||'&nbsp;'}</div>`).join('');}
function miniHeader(text){return `<div class="mini-title">${esc(text)}</div>`;}
function twoLine(text){return esc(String(text??'').slice(0,80))||'&nbsp;';}
function display(identity,traits){
 const s=C().valid({...identity, identity:{...identity.identity,name:identity.identity?.name||'Unnamed NPC'}}),id=s.identity;
 const additional=[];
 const ac=C().ATTRIBUTES,ab=C().ABILITIES;
 const attrs=Object.entries(ac).map(([title,n])=>traitColumn(title,s.attributes,n)).join('');
 const abilities=Object.entries(ab).map(([title,normal])=>{
  const category=title==='Talents'?'talent':title==='Skills'?'skill':'knowledge';
  const block=sortedSlots(s.abilities,normal,s.custom[category],11);
  if(block.overflow.length)additional.push({title:title+' (additional)',names:block.overflow,group:'abilities'});
  return traitColumn(title,s.abilities,block.printed);
 }).join('');
 const d=sortedSlots(s.disciplines,[],all('discipline',C().DISCIPLINES,s).filter(n=>rating(s.disciplines,n)>0),8);
 const b=sortedSlots(s.backgrounds,[],all('background',C().BACKGROUNDS,s).filter(n=>rating(s.backgrounds,n)>0),8);
 if(d.overflow.length)additional.push({title:'Additional Disciplines',names:d.overflow,group:'disciplines'});
 if(b.overflow.length)additional.push({title:'Additional Backgrounds',names:b.overflow,group:'backgrounds'});
 const adv=`<div class="adv-left">${traitColumn('Disciplines',s.disciplines,d.printed)}</div><div>${traitColumn('Backgrounds',s.backgrounds,b.printed)}</div><div>${miniHeader('Virtues')}${row('Conscience / Conviction',s.virtues.conscience,5)}${row('Self-Control / Instinct',s.virtues.selfcontrol,5)}${row('Courage',s.virtues.courage,5)}</div>`;
 const health=['Bruised','Hurt','Injured','Wounded','Mauled','Crippled','Incapacitated'];
 const healthPenalty=['','-1','-1','-2','-2','-5',''];
 const dmg=Number(s.traits.healthDamage)||0;
 const blood=Number(s.traits.bloodCurrent)||0;
 const maxBlood=Number(s.traits.bloodMax)||10;
 const marks=Math.min(50,maxBlood);
 const resources=`${miniHeader(`${id.pathName||'Humanity'} / Path`)}<div class="resource-large">${track(s.traits.path,10)}</div><div class="resource-caption">${esc(id.pathName||'Humanity')} (${s.traits.path})</div>
  ${miniHeader('Willpower')}<div class="resource-large">${track(s.traits.willpower,10)}</div><div class="resource-small">${track(s.traits.willpowerCurrent??s.traits.willpower,10,true)}</div>
  ${miniHeader('Blood Pool')}<div class="blood-pool">${Array.from({length:Math.max(10,marks)},(_,i)=>`<i class="${i<blood?'on':''} ${i>=maxBlood?'disabled':''}"></i>`).join('')}</div><div class="resource-caption">${blood} / ${maxBlood} &nbsp; | &nbsp; Blood per turn: ${s.traits.bloodPerTurn}</div>`;
 const merits=textLines(s.merits||'',4),flaws=textLines(s.flaws||'',4);
 const meritHTML=(arr)=>arr.map(v=>`<div class="entry-line">${esc(v)||'&nbsp;'}</div>`).join('');
 const weakness=s.weakness||'';
 const char=`<section class="sheet first-page">
  <header class="mast"><div class="edition">20TH ANNIVERSARY EDITION</div><div class="logo">VAMPIRE</div><div class="tagline">THE MASQUERADE</div></header>
  <div class="id-grid">${labelValue('Name',id.name)}${labelValue('Nature',id.nature)}${labelValue('Clan',id.clan)}${labelValue('Sect',id.sect)}${labelValue('Demeanor',id.demeanor)}${labelValue('Generation',id.generation)}${labelValue('Chronicle',id.chronicle)}${labelValue('Concept',id.concept)}${labelValue('Sire',id.sire)}</div>
  ${bar('Attributes')}<div class="three attribute-grid">${attrs}</div>
  ${bar('Abilities')}<div class="three ability-grid">${abilities}</div>
  ${bar('Advantages')}<div class="three advantages-grid">${adv}</div>
  <div class="lower-grid"><div class="lower-cell merit-cell">${miniHeader('Merits & Flaws')}<div class="subcaption">Merits</div>${meritHTML(merits)}<div class="subcaption">Flaws</div>${meritHTML(flaws)}</div>
   <div class="lower-cell resource-cell">${resources}</div>
   <div class="lower-cell health-cell">${miniHeader('Health')}${health.map((name,i)=>`<div class="health-row"><span>${name}</span><span class="penalty">${healthPenalty[i]}</span><span class="healthbox ${i<dmg?'on':''}"></span></div>`).join('')}
    ${miniHeader('Weakness')}<div class="weakness">${twoLine(weakness)}</div>${miniHeader('Experience')}<div class="xp">${esc(s.traits.experience??0)} XP</div>
   </div></div>
  <div class="foot">V20 QUICK NPC BUILDER · GENERATION ${id.generation} · SECT ${esc(id.sect)}<span>Print at 100% · Letter portrait</span></div>
 </section>`;
 const hasMore=additional.length||s.notes.trim()||String(s.merits||'').split('\n').filter(Boolean).length>4||String(s.flaws||'').split('\n').filter(Boolean).length>4;
 const overflowText=[];
 if(String(s.merits||'').split('\n').filter(Boolean).length>4)overflowText.push(['Other Merits',String(s.merits).split(/\r?\n/).slice(4).join('\n')]);
 if(String(s.flaws||'').split('\n').filter(Boolean).length>4)overflowText.push(['Other Flaws',String(s.flaws).split(/\r?\n/).slice(4).join('\n')]);
 const appendix=hasMore?`<section class="sheet appendix"><div class="appendix-title">${esc(id.name)} <small>Additional NPC Details</small></div><div class="appendix-columns">${additional.map(block=>`<div class="extra-group">${miniHeader(block.title)}${block.names.map(n=>row(n,rating(s[block.group],n))).join('')}</div>`).join('')}${overflowText.map(([name,txt])=>`<div class="extra-group">${miniHeader(name)}<div class="long-notes">${esc(txt)}</div></div>`).join('')}</div>${s.notes.trim()?`<div class="extra-notes">${miniHeader('Description, combat tactics & story notes')}<div class="long-notes">${esc(s.notes)}</div></div>`:''}</section>`:'';
 return char+appendix;
}
const css=`
@page{size:letter portrait;margin:0}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#e5e1dd;color:#191313}body{font-family:Georgia,'Times New Roman',serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print-toolbar{position:sticky;top:0;z-index:10;padding:12px 22px;background:#251b1d;color:white;font-family:Arial,sans-serif;text-align:center}#print-toolbar button{padding:9px 17px;border:0;border-radius:4px;background:#a43b47;color:white;font-weight:700;cursor:pointer;margin-right:13px}#print-toolbar span{font-size:12px}
.sheet{width:8.5in;height:11in;background:#fff;padding:.29in .42in .22in;margin:18px auto;box-shadow:0 3px 16px #0003;border:2px solid #392b2b;display:flex;flex-direction:column;overflow:hidden;position:relative;page-break-after:always}
.sheet:before{position:absolute;content:'';inset:7px;border:1px solid #aaa3a3;pointer-events:none}
.mast{text-align:center;position:relative;height:81px;flex-shrink:0}
.edition{font-size:10px;font-weight:700;letter-spacing:3px}.logo{font-size:45px;line-height:42px;letter-spacing:3px;font-weight:400;transform:scaleX(.82);font-family:'Times New Roman',serif}.tagline{font-size:17px;letter-spacing:3px;font-weight:700;margin-top:-1px}
.id-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,20px);column-gap:16px;row-gap:1px;margin:1px 0 6px}.identity-field{display:flex;align-items:baseline;gap:5px;font-size:10.4px;white-space:nowrap;overflow:hidden}.identity-field b{font-weight:700}.identity-field span{border-bottom:1px solid #a4a0a0;min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis}
.section-title{position:relative;text-align:center;font-size:15.7px;font-weight:700;height:23px;line-height:21px;flex-shrink:0;white-space:nowrap}.section-title:before{content:'';position:absolute;left:0;right:0;top:11px;border-top:2px solid #302728}.section-title span{position:relative;background:white;padding:0 13px}
.three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:15px;flex-shrink:0}.trait-column{min-width:0}.column-title,.mini-title{text-align:center;font-weight:700;font-size:11.6px;height:21px;line-height:20px;white-space:nowrap}
.trait-row{height:16.1px;display:flex;align-items:center;justify-content:space-between;gap:3px;min-width:0;border-bottom:1px solid #dad6d2}.trait-label{font-size:10.1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}.dots{flex-shrink:0;display:inline-flex;gap:1.45px;align-items:center}.dots i{height:7.1px;width:7.1px;display:inline-block;border:1px solid #221d1e;border-radius:50%;background:#fff}.dots i.on{background:#221d1e}.dots.square i{border-radius:0;height:9px;width:9px}.dots.square{gap:2px}
.attribute-grid .trait-row{height:17px}.ability-grid .trait-row{height:15.5px}.adv-left .trait-row,.advantages-grid>.trait-column .trait-row,.advantages-grid>div>.trait-column .trait-row{height:17px}
.advantages-grid{margin-bottom:4px}.advantages-grid>div{min-width:0}.advantages-grid>div>.mini-title{height:22px}.advantages-grid>div>.trait-row{height:22px}
.lower-grid{display:grid;grid-template-columns:34% 34% 32%;column-gap:0;min-height:0;flex:1;border-top:2px solid #332728;margin-top:7px;padding-top:2px}.lower-cell{padding:0 10px 0 7px;min-width:0}.lower-cell+.lower-cell{border-left:1px solid #c4bdba}.mini-title{border-bottom:1px solid #574a4a;margin-top:3px;margin-bottom:4px;font-size:12.2px}.subcaption{font-size:10px;font-weight:bold;margin-top:4px;height:14px}.entry-line{height:18px;border-bottom:1px solid #a49e9e;font-size:10px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding-top:3px}
.resource-cell .mini-title{margin-top:5px;margin-bottom:4px}.resource-large{text-align:center;margin:2px 0 3px}.resource-large .dots i{width:11px;height:11px}.resource-large .dots{gap:3px}.resource-small{text-align:center;margin-top:7px}.resource-small .dots i{width:10px;height:10px}.resource-caption{font-size:9px;text-align:center;margin:3px 0 9px}
.blood-pool{width:100%;max-width:210px;display:grid;grid-template-columns:repeat(10, 1fr);gap:3px;margin:9px auto 6px}.blood-pool i{display:block;border:1px solid #1d1919;height:11px;background:#fff}.blood-pool i.on{background:#282020}.blood-pool i.disabled{border-color:#bbb;background:#eee}
.health-row{display:flex;align-items:center;gap:5px;justify-content:space-between;font-size:10px;height:19.3px;border-bottom:1px dotted #e1dddd}.health-row span:first-child{flex:1}.penalty{width:17px}.healthbox{border:1px solid #282020;width:11px;height:11px}.healthbox.on{background:#282020}.health-cell .mini-title:not(:first-child){margin-top:10px}.weakness{min-height:21px;border-bottom:1px solid #999;font-size:10px;overflow-wrap:anywhere;max-height:40px;overflow:hidden}.xp{font-size:11px;text-align:center}
.foot{display:flex;justify-content:space-between;font-size:7.5px;font-family:Arial,sans-serif;letter-spacing:.3px;border-top:1px solid #888;padding-top:4px;flex-shrink:0;margin-top:6px}
.appendix{padding:.47in .53in}.appendix-title{font-size:21px;font-weight:bold;border-bottom:3px solid #2f2225;margin-bottom:25px}.appendix-title small{font-size:12px;font-weight:normal;float:right}.appendix-columns{display:grid;grid-template-columns:1fr 1fr;column-gap:28px;row-gap:15px}.extra-group{break-inside:avoid}.extra-group .trait-row{height:19px}.extra-notes{margin-top:20px}.long-notes{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;line-height:1.5}
@media print{html,body{background:#fff!important}#print-toolbar{display:none}.sheet{margin:0;box-shadow:none;break-after:page;border:2px solid #392b2b}.sheet:last-child{page-break-after:auto;break-after:auto}}
`;
function documentHTML(s){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(s.identity?.name||'Vampire NPC')} - V20 Sheet</title><style>${css}</style></head><body><div id="print-toolbar"><button onclick="window.print()">Print (static PDF)</button><button id="v20-fillable-pdf" onclick="window.downloadV20Fillable()">Download fillable PDF</button><span>Use Download fillable PDF to click dots and tracker boxes in a PDF reader. The Print option creates a static PDF.</span></div>${display(s)}</body></html>`;}
function open(s){const source=structuredClone(s);if(!source.identity?.name?.trim())source.identity.name='Unnamed Vampire';const safe=C().valid(source);const win=window.open('','_blank');if(!win)throw Error('Your browser blocked the printable sheet. Allow popups and try again.');win.downloadV20Fillable=async()=>{
    const b=win.document.getElementById('v20-fillable-pdf');
    try{
      if(typeof globalThis.V20NPCFillablePDF!=='function')throw Error('The bundled fillable PDF engine did not load. Refresh or reinstall the complete module.');
      if(b){b.disabled=true;b.textContent='Building PDF...';}
      const bytes=await globalThis.V20NPCFillablePDF(safe);
      const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
      const link=win.document.createElement('a');link.href=url;
      link.download=(safe.identity.name||'Vampire-NPC').replace(/[^a-z0-9._-]+/gi,'-')+'-V20-fillable.pdf';
      win.document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){console.error('V20 Fillable PDF',e);win.alert('Could not create fillable PDF: '+e.message);}
    finally{if(b){b.disabled=false;b.textContent='Download fillable PDF';}}
  };win.document.open();win.document.write(documentHTML(safe));win.document.close();win.focus();return win;}
globalThis.V20NPCSheet={open,documentHTML,display};
})();
