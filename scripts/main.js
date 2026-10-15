import './core.js';
import './fillable.js';
import './sheet.js';
import {createVampireNPC,blueprintFromActor} from './actor.js';
import {PortraitWorkflow} from './portrait.js';
const ID='v20-vampire-npc-builder';
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
let active=null;
function savedList(){return game.settings.get(ID,'savedNPCs')||[];}
async function saveNPC(s){const list=savedList(),idx=list.findIndex(x=>x.identity?.name===s.identity.name);if(idx>=0)list[idx]=s;else list.push(s);await game.settings.set(ID,'savedNPCs',list);ui.notifications.info(`Saved NPC: ${s.identity.name}.`);}
async function loadNPC(){const list=savedList();if(!list.length){ui.notifications.warn('No saved NPCs.');return null;}return globalThis.V20NPC.chooseSaved(list);}
function pickJSON(consumer){const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw Error('NPC JSON cannot exceed 1 MB.');const s=globalThis.V20NPC.valid(JSON.parse(await file.text()));await consumer(s);}catch(e){console.error(ID,e);ui.notifications.error('NPC import failed: '+e.message);}};input.click();}
class VampireNPCEditor extends HandlebarsApplicationMixin(ApplicationV2){
 static DEFAULT_OPTIONS={id:'v20-vampire-npc-editor',classes:['v20-foundry-window'],window:{title:'V20 Quick Vampire NPC Builder',icon:'fa-solid fa-droplet',resizable:true},position:{width:1060,height:790}};
 static PARTS={main:{template:'modules/v20-vampire-npc-builder/templates/editor.hbs'}};
 constructor(initial=null,options={}){
  const {portraitPath=null,...appOptions}=options;
  super(appOptions);
  this._npcDraft=initial||game.settings.get(ID,'draft')||globalThis.V20NPC.blank();
  const saved=game.settings.get(ID,'draftPortrait')||{};
  const restored=!initial&&saved.name===(this._npcDraft.identity?.name||'')?saved.path:'';
  this._portraitWorkflow=new PortraitWorkflow(portraitPath??restored);
 }
 _onRender(ctx,options){
  super._onRender(ctx,options);
  const root=this.element.querySelector('.v20-editor');if(!root)return;
  const portrait=this._portraitWorkflow;
  portrait.bind(root);
  this._npcEditorController=globalThis.V20NPC.enableEditor(root,this._npcDraft,{
   onChange:s=>{this._npcDraft=structuredClone(s);portrait.onBlueprintChange(s);},
   onSave:saveNPC,onLoad:loadNPC,
   onReplace:()=>portrait.clear(),
   onImport:()=>pickJSON(s=>{portrait.clear();this._npcDraft=s;this._npcEditorController.load(s);}),
   onCreate:async s=>{
    // Existing Actor creation remains the authority for the full Vampire sheet.
    // Artwork is an optional post-create step; failures cannot delete an Actor.
    if(portrait.creating)return;
    portrait.setCreating(true);
    try{
     const actor=await createVampireNPC(s);
     portrait.markCreated(actor,s);
     await portrait.applyToActor(actor);
     ui.notifications.info('Vampire NPC created: '+actor.name);
    }finally{portrait.setCreating(false);}
   },
   onError:e=>{console.error(ID,e);ui.notifications.error(e.message);return true;}
  });
  root.querySelector('[data-action="export"]')?.classList.add('primary');
 }
 async close(options={}){
  try{
   if(this._npcDraft){
    await game.settings.set(ID,'draft',this._npcDraft);
    await game.settings.set(ID,'draftPortrait',{name:this._npcDraft.identity?.name||'',path:this._portraitWorkflow.path});
   }
  }catch(e){console.warn(ID,e);}
  return super.close(options);
 }
}
function openEditor(initial=null,portraitPath=null){
 if(game.system.id!=='worldofdarkness'){ui.notifications.error('Requires the World of Darkness 20th system.');return;}
 if(!game.user.isGM){ui.notifications.warn('The Vampire NPC Builder is GM-only.');return;}
 if(active?.rendered){
  if(initial){active._npcDraft=initial;active._portraitWorkflow.select(portraitPath||'');active._npcEditorController?.load(initial);}
  active.bringToFront();return active;
 }
 active=new VampireNPCEditor(initial,{position:{width:Math.min(1550,Math.floor(window.innerWidth*0.93)),height:Math.min(900,Math.floor(window.innerHeight*0.88))},portraitPath});
 active.render(true);return active;
}
Hooks.on('getSceneControlButtons',controls=>{if(game.system.id!=='worldofdarkness'||!game.user.isGM||!controls.tokens?.tools)return;const tools=controls.tokens.tools,orders=Object.values(tools).map(t=>t.order).filter(Number.isFinite);tools.v20VampireNPC={name:'v20VampireNPC',title:'Quick Vampire NPC',icon:'fa-solid fa-droplet',order:Math.max(-1,...orders)+1,button:true,visible:true,onChange:()=>openEditor()};});
Hooks.once('init',()=>{
 game.settings.register(ID,'draft',{scope:'client',config:false,type:Object,default:{}});
 game.settings.register(ID,'savedNPCs',{scope:'client',config:false,type:Array,default:[]});
 game.settings.register(ID,'draftPortrait',{scope:'client',config:false,type:Object,default:{}});
});
Hooks.once('ready',()=>{
 game.v20VampireNPC={open:openEditor,create:createVampireNPC,importFile:()=>pickJSON(async s=>{const actor=await createVampireNPC(s);ui.notifications.info('Imported Vampire NPC: '+actor.name);}),exportActor:async actor=>{const s=blueprintFromActor(actor);globalThis.V20NPC.download(s,actor.name.replace(/[^a-z0-9-]+/gi,'-')+'.v20-npc.json');},loadActor:actor=>openEditor(blueprintFromActor(actor),actor.img)};
 console.info(ID+' | Ready. Run game.v20VampireNPC.open()');
});
