/* Browser and Foundry: fully local, editable AcroForm V20 NPC sheet.
   Built with the bundled pdf-lib, no network requests or NPC uploads. */
(function(){
'use strict';
const esc = value => String(value??'').replace(/[\r\n]+/g,' ').trim();
const rating = (source,name)=>Math.max(0,Math.min(10,Math.trunc(Number(source?.[globalThis.V20NPC.slug(name)]||0))));
const cap = (s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
async function makePDF(raw){
 const L=globalThis.PDFLib, Core=globalThis.V20NPC;
 if(!L||!Core)throw Error('V20 PDF dependencies were not loaded. Reinstall the complete builder package.');
 const s=Core.valid(raw), doc=await L.PDFDocument.create(), form=doc.getForm(), H=792, W=612;
 const regular=await doc.embedFont(L.StandardFonts.TimesRoman), bold=await doc.embedFont(L.StandardFonts.TimesRomanBold);
 const dark=L.rgb(.14,.10,.11), gray=L.rgb(.58,.55,.54), paper=L.rgb(1,1,1), accent=L.rgb(.35,.17,.20);
 const bottom=(top,height=0)=>H-top-height;
 const p=doc.addPage([W,H]);let page=p;
 const fields=[];
 const safe=(v,f=regular)=>{const t=esc(v);return [...t].map(ch=>{try{f.encodeText(ch);return ch;}catch{return '?';}}).join('');};
 const txt=(v,x,top,size=9,heavy=false,center=false)=>{const f=heavy?bold:regular,text=safe(v,f);page.drawText(text,{x:center?x-f.widthOfTextAtSize(text,size)/2:x,y:bottom(top,size),font:f,size,color:dark});};
 const ln=(x1,t1,x2,t2,width=.7,col=gray)=>page.drawLine({start:{x:x1,y:bottom(t1)},end:{x:x2,y:bottom(t2)},thickness:width,color:col});
 const section=(name,top)=>{ln(33,top+9,579,top+9,1.8,dark);page.drawRectangle({x:267,y:bottom(top,19),width:80,height:19,color:paper});txt(name,306,top-1,14,true,true);};
 const paperText=(v,x,top,w,h,name)=>{
  const f=form.createTextField(name);f.setText(safe(v));f.setMaxLength(255);f.addToPage(page,{x,y:bottom(top,h),width:w,height:h,borderWidth:0,backgroundColor:paper,textColor:dark,font:regular});f.setFontSize(9.2);ln(x,top+h,x+w,top+h,.55,gray);
 };
 const identity=(label,value,x,t,i)=>{txt(label+':',x,t,8.2,true);paperText(value,x+58,t-1,100,13,'identity.'+i);};
 function dot(id,x,top,checked,round=true,sz=7.2){
  const f=form.createCheckBox(id);
  f.addToPage(page,{x,y:bottom(top,sz),width:sz,height:sz,borderWidth:0,backgroundColor:paper,textColor:dark});
  if(checked)f.check();fields.push({f,round});
 }
 const track=(id,value,x,t,count=10,round=true,gap=8,sz=6.8)=>{
  const active=Math.max(0,Math.min(count,Math.trunc(Number(value)||0)));
  for(let i=0;i<count;i++)dot(id+'.'+(i+1),x+i*gap,t,i<active,round,sz);
 };
 const colXs=[35,218,400];
 const row=(name,value,col,top,id,max=10)=>{
  const x=colXs[col]; const label= max===5 ? String(name||'').replace(' / ','/'):cap(name||'',20);txt(label,x,top,max===5?7.3:8.4,false);
  if(name)track(id,value,x+105,top+2,max,true,max>5?6.8:9.6,max>5?6.2:7.3);
  else ln(x+2,top+13,x+177,top+13,.25);
 };
 // Header and identity
 txt('20TH ANNIVERSARY EDITION',306,17,9,true,true);
 txt('VAMPIRE',306,28,37,false,true);
 txt('THE MASQUERADE',306,72,15,true,true);
 ln(32,92,580,92,1.9,accent);
 const id=s.identity;
 [['Name',id.name],['Nature',id.nature],['Clan',id.clan],['Player',''],['Demeanor',id.demeanor],['Generation',id.generation],['Chronicle',id.chronicle],['Concept',id.concept],['Sire',id.sire]].forEach(([k,v],i)=>identity(k,v,colXs[i%3],101+Math.floor(i/3)*18,k.toLowerCase()));
 section('Attributes',161);
 ['Physical','Social','Mental'].forEach((name,j)=>txt(name,colXs[j]+86,180,12,true,true));
 Object.entries(Core.ATTRIBUTES).forEach(([cat,names],j)=>names.forEach((n,i)=>row(n,rating(s.attributes,n),j,197+16*i,'attr.'+Core.slug(n))));
 section('Abilities',252);
 ['Talents','Skills','Knowledges'].forEach((n,j)=>txt(n,colXs[j]+86,270,12,true,true));
 const extra=[];
 Object.entries(Core.ABILITIES).forEach(([cat,standard],j)=>{
  const key=cat==='Talents'?'talent':cat==='Skills'?'skill':'knowledge';
  const list=[...new Set([...standard,...(s.custom?.[key]||[])])];
  const rated=list.filter(n=>rating(s.abilities,n)>0), empty=standard.filter(n=>!rated.some(x=>Core.slug(x)===Core.slug(n)));
  const items=[...rated,...empty];items.slice(0,11).forEach((n,i)=>row(n,rating(s.abilities,n),j,288+15.3*i,'ability.'+Core.slug(n)));
  for(const name of items.slice(11))if(rating(s.abilities,name))extra.push(['Ability / '+cat,name,rating(s.abilities,name)]);
 });
 section('Advantages',469);
 ['Disciplines','Backgrounds','Virtues'].forEach((n,j)=>txt(n,colXs[j]+86,487,12,true,true));
 function advRows(group,standard,custom,where,groupId){
  const list=[...new Set([...standard,...(s.custom?.[custom]||[])])].filter(n=>rating(s[group],n)>0);
  list.slice(0,8).forEach((n,i)=>row(n,rating(s[group],n),where,504+14.5*i,groupId+'.'+Core.slug(n)));
  for(let i=list.length;i<8;i++)row('',0,where,504+14.5*i,groupId+'.empty'+i);
  for(const name of list.slice(8))extra.push([groupId,name,rating(s[group],name)]);
 }
 advRows('disciplines',Core.DISCIPLINES,'discipline',0,'discipline');
 advRows('backgrounds',Core.BACKGROUNDS,'background',1,'background');
 const virt=[['Conscience / Conviction',s.virtues.conscience],['Self-Control / Instinct',s.virtues.selfcontrol],['Courage',s.virtues.courage]];
 virt.forEach(([name,v],i)=>row(name,v,2,507+i*21,'virtue.'+i,5));
 ln(33,633,579,633,1.8,dark);
 const title=(v,x,t)=>txt(v,x,t,11.3,true);
 title('Merits & Flaws',35,639);
 txt('Merits',35,657,8.5,true);
 const merits=String(s.merits||'').split(/\r?\n/).filter(Boolean);
 const flaws=String(s.flaws||'').split(/\r?\n/).filter(Boolean);
 for(let i=0;i<3;i++){txt(cap(merits[i]||'',34),35,670+i*12,8);ln(35,682+i*12,193,682+i*12,.35);}
 txt('Flaws',35,710,8.5,true);
 for(let i=0;i<3;i++){txt(cap(flaws[i]||'',34),35,721+i*12,8);ln(35,733+i*12,193,733+i*12,.35);}
 title((id.pathName||'Humanity')+' / Path',219,639);
 track('path',s.traits.path,228,657,10,true,14.3,10);
 title('Willpower',219,675);
 track('willpower.permanent',s.traits.willpower,228,693,10,true,14.3,10);
 track('willpower.current',s.traits.willpowerCurrent??s.traits.willpower,228,709,10,false,14.3,10);
 title('Blood Pool',219,725);
 const available=Math.max(10,Math.min(100,Math.trunc(Number(s.traits.bloodMax||10))));
 const current=Math.min(available,Math.max(0,Math.trunc(Number(s.traits.bloodCurrent)||0)));
 for(let i=0;i<Math.min(available,30);i++){
   const r=Math.floor(i/10),c=i%10;dot('blood.'+(i+1),228+c*14.3,739+r*11,i<current,false,8.3);
 }
 txt('Health',407,639,11.3,true);
 ['Bruised','Hurt','Injured','Wounded','Mauled','Crippled','Incapacitated'].forEach((name,i)=>{
  txt(name,407,655+i*12.5,8.7);txt(['','-1','-1','-2','-2','-5',''][i],526,655+i*12.5,8.5);
  dot('health.'+(i+1),551,656+i*12.5,i<Number(s.traits.healthDamage||0),false,10);
 });
 txt('Weakness',407,744,8,true);paperText(s.weakness||'',453,741,108,11,'weakness');
 title('Experience',407,756);
 paperText(s.traits.experience??0,502,757,49,13,'experience');
 txt('20TH ANNIVERSARY · QUICK NPC · FILLABLE',306,780,7,false,true);
 // additional blood dots (up to 50) and overflow NPC data on a separate page
 if(extra.length||available>30||s.notes?.trim()||merits.length>3||flaws.length>3){
   page=doc.addPage([W,H]);txt('VAMPIRE · ADDITIONAL NPC DETAILS',306,31,19,true,true);ln(35,62,577,62,1.5,accent);
   txt(id.name||'Unnamed Vampire',38,71,12,true);
   let t=108;
   const addTitle=(v)=>{txt(v,37,t,12,true);t+=25;};
   if(extra.length){addTitle('Additional rated Traits');for(const [group,name,value] of extra){if(t>745){page=doc.addPage([W,H]);t=49;}txt(group+': '+name,40,t,10);track('extra.'+Core.slug(group)+'.'+Core.slug(name),value,420,t+2,10,true,9,7.5);t+=18;}t+=14;}
   for(const [titleText,content] of [['Other Merits',merits.slice(3)],['Other Flaws',flaws.slice(3)],['Notes',String(s.notes||'').split(/\r?\n/).filter(Boolean)]])if(content.length){
    if(t>724){page=doc.addPage([W,H]);t=49;}addTitle(titleText);
    for(const l of content){for(let start=0;start<l.length;start+=94){if(t>749){page=doc.addPage([W,H]);t=49;}txt(l.slice(start,start+94),40,t,10);t+=15;}}t+=14;
   }
   if(available>30){
     if(t>681){page=doc.addPage([W,H]);t=49;}
     addTitle('Additional Blood Pool boxes (31-'+available+')');
     for(let i=30;i<available;i++){
       const r=Math.floor((i-30)/10),c=(i-30)%10;
       dot('blood.'+(i+1),43+c*14.3,t+r*14,i<current,false,8.3);
     }
   }
 }
 // Create reader-independent, vector circle/square widget appearances.
 form.updateFieldAppearances(regular);
 for(const {f,round} of fields){
  f.updateAppearances((field,widget)=>{
   const {width:w,height:h}=widget.getRectangle();
   const outline=round?L.drawEllipse({x:w/2,y:h/2,xScale:w/2-.55,yScale:h/2-.55,color:paper,borderColor:dark,borderWidth:.65})
     :L.drawRectangle({x:0.4,y:0.4,width:w-.8,height:h-.8,rotate:L.degrees(0),xSkew:L.degrees(0),ySkew:L.degrees(0),color:paper,borderColor:dark,borderWidth:.65});
   const fill=round?L.drawEllipse({x:w/2,y:h/2,xScale:Math.max(0.5,w/2-1.25),yScale:Math.max(0.5,h/2-1.25),color:dark,borderColor:dark,borderWidth:.1})
     :L.drawRectangle({x:1.55,y:1.55,width:w-3.1,height:h-3.1,rotate:L.degrees(0),xSkew:L.degrees(0),ySkew:L.degrees(0),color:dark,borderColor:dark,borderWidth:0});
   return {normal:{off:[...outline],on:[...outline,...fill]},down:{off:[...outline],on:[...outline,...fill]}};
  });
 }
 doc.setTitle((id.name||'Vampire NPC')+' - V20 Fillable Character Sheet');
 doc.setCreator('V20 Quick Vampire NPC Builder');
 await doc.attach(new TextEncoder().encode(JSON.stringify(s)), 'v20-npc-source.json',{mimeType:'application/json',description:'Snapshot used to create the PDF. PDF edits do not update this snapshot.'});
 return doc.save();
}
globalThis.V20NPCFillablePDF=makePDF;
})();
