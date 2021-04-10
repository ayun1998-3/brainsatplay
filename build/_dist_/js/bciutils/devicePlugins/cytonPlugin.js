var v=Object.defineProperty;var h=(c,t,s)=>(typeof t!="symbol"&&(t+=""),t in c?v(c,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):c[t]=s);var u=(c,t,s)=>new Promise((l,n)=>{var g=a=>{try{e(s.next(a))}catch(d){n(d)}},r=a=>{try{e(s.throw(a))}catch(d){n(d)}},e=a=>a.done?l(a.value):Promise.resolve(a.value).then(g,r);e((s=s.apply(c,t)).next())});import{DataAtlas as C}from"../DataAtlas.js";import{cyton as y}from"./cyton.js";import{BiquadChannelFilterer as p}from"../signal_analysis/BiquadFilters.js";import{DOMFragment as E}from"../../frontend/utils/DOMFragment.js";export class cytonPlugin{constructor(t="cyton_daisy",s=this.onconnect,l=this.ondisconnect){h(this,"init",(t,s)=>{t.sps=250,t.deviceType="eeg";let l=e=>{let a=this.device.getLatestData("A"+o.ch,e),d=new Array(a.length).fill(0);if(o.tag!=="other"&&t.useFilters===!0){if(this.filters.forEach((i,z)=>{i.channel===o.ch&&a.forEach((f,m)=>{d[m]=i.apply(f)})}),this.info.useAtlas===!0){let i;o.tag!==null?i=this.atlas.getEEGDataByTag(o.tag):i=this.atlas.getEEGDataByChannel(o.ch),i.count+=e,i.times.push(...this.device.data.ms.slice(this.device.data.count-e,this.device.data.count)),i.filtered.push(...d),i.raw.push(...a)}}else if(this.info.useAtlas===!0){let i=this.atlas.getEEGDataByChannel(o.ch);i.count+=e,i.times.push(...this.device.data.ms.slice(this.device.data.count-e,this.device.data.count)),i.raw.push(...a)}},n=()=>{},g=()=>{},r=[];if(this.mode.indexOf("daisy")>-1?(r=[{ch:4,tag:"FP2",analyze:!0},{ch:24,tag:"FP1",analyze:!0},{ch:8,tag:"other",analyze:!1}],this.device=new y(l,n,g,"daisy")):(r=[{ch:4,tag:"FP2",analyze:!0},{ch:24,tag:"FP1",analyze:!0},{ch:8,tag:"other",analyze:!1}],this.device=new y(l,n,g,"single")),t.useFilters===!0&&r.forEach((e,a)=>{e.tag!=="other"?this.filters.push(new p(e.ch,t.sps,!0,this.device.uVperStep)):this.filters.push(new p(e.ch,t.sps,!1,this.device.uVperStep))}),t.eegChannelTags=r,s===!0){let e="10_20";this.atlas=new C(location+":"+this.mode,{eegshared:{eegChannelTags:t.eegChannelTags,sps:t.sps}},e,!0,!0,t.analysis),t.useAtlas=!0}else typeof s=="object"&&(this.atlas=s,this.atlas.data.eegshared.eegChannelTags=t.eegChannelTags,this.atlas.data.eegshared.sps=t.sps,this.atlas.data.eegshared.frequencies=this.atlas.bandpassWindow(0,128,t.sps*.5),this.atlas.data.eegshared.bandFreqs=this.atlas.getBandFreqs(this.atlas.data.eegshared.frequencies),this.atlas.data.eeg=this.atlas.gen10_20Atlas(),this.atlas.data.coherence=this.atlas.genCoherenceMap(t.eegChannelTags),this.atlas.data.eegshared.eegChannelTags.forEach((e,a)=>{this.atlas.getEEGDataByTag(e.tag)===void 0&&this.atlas.addEEGCoord(e.ch)}),this.atlas.settings.coherence=!0,this.atlas.settings.eeg=!0,t.useAtlas=!0,t.analysis.length>0&&(this.atlas.settings.analysis.push(...t.analysis),this.atlas.settings.analyzing||(this.atlas.settings.analyzing=!0,this.atlas.analyzer())))});h(this,"connect",()=>u(this,null,function*(){yield this.device.setupSerialAsync()}));h(this,"disconnect",()=>{this.device.closePort()});h(this,"onconnect",()=>{});h(this,"ondisconnect",()=>{});h(this,"addControls",(t=document.body)=>{let s=Math.floor(Math.random()*1e4),l=()=>`
            `,n=()=>{};this.ui=new E(l,t,void 0,n)});this.atlas=null,this.mode=t,this.device=null,this.filters=[]}}