var c=Object.defineProperty;var n=(i,t,o)=>(typeof t!="symbol"&&(t+=""),t in i?c(i,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):i[t]=o);import{DOMFragment as a}from"../../frontend/utils/DOMFragment.js";import"../dataAtlas.js";import"../signal_analysis/BiquadFilters.js";export class devicePlugin{constructor(t,o=this.onconnect,e=this.ondisconnect){n(this,"init",(t,o)=>{});n(this,"connect",()=>{this.onconnect()});n(this,"disconnect",()=>{this.ondisconnect()});n(this,"onconnect",()=>{});n(this,"ondisconnect",()=>{});n(this,"addControls",(t=document.body)=>{let o=Math.floor(Math.random()*1e4),e=()=>`
            `,s=()=>{};this.ui=new a(e,t,void 0,s)});this.atlas=null,this.mode=t,this.device=null,this.filters=[],this.onconnect=o,this.ondisconnect=e}}