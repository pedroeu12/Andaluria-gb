"use strict";var j=Object.defineProperty;var Le=Object.getOwnPropertyDescriptor;var ze=Object.getOwnPropertyNames;var Ie=Object.prototype.hasOwnProperty;var _e=(t,n)=>{for(var e in n)j(t,e,{get:n[e],enumerable:!0})},Be=(t,n,e,r)=>{if(n&&typeof n=="object"||typeof n=="function")for(let o of ze(n))!Ie.call(t,o)&&o!==e&&j(t,o,{get:()=>n[o],enumerable:!(r=Le(n,o))||r.enumerable});return t};var Ke=t=>Be(j({},"__esModule",{value:!0}),t);var gt={};_e(gt,{default:()=>V});module.exports=Ke(gt);var w=require("obsidian");var v="azer-type";function te(t,n={}){let e={[v]:t.azerType};for(let r of t.fields)Object.hasOwn(n,r.key)||(e[r.key]=typeof r.default=="string"?r.default:[...r.default]);return e}async function _(t,n,e,r,o){let s=e.trim();if(s==="")throw new Error("Note name is required");let l=`${r}/${s}.md`;if(t.fileExists(l))throw new Error(`A note already exists at ${l}`);t.folderExists(r)||await t.createFolder(r);let i=await t.createFile(l,o??n.bodyTemplate);return await t.processFrontmatter(i,c=>{Object.assign(c,te(n,c))}),await t.openFile(i),i}var x=require("obsidian");function F(t){let n=e=>{let r=t.vault.getAbstractFileByPath((0,x.normalizePath)(e));return r instanceof x.TFile?r:null};return{folderExists(e){return t.vault.getAbstractFileByPath((0,x.normalizePath)(e))instanceof x.TFolder},async createFolder(e){await t.vault.createFolder((0,x.normalizePath)(e))},fileExists(e){return n(e)!==null},async createFile(e,r){return{path:(await t.vault.create((0,x.normalizePath)(e),r)).path}},async processFrontmatter(e,r){let o=n(e.path);if(!o)throw new Error(`Missing file ${e.path}`);await t.fileManager.processFrontMatter(o,r)},async openFile(e){let r=n(e.path);r&&await t.workspace.getLeaf("tab").openFile(r)}}}var D=require("obsidian");var ne=require("obsidian"),Me=0;function P(t,n,e){let r=n.selected;return new ne.Setting(t).setName("Campaign").addText(o=>{o.setPlaceholder("Campaign (new or existing)").setValue(n.selected).onChange(i=>r=i);let s=`azer-campaigns-${Me++}`,l=t.createEl("datalist",{attr:{id:s}});for(let i of n.options)l.createEl("option",{value:i});o.inputEl.setAttribute("list",s),e&&o.inputEl.addEventListener("keydown",i=>{i.key==="Enter"&&e()})}),()=>r.trim()}function Oe(t){let n=t.indexOf("/");return n>0?t.slice(0,n):null}var re=(t,n)=>t.localeCompare(n,void 0,{sensitivity:"base"}),K=new Set;function M(t,n=K){let e=Oe(t);return e===null||n.has(e.toLowerCase())?"":e}function Ue(t,n=K){let e=new Set;for(let r of t){let o=M(r.path,n);o!==""&&e.add(o)}return[...e].sort(re)}function N(t,n){let e=G(t),r=G(n);return r===""?e:e===""?r:`${e}/${r}`}function G(t){return t.split("/").map(n=>n.trim()).filter(n=>n!==""&&n!=="."&&n!=="..").join("/")}var B="(Vault root)";function Ye(t,n,e=K){let r=n!==null?M(n,e):"",o=new Set(t);r!==""&&o.add(r);let s=[...o].filter(i=>i!==B).sort(re);return{options:[B,...s],selected:r!==""?r:B}}function R(t,n,e=K){return Ye(Ue(t,e),n,e)}function $(t){return t.trim()===B?"":G(t).split("/")[0]}function oe(t,n,e){return new Promise(r=>{new H(t,n,e,r).open()})}var H=class extends D.Modal{constructor(e,r,o,s){super(e);this.label=r;this.campaigns=o;this.done=s}value="";getCampaign=()=>"";resolved=!1;onOpen(){this.titleEl.setText(`New ${this.label}`),new D.Setting(this.contentEl).setName("Name").addText(e=>{e.setPlaceholder(`${this.label} name`).onChange(r=>this.value=r),e.inputEl.addEventListener("keydown",r=>{r.key==="Enter"&&this.submit()}),window.setTimeout(()=>e.inputEl.focus(),0)}),this.getCampaign=P(this.contentEl,this.campaigns,()=>this.submit()),new D.Setting(this.contentEl).addButton(e=>e.setButtonText("Create").setCta().onClick(()=>this.submit()))}submit(){if(this.resolved)return;let e=this.value.trim();e!==""&&(this.resolved=!0,this.close(),this.done({name:e,campaign:$(this.getCampaign())}))}onClose(){this.contentEl.empty(),this.resolved||this.done(null)}};var C=require("obsidian");var qe=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function se(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function Ve(t){return t.split("-").map(n=>n.charAt(0).toUpperCase()+n.slice(1)).join(" ")}function ie(t){let n=[],e=[];if(t==null)return{types:n,errors:e};if(!Array.isArray(t))return e.push("Custom types must be a YAML list of type entries."),{types:n,errors:e};let r=new Set;return t.forEach((o,s)=>{if(!se(o)){e.push(`Entry ${s+1}: must be a mapping with an id.`);return}let l=o.id;if(l==null){e.push(`Entry ${s+1}: id is required.`);return}if(typeof l!="string"||l.trim()===""){e.push(`Entry ${s+1}: id must be a non-empty string.`);return}let i=l.trim();if(!qe.test(i)){e.push(`${i}: id must be kebab-case (lowercase letters, digits, hyphens).`);return}if(r.has(i)){e.push(`${i}: duplicate id.`);return}r.add(i),o.label!==void 0&&typeof o.label!="string"&&e.push(`${i}: label must be a string.`),o.folder!==void 0&&typeof o.folder!="string"&&e.push(`${i}: folder must be a string.`),o.body!==void 0&&typeof o.body!="string"&&e.push(`${i}: body must be a string.`);let c=typeof o.label=="string"&&o.label.trim()!==""?o.label.trim():Ve(i),m=typeof o.folder=="string"&&o.folder.trim()!==""?o.folder.trim():i,a=typeof o.body=="string"?o.body:"",d=[],f=o.fields;if(f!==void 0)if(!Array.isArray(f))e.push(`${i}: fields must be a list.`);else{let y=new Set;f.forEach((p,h)=>{if(!se(p)||p.key===void 0||p.key===null){e.push(`${i}: field ${h+1} needs a key.`);return}if(typeof p.key!="string"||p.key.trim()===""){e.push(`${i}: field ${h+1} key must be a non-empty string.`);return}let b=p.key.trim();if(b===v){e.push(`${i}: field key "${v}" is reserved.`);return}if(y.has(b)){e.push(`${i}: duplicate field key "${b}".`);return}p.list!==void 0&&typeof p.list!="boolean"&&e.push(`${i}: field "${b}" list must be true or false.`),y.add(b),d.push({key:b,default:p.list===!0?[]:""})})}n.push({azerType:i,label:c,defaultFolder:m,fields:d,bodyTemplate:a})}),{types:n,errors:e}}var ae={azerType:"table",label:"Table",defaultFolder:"Tables",fields:[],bodyTemplate:"```azer-table\ndie: d20\nFirst result\nSecond result\n```\n"},Z=`# Azer note types \u2014 edit this file to add, change, or remove note types.
# Each entry needs a kebab-case \`id\`. Everything else is optional:
#   label   human name for the "New X" command   (default: Title-Cased id)
#   folder  default folder for new notes          (default: the id)
#   fields  frontmatter keys stamped on new notes; add \`list: true\` for a
#           list-valued field (default value []) instead of a string ("")
#   body    starter Markdown body
# Changes take effect after you reload Obsidian (or toggle the plugin off/on).

- id: npc
  label: NPC
  folder: NPCs
  fields:
    - key: role
    - key: species
    - key: location
    - key: dndb_stats
  body: |
    ## Appearance

    ## Character Details

    ## Motivations

    ## Secrets

    ## Items

    ## Connections

    ## Backlinks

    \`\`\`base
    filters:
      and:
        - file.hasLink(this.file)
    formulas:
      info: role + summary
      Azer_Type: note["azer-type"]
    views:
      - type: table
        name: Backlinks
        groupBy:
          property: formula.Azer_Type
          direction: DESC
        order:
          - file.name
          - formula.info
          - file.mtime
        sort:
          - property: formula.info
            direction: DESC
    \`\`\`

- id: session
  label: Session
  folder: Sessions
  fields:
    - key: date
    - key: npcs
      list: true
    - key: locations
      list: true
  body: |
    ## Overview

    ## Beats

    ## Encounters

    | Name | Intro | Experience | DnD Beyond Link |
    | --- | --- | --- | --- |
    |  |  |  |  |

    ## For the DM

    ## Follow Up

    ## Log

- id: adventure-log
  label: Adventure Log
  folder: Adventure Log
  fields:
    - key: date

- id: location
  label: Location
  folder: Locations
  fields:
    - key: summary
    - key: parent
  body: |
    ## Description

    ## Points of Interest

    ## Key NPCs

    ## Loot

    ## Backlinks

    \`\`\`base
    filters:
      and:
        - file.hasLink(this.file)
    formulas:
      info: role + summary
      Azer_Type: note["azer-type"]
    views:
      - type: table
        name: Backlinks
        groupBy:
          property: formula.Azer_Type
          direction: DESC
        order:
          - file.name
          - formula.info
          - file.mtime
        sort:
          - property: formula.info
            direction: DESC
    \`\`\`

- id: pc
  label: PC
  folder: PCs
  fields:
    - key: player
    - key: dndb_stats
  body: |
    ## Background

    ## Notes

    ## Backlinks

    \`\`\`base
    filters:
      and:
        - file.hasLink(this.file)
    formulas:
      info: role + summary
      Azer_Type: note["azer-type"]
    views:
      - type: table
        name: Backlinks
        groupBy:
          property: formula.Azer_Type
          direction: DESC
        order:
          - file.name
          - formula.info
          - file.mtime
        sort:
          - property: formula.info
            direction: DESC
    \`\`\`

- id: table
  label: Table
  folder: Tables
  body: |
    \`\`\`azer-table
    die: d20
    First result
    Second result
    \`\`\`
`;var S="azer.yaml";async function le(t){let n=(0,C.normalizePath)(S),e;try{let r=t.vault.getAbstractFileByPath(n);r instanceof C.TFile?e=await t.vault.read(r):(await t.vault.create(n,Z),e=Z)}catch(r){return{schemas:[],errors:[r instanceof Error?r.message:String(r)]}}try{let{types:r,errors:o}=ie((0,C.parseYaml)(e));return{schemas:r,errors:o}}catch(r){return{schemas:[],errors:[r instanceof Error?r.message:String(r)]}}}var A=require("obsidian");var E={model:"claude-opus-4-8",maxTokens:4096,recapsFolder:"Recaps"};function W(t){let n=t??{};return{model:ce(n.model),maxTokens:de(n.maxTokens),recapsFolder:me(n.recapsFolder)}}var X={model:ce,maxTokens:de,recapsFolder:me};function pe(t,n){return typeof t!="string"?n:t.trim()||n}function ce(t){return pe(t,E.model)}function de(t){let n=typeof t=="string"?Number.parseInt(t,10):typeof t=="number"?Math.trunc(t):Number.NaN;return Number.isFinite(n)&&n>=1?n:E.maxTokens}function me(t){return pe(t,E.recapsFolder)}function ue(t){let n=new Set;for(let e of t){let r=e.split("/")[0].trim().toLowerCase();r&&n.add(r)}return n}var fe="azer:anthropic-api-key";function L(t){return t.loadLocalStorage(fe)??""}function ge(t,n){let e=n.trim();t.saveLocalStorage(fe,e===""?null:e)}function ye(t){return Object.hasOwn(X,t)}var g={apiKey:{name:"Anthropic API key",desc:"Stored only on this device; set it on each machine. Used by the AI table and recap commands."},model:{name:"Model",desc:"Anthropic model for AI features."},maxTokens:{name:"Max tokens",desc:"Maximum output tokens per AI request."},recapsFolder:{name:"Recaps folder",desc:"Folder where AI-generated recap notes are saved."},advanced:"Advanced",noteTypes:{name:"Note types",desc:`Note types and their templates are defined in ${S} at your vault root. Edit that file and reload Obsidian to apply changes.`}},O=class extends A.PluginSettingTab{constructor(e,r){super(e,r);this.plugin=r}getSettingDefinitions(){return[{...g.apiKey,aliases:["claude","anthropic"],render:e=>this.renderApiKeyControl(e)},{...g.model,control:{type:"text",key:"model",placeholder:E.model}},{...g.maxTokens,control:{type:"number",key:"maxTokens",min:1,step:1,defaultValue:E.maxTokens}},{...g.recapsFolder,control:{type:"text",key:"recapsFolder",placeholder:E.recapsFolder}},{type:"group",heading:g.advanced,items:[{...g.noteTypes,render:e=>void e.setDesc(this.noteTypesDesc())}]}]}getControlValue(e){return ye(e)?this.plugin.settings[e]:void 0}async setControlValue(e,r){ye(e)&&(this.applySetting(e,r),await this.plugin.saveSettings())}applySetting(e,r){this.plugin.settings[e]=X[e](r)}renderApiKeyControl(e){e.addText(r=>{r.inputEl.type="password",r.setPlaceholder("sk-ant-...").setValue(L(this.app)).onChange(o=>ge(this.app,o))})}noteTypesDesc(){let e=new DocumentFragment;return e.appendText("Note types and their templates are defined in "),e.createEl("a",{text:S,href:"#"}).addEventListener("click",o=>{o.preventDefault(),this.plugin.openConfigFile()}),e.appendText(" at your vault root. Edit that file and reload Obsidian to apply changes."),e}display(){let{containerEl:e}=this;e.empty(),this.renderApiKeyControl(new A.Setting(e).setName(g.apiKey.name).setDesc(g.apiKey.desc)),new A.Setting(e).setName(g.model.name).setDesc(g.model.desc).addText(r=>r.setValue(this.plugin.settings.model).onChange(async o=>{await this.setControlValue("model",o)})),new A.Setting(e).setName(g.maxTokens.name).setDesc(g.maxTokens.desc).addText(r=>r.setValue(String(this.plugin.settings.maxTokens)).onChange(async o=>{await this.setControlValue("maxTokens",o)})),new A.Setting(e).setName(g.recapsFolder.name).setDesc(g.recapsFolder.desc).addText(r=>r.setValue(this.plugin.settings.recapsFolder).onChange(async o=>{await this.setControlValue("recapsFolder",o)})),new A.Setting(e).setName(g.advanced).setHeading(),new A.Setting(e).setName(g.noteTypes.name).setDesc(this.noteTypesDesc())}};var q=require("obsidian");function U(t,n){let e=n.length;if(e===0)return{ok:!1,error:"This table has no entries."};if(t<e)return{ok:!1,error:`A d${t} has only ${t} faces but this table has ${e} entries \u2014 use a larger die.`};let r=n.reduce((a,d)=>a+d,0),o=t-e,s=n.map(a=>Math.floor(o*a/r)),l=o-s.reduce((a,d)=>a+d,0),i=n.map((a,d)=>({i:d,rem:o*a%r})).sort((a,d)=>d.rem-a.rem||d.i-a.i);for(let a=0;a<l;a++)s[i[a].i]+=1;let c=[],m=1;for(let a of s){let d=a+1;c.push({start:m,end:m+d-1}),m+=d}return{ok:!0,ranges:c}}function je(t,n){let e=[1];for(let r=0;r<t;r++){let o=new Array(e.length+n-1).fill(0);for(let s=0;s<e.length;s++)for(let l=1;l<=n;l++)o[s+l-1]+=e[s];e=o}return e}function Y(t,n,e){let r=e.length;if(r===0)return{ok:!1,error:"This table has no entries."};let o=je(t,n),s=o.length;if(s<r)return{ok:!1,error:`A ${t}d${n} has only ${s} possible results but this table has ${r} entries \u2014 use fewer entries or a wider pool.`};let l=o.reduce((p,h)=>p+h,0),i=e.reduce((p,h)=>p+h,0),c=[],m=0;for(let p of o)c.push(m+=p);let a=t,d=[],f=-1,y=0;for(let p=0;p<r;p++){y+=e[p];let h;if(p===r-1)h=s-1;else{let b=l*y/i,T=f+1;for(;T<s-1&&c[T]<b;)T++;T>f+1&&b-c[T-1]<=c[T]-b&&(T-=1);let De=s-1-(r-1-p);h=Math.min(T,De)}d.push({start:a+f+1,end:a+h}),f=h}return{ok:!0,ranges:d}}function he(t,n){let e=r=>n?String(r).padStart(2,"0"):String(r);return t.start===t.end?e(t.start):`${e(t.start)}\u2013${e(t.end)}`}var J=[4,6,8,10,12,20,100],Ge={n:1,m:20},He=/^\s*die\s*:(.*)$/i,Ze=/^(\d*)d(\d+)$/,We=/^(\d+)x\s+(.+)$/,Xe=100;function Je(t){let n=t.match(Ze);if(!n)return null;let e=n[1]===""?1:Number(n[1]),r=Number(n[2]);return!Number.isSafeInteger(e)||e<1||e>Xe||!J.includes(r)?null:{n:e,m:r}}function z(t){let n=[],e=[];for(let o of t.split(/\r?\n/)){if(o.trim()==="")continue;let s=o.match(He);if(s){n.push(s[1].trim().toLowerCase());continue}let l=o.match(We),i=l?Number(l[1]):NaN;l&&Number.isSafeInteger(i)&&i>=1?e.push({weight:i,text:l[2].trim()}):e.push({weight:1,text:o.trim()})}if(n.length>1)return{ok:!1,error:"This table declares more than one `die:` \u2014 keep exactly one."};let r=Ge;if(n.length===1){let o=Je(n[0]);if(!o)return{ok:!1,error:`Unknown die '${n[0]}'. Use a single die (d4, d6, d8, d10, d12, d20, d100) or a pool (e.g. 2d6).`};r=o}return e.length===0?{ok:!1,error:"This table has no entries."}:{ok:!0,table:{die:r,entries:e}}}function ke(t){let n=z(t);if(!n.ok)return be(n.error);let{die:e,entries:r}=n.table,o=r.map(m=>m.weight),s=e.n===1?U(e.m,o):Y(e.n,e.m,o);if(!s.ok)return be(s.error);let l=e.n===1?`d${e.m}`:`${e.n}d${e.m}`,i=e.n===1&&e.m===100,c=r.map((m,a)=>`| ${he(s.ranges[a],i)} | ${Qe(m.text)} |`);return[`| Roll (${l}) | Result |`,"| --- | --- |",...c].join(`
`)}function be(t){return`> [!warning] Azer table
> ${t}`}function Qe(t){return t.replace(/\|/g,"\\|")}function we(t){t.registerMarkdownCodeBlockProcessor("azer-table",(n,e,r)=>{let o=new q.MarkdownRenderChild(e);return r.addChild(o),q.MarkdownRenderer.render(t.app,ke(n),e,r.sourcePath,o)})}var u=require("obsidian");var et="https://api.anthropic.com/v1/messages",tt="2023-06-01";function xe(t){return{url:et,method:"POST",headers:{"x-api-key":t.apiKey,"anthropic-version":tt,"content-type":"application/json"},body:JSON.stringify({model:t.model,max_tokens:t.maxTokens,system:t.system,messages:[{role:"user",content:t.user}],thinking:{type:"adaptive"}}),throw:!1}}function Ae(t){let n=t?.content;return Array.isArray(n)?n.filter(e=>typeof e=="object"&&e!==null&&e.type==="text"&&typeof e.text=="string").map(e=>e.text).join("").trim():""}var k=class extends Error{};async function Te(t,n){let e;try{e=await t(xe(n))}catch(o){let s=o instanceof Error?o.message:String(o);throw new k(`Network error: ${s}`,{cause:o})}if(e.status<200||e.status>=300)throw new k(`Anthropic API ${e.status}: ${nt(e.json)}`);let r=Ae(e.json);if(!r)throw new k("Empty response from the model.");return r}function nt(t){let n=t?.error?.message;return typeof n=="string"?n:"request failed"}var ve=`You generate Dungeons & Dragons random tables in a specific text format.
Output ONLY the table body \u2014 no code fences, no numbering, no preamble, no commentary, no blank lines.
Format:
- The FIRST line must be \`die: dN\` (a single die) or \`die: KdN\` (a pool of K dice, e.g. \`2d6\`, \`3d10\`), where N is one of 4, 6, 8, 10, 12, 20, 100.
- Then one outcome per line.
- Use a die (or pool) with at least as many possible results as outcomes: a single dN has N results; a pool KdN has K*(N-1)+1 (e.g. 2d6 has 11).
- Prefix an outcome with \`Nx \` (e.g. \`3x Bandits\`) to make it N times more likely; leave rare results unprefixed.
- Use [[wikilinks]] for places or NPCs when natural.
Example:
die: d8
3x Goblin scouts
2x A wolf pack
A [[Redbrand]] patrol
An abandoned cart
A lost child
Nothing`;function Ee(t){return"```azer-table\n"+t.trim()+"\n```\n"}function rt(t){let n=t.trim(),e=n.match(/^```[^\r\n]*\r?\n([\s\S]*?)\r?\n```$/);return(e?e[1]:n).trim()}function ot(t,n){if(t>=n)return t;for(let e of J)if(e>=n)return e;return null}function st(t,n){let e=n.map(o=>o.weight>1?`${o.weight}x ${o.text}`:/^\d+x\s/.test(o.text)?`1x ${o.text}`:o.text);return`die: ${t.n===1?`d${t.m}`:`${t.n}d${t.m}`}
${e.join(`
`)}`}function it(t){return t.n*(t.m-1)+1}function Se(t){let n=z(rt(t));if(!n.ok)return{ok:!1,error:n.error};let e=n.table.die,r=n.table.entries.length,o;if(e.n>1&&it(e)>=r)o=e;else{let a=ot(e.m,r);if(a===null)return{ok:!1,error:`too many entries (${r}) for the largest die (d100)`};o={n:1,m:a}}let s=st(o,n.table.entries),l=z(s);if(!l.ok)return{ok:!1,error:l.error};let i=l.table.die,c=l.table.entries.map(a=>a.weight),m=i.n===1?U(i.m,c):Y(i.n,i.m,c);return m.ok?{ok:!0,body:s}:{ok:!1,error:m.error}}async function Ce(t,n){let e=`Generate a random table about: ${n}`,r=Se(await t(ve,e));if(r.ok)return r.body;let o=`${e}

The previous output was invalid: ${r.error}. Return a corrected table body, nothing else.`,s=Se(await t(ve,o));if(s.ok)return s.body;throw new k(`The model returned an invalid table twice. Last error: ${s.error}`)}var at=`You summarize Dungeons & Dragons session notes into a concise bulleted key-events reference for the DM.
Use ONLY the session notes provided in the user message. Summarize exactly the sessions given \u2014 never invent, infer, or add sessions, events, NPCs, locations, items, or outcomes that are not explicitly written in those notes. If a note is brief, keep its summary brief. Do not use any outside knowledge of published Dungeons & Dragons adventures, even if the notes resemble one.
For the content that is present, capture what happened, decisions made, and open threads, as Markdown bullet points. No preamble.`;function lt(t){return t.map(n=>`## ${n.title} (${n.date})

${n.body}`).join(`

---

`)}async function Fe(t,n){let e=`Summarize these ${n.length} session note(s) using only what is written below. Do not add anything that is not present.

${lt(n)}`;return t(at,e)}function Pe(t,n,e){return t.filter(r=>M(r.path,e)===n)}function Ne(t,n){return n<=0?[]:[...t].sort((r,o)=>r.date<o.date?-1:r.date>o.date?1:0).slice(-n)}function Re(t){let n=t.replace(/^\uFEFF/,"").replace(/\r\n/g,`
`).split(`
`),e=0;for(;e<n.length&&n[e].trim()==="";)e++;if(n[e]!=="---")return t;let r=n.indexOf("---",e+1);return r===-1?t:n.slice(r+1).join(`
`).trimStart()}function I(t){let n=[];for(let e of t.vault.getMarkdownFiles())typeof t.metadataCache.getFileCache(e)?.frontmatter?.[v]=="string"&&n.push({path:e.path});return{refs:n,activePath:t.workspace.getActiveFile()?.path??null}}async function pt(t){let n=await(0,u.requestUrl)(t),e=null;try{e=n.json}catch{e=null}return{status:n.status,json:e}}function $e(t){let n=(r,o)=>Te(pt,{apiKey:L(t.app),model:t.settings.model,system:r,user:o,maxTokens:t.settings.maxTokens}),e=()=>L(t.app).trim()===""?(new u.Notice("Set your Anthropic API key in Azer settings to use AI features."),!1):!0;t.addCommand({id:"generate-table",name:"Generate table (AI)",callback:()=>{if(!e())return;let{refs:r,activePath:o}=I(t.app),s=R(r,o,t.folderExclusions());mt(t.app,s,async({name:l,prompt:i,campaign:c})=>{let m=new u.Notice("Generating table\u2026",0);try{let a=Ee(await Ce(n,i)),d=F(t.app),f=t.tableSchema(),y=N(c,f.defaultFolder);await _(d,f,l,y,a)}catch(a){new u.Notice(a instanceof k?a.message:String(a))}finally{m.hide()}})}}),t.addCommand({id:"recap-sessions",name:"Recap recent sessions (AI)",callback:()=>{if(!e())return;let{refs:r,activePath:o}=I(t.app),s=t.folderExclusions(),l=R(r,o,s);ut(t.app,l,async({count:i,campaign:c})=>{let m=await dt(t.app),a=Ne(Pe(m,c,s),i);if(a.length===0){new u.Notice("No Adventure Log notes found to recap.");return}let d=new u.Notice("Generating recap\u2026",0);try{let f=await Fe(n,a),y=F(t.app),p=N(c,t.settings.recapsFolder);y.folderExists(p)||await y.createFolder(p);let h=`Recap ${a[0].date} to ${a[a.length-1].date}`,b=await y.createFile(ct(y,p,h),f);await y.openFile(b)}catch(f){new u.Notice(f instanceof k?f.message:String(f))}finally{d.hide()}})}})}function ct(t,n,e){let r=`${n}/${e}.md`;for(let o=2;t.fileExists(r);o++)r=`${n}/${e} ${o}.md`;return r}async function dt(t){let n=[];for(let e of t.vault.getMarkdownFiles()){let r=t.metadataCache.getFileCache(e)?.frontmatter;if(r?.[v]!=="adventure-log")continue;let o=await t.vault.cachedRead(e);n.push({title:e.basename,date:typeof r.date=="string"?r.date:"",body:Re(o),path:e.path})}return n}function mt(t,n,e){new Q(t,n,e).open()}var Q=class extends u.Modal{constructor(e,r,o){super(e);this.campaigns=r;this.done=o}name="";prompt="";getCampaign=()=>"";onOpen(){this.titleEl.setText("Generate table (AI)"),new u.Setting(this.contentEl).setName("Table name").addText(e=>{e.onChange(r=>this.name=r),window.setTimeout(()=>e.inputEl.focus(),0)}),new u.Setting(this.contentEl).setName("Describe the table").addTextArea(e=>e.onChange(r=>this.prompt=r)),this.getCampaign=P(this.contentEl,this.campaigns),new u.Setting(this.contentEl).addButton(e=>e.setButtonText("Generate").setCta().onClick(()=>{this.name.trim()===""||this.prompt.trim()===""||(this.close(),this.done({name:this.name.trim(),prompt:this.prompt.trim(),campaign:$(this.getCampaign())}))}))}onClose(){this.contentEl.empty()}};function ut(t,n,e){new ee(t,n,e).open()}var ee=class extends u.Modal{constructor(e,r,o){super(e);this.campaigns=r;this.done=o}count=3;getCampaign=()=>"";onOpen(){this.titleEl.setText("Recap recent sessions (AI)"),new u.Setting(this.contentEl).setName("How many recent sessions?").addText(e=>{e.setValue(String(this.count)).onChange(r=>{let o=Number.parseInt(r,10);Number.isFinite(o)&&o>=1&&(this.count=o)}),window.setTimeout(()=>e.inputEl.focus(),0)}),this.getCampaign=P(this.contentEl,this.campaigns),new u.Setting(this.contentEl).addButton(e=>e.setButtonText("Recap").setCta().onClick(()=>{this.close(),this.done({count:this.count,campaign:$(this.getCampaign())})}))}onClose(){this.contentEl.empty()}};var ft=`\`\`\`base
filters:
  and:
    - file.hasLink(this.file)
formulas:
  info: role + summary
  Azer_Type: note["azer-type"]
views:
  - type: table
    name: Backlinks
    groupBy:
      property: formula.Azer_Type
      direction: DESC
    order:
      - file.name
      - formula.info
      - file.mtime
    sort:
      - property: formula.info
        direction: DESC
\`\`\`
`,V=class extends w.Plugin{settings=W(null);schemas=[];ports;async onload(){await this.loadSettings(),this.ports=F(this.app),we(this),$e(this),this.addCommand({id:"insert-backlinks-table",name:"Insert backlinks table",editorCallback:n=>n.replaceSelection(ft)}),this.addSettingTab(new O(this.app,this)),this.app.workspace.onLayoutReady(()=>void this.registerNoteTypes())}async registerNoteTypes(){let{schemas:n,errors:e}=await le(this.app);if(this.schemas=n,e.length>0){console.warn(`Azer: ${e.length} issue(s) in azer.yaml:`,e);let r=new DocumentFragment;r.appendText(`Azer: ${e.length} issue(s) in `),r.createEl("a",{text:S,href:"#"}).addEventListener("click",s=>{s.preventDefault(),this.openConfigFile()}),r.appendText(" \u2014 open it to fix (details in the developer console)."),new w.Notice(r,15e3)}for(let r of this.schemas)this.addCommand({id:`new-${r.azerType}`,name:`New ${r.label}`,callback:()=>void this.newNote(r)})}async openConfigFile(){let n=this.app.vault.getAbstractFileByPath((0,w.normalizePath)(S));n instanceof w.TFile?await this.app.workspace.getLeaf("tab").openFile(n):new w.Notice(`${S} not found in this vault.`)}tableSchema(){return this.schemas.find(n=>n.azerType==="table")??ae}folderExclusions(){return ue([...this.schemas.map(n=>n.defaultFolder),this.tableSchema().defaultFolder,this.settings.recapsFolder])}async newNote(n){let{refs:e,activePath:r}=I(this.app),o=R(e,r,this.folderExclusions());try{let s=await oe(this.app,n.label,o);if(!s)return;let l=N(s.campaign,n.defaultFolder);await _(this.ports,n,s.name,l)}catch(s){new w.Notice(s instanceof Error?s.message:String(s))}}async loadSettings(){this.settings=W(await this.loadData())}async saveSettings(){await this.saveData(this.settings)}};
