var p=Object.defineProperty;var h=(i,e,s)=>(typeof e!="symbol"&&(e+=""),e in i?p(i,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):i[e]=s);var d=(i,e,s)=>new Promise((a,l)=>{var c=t=>{try{r(s.next(t))}catch(g){l(g)}},n=t=>{try{r(s.throw(t))}catch(g){l(g)}},r=t=>t.done?a(t.value):Promise.resolve(t.value).then(c,n);r((s=s.apply(i,e)).next())});import{eeg32 as m}from"../eeg32.js";import{BiquadChannelFilterer as u}from"../signal_analysis/BiquadFilters.js";import{DataAtlas as f}from"../DataAtlas.js";import{DOMFragment as C}from"../../frontend/utils/DOMFragment.js";export class eeg32Plugin{constructor(e="freeeeg32_2",s=this.onconnect,a=this.ondisconnect){h(this,"init",(e,s)=>{if(e.sps=512,e.deviceType="eeg",this.mode==="freeeeg32_2"?e.eegChannelTags=[{ch:4,tag:"FP2",analyze:!0},{ch:24,tag:"FP1",analyze:!0},{ch:8,tag:"other",analyze:!1}]:this.mode==="freeeeg32_19"?e.eegChannelTags=[{ch:4,tag:"FP2",analyze:!0},{ch:24,tag:"FP1",analyze:!0},{ch:8,tag:"other",analyze:!1}]:e.eegChannelTags=[{ch:4,tag:"FP2",analyze:!0},{ch:24,tag:"FP1",analyze:!0},{ch:8,tag:"other",analyze:!1}],this.device=new m(a=>{this.atlas.data.eegshared.eegChannelTags.forEach((l,c)=>{let n=this.device.getLatestData("A"+l.ch,a),r=new Array(n.length).fill(0);if(l.tag!=="other"&&e.useFilters===!0){if(this.filters.forEach((t,g)=>{t.channel===l.ch&&n.forEach((o,y)=>{r[y]=t.apply(o)})}),e.useAtlas===!0){let t;l.tag!==null?t=this.atlas.getEEGDataByTag(l.tag):t=this.atlas.getEEGDataByChannel(l.ch),t.count+=a,t.times.push(...this.device.data.ms.slice(this.device.data.count-a,this.device.data.count)),t.filtered.push(...r),t.raw.push(...n)}}else if(e.useAtlas===!0){let t=this.atlas.getEEGDataByChannel(l.ch);t.count+=a,t.times.push(...this.device.data.ms.slice(this.device.data.count-a,this.device.data.count)),t.raw.push(...n)}})},()=>{e.useAtlas===!0&&(this.atlas.data.eegshared.startTime=Date.now(),this.atlas.settings.analyzing!==!0&&e.analysis.length>0&&(this.atlas.settings.analyzing=!0,setTimeout(()=>{this.atlas.analyzer()},1200)),this.onconnect())},()=>{this.atlas.settings.analyzing=!1,this.ondisconnect()}),e.useFilters===!0&&e.eegChannelTags.forEach((a,l)=>{a.tag!=="other"?this.filters.push(new u(a.ch,e.sps,!0,this.device.uVperStep)):this.filters.push(new u(a.ch,e.sps,!1,this.device.uVperStep))}),s===!0){let a="10_20";this.atlas=new f(location+":"+this.mode,{eegshared:{eegChannelTags:e.eegChannelTags,sps:e.sps}},a,!0,!0,e.analysis),e.useAtlas=!0}else typeof s=="object"&&(this.atlas=s,this.atlas.data.eegshared.eegChannelTags=e.eegChannelTags,this.atlas.data.eegshared.sps=e.sps,this.atlas.data.eegshared.frequencies=this.atlas.bandpassWindow(0,128,e.sps*.5),this.atlas.data.eegshared.bandFreqs=this.atlas.getBandFreqs(this.atlas.data.eegshared.frequencies),this.atlas.data.eeg=this.atlas.gen10_20Atlas(),this.atlas.data.coherence=this.atlas.genCoherenceMap(e.eegChannelTags),this.atlas.data.eegshared.eegChannelTags.forEach((a,l)=>{this.atlas.getEEGDataByTag(a.tag)===void 0&&this.atlas.addEEGCoord(a.ch)}),this.atlas.settings.coherence=!0,this.atlas.settings.eeg=!0,e.useAtlas=!0,e.analysis.length>0&&(this.atlas.settings.analysis.push(...e.analysis),this.atlas.settings.analyzing||(this.atlas.settings.analyzing=!0,this.atlas.analyzer())))});h(this,"connect",()=>d(this,null,function*(){yield this.device.setupSerialAsync()}));h(this,"disconnect",()=>{this.device.closePort()});h(this,"onconnect",()=>{});h(this,"ondisconnect",()=>{});h(this,"addControls",(e=document.body)=>{let s=Math.floor(Math.random()*1e4),a=()=>`
            `,l=()=>{};this.ui=new C(a,e,void 0,l)});this.atlas=null,this.mode=e,this.device=null,this.filters=[],this.onconnect=s,this.ondisconnect=a}}