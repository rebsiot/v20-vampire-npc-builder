'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const main = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'main.js'), 'utf8');
assert.doesNotMatch(main, /Hooks\.on\('getSceneControlButtons'/, 'Legacy Token Controls launcher must be removed');
assert.match(main, /Hooks\.on\('renderActorDirectory'/, 'Must register Foundry Actors sidebar hook');
const executable = main.replace(/^import .*?;\s*$/gm, '');

function smoke({isGM, systemId}) {
  const hooks = new Map();
  let opened = 0;
  let created = 0;
  function node(tag='div') {
    const el = {tagName:tag.toUpperCase(),children:[],dataset:{},className:'',listeners:{},
      append(...elements){this.children.push(...elements);},
      addEventListener(type,fn){this.listeners[type]=fn;},
      setAttribute(){},
      querySelector(selector){
        if(selector==='.directory-header')return this.header??null;
        if(selector==='[data-v20-npc-launcher]')return this.children.find(x=>Object.hasOwn(x.dataset,'v20NpcLauncher'))??null;
        return null;
      }};
    return el;
  }
  const header=node('header');
  header.append(node('button')); // existing native Create Actor button
  const directory=node('aside'); directory.header=header;
  const context={
    console,
    window:{innerWidth:1200,innerHeight:900},
    V20NPC:{blank:()=>({identity:{name:'Test NPC'}})},
    document:{createElement:node},
    Hooks:{on(type,handler){hooks.set(type,handler);},once(type,handler){hooks.set(type,handler);}},
    game:{system:{id:systemId},user:{isGM},settings:{get:(_id,key)=>key==='draft'?null:key==='draftPortrait'?{}:[],set:async()=>{},register:()=>{}}},
    ui:{actors:{element:directory},notifications:{warn(){},error(){},info(){}}},
    foundry:{applications:{api:{ApplicationV2:class {constructor() {this.rendered=false;}render(){this.rendered=true;opened++;}bringToFront(){}},HandlebarsApplicationMixin:Cls=>Cls}}},
    PortraitWorkflow:class {constructor(){this.path='';} select(){}},
    createVampireNPC:async()=>{created++;},
    blueprintFromActor:()=>({}),
  };
  vm.runInNewContext(executable, vm.createContext(context), {filename:'scripts/main.js'});
  assert.equal(hooks.has('getSceneControlButtons'), false);
  hooks.get('ready')();
  const render=hooks.get('renderActorDirectory');
  assert.equal(typeof render,'function');
  render({element:directory}, null);
  render({element:directory}, null);
  const buttons=header.children.filter(x=>Object.hasOwn(x.dataset,'v20NpcLauncher'));
  if(isGM && systemId==='worldofdarkness'){
    assert.equal(buttons.length,1,'GM sees exactly one Create Vampire NPC button');
    assert.equal(header.children.length,2,'Native Create Actor button remains intact');
    assert.equal(buttons[0].children[1].textContent,'Create Vampire NPC');
    buttons[0].listeners.click({preventDefault(){},stopPropagation(){}});
    assert.equal(opened,1,'Click opens editor');
    assert.equal(created,0,'Click does not create an Actor immediately');
    const popHeader=node('header');const pop=node('aside');pop.header=popHeader;
    render({element:pop},null);
    assert.equal(popHeader.children.filter(x=>Object.hasOwn(x.dataset,'v20NpcLauncher')).length,1,'Popout supported');
  } else {
    assert.equal(buttons.length,0,'Non-GM or non-WoD20 client has no launcher');
  }
}
smoke({isGM:true,systemId:'worldofdarkness'});
smoke({isGM:false,systemId:'worldofdarkness'});
smoke({isGM:true,systemId:'pf2e'});
console.log('PASS: sidebar launcher; single entry, GM-only, WoD20-only, native controls, popout, no immediate Actor creation.');
