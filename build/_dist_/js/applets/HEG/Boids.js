var l=Object.defineProperty;var a=(s,t,i)=>(typeof t!="symbol"&&(t+=""),t in s?l(s,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):s[t]=i);import{brainsatplay as h}from"../../brainsatplay.js";import{DOMFragment as o}from"../../frontend/utils/DOMFragment.js";import{Boids as d}from"../../frontend/UX/Particles.js";export class BoidsApplet{constructor(t=document.body,i=new h,e=[]){a(this,"updateLoop",()=>{if(this.looping){if(this.bci.atlas.settings.heg){let t=this.bci.atlas.data.heg[0].count;if(t>=2){let i=40;t<i&&(i=t);let e=this.bci.atlas.data.heg[0].ratio.slice(t-i),n=this.bci.atlas.data.heg[0].ratio[t-1]-this.mean(e);this.class.onData(n),this.draw()}}setTimeout(()=>{this.loop=requestAnimationFrame(this.updateLoop)},16)}});this.bci=i,this.parentNode=t,this.settings=e,this.AppletHTML=null,this.props={id:String(Math.floor(Math.random()*1e6))},this.class=null,this.looping=!1,this.loop=null}init(){let t=(e=this.props)=>`
            <div id=`+e.id+`>
                <div id='`+e.id+`menu' style='position:absolute; z-index:3; '>
                    <table id='`+e.id+`table' style='z-index:99;'>
                    </table>
                </div>
                <canvas id='`+e.id+`canvas' height='100%' width='100%' style='width:100%; height:100%;'></canvas>
            </div>
            `,i=(e=this.props)=>{document.getElementById(e.id)};this.AppletHTML=new o(t,this.parentNode,this.props,i,void 0,"NEVER"),this.settings.length>0&&this.configure(this.settings),this.class=new d(200,this.props.id+"canvas"),this.looping=!0,this.updateLoop()}deinit(){this.looping=!1,cancelAnimationFrame(this.loop),this.class.stop(),this.class=null,this.AppletHTML.deleteNode()}responsive(){let t=document.getElementById(this.props.id+"canvas");t.width=this.AppletHTML.node.clientWidth,t.height=this.AppletHTML.node.clientHeight,t.style.width=this.AppletHTML.node.clientWidth,t.style.height=this.AppletHTML.node.clientHeight}configure(t=[]){t.forEach((i,e)=>{})}}a(BoidsApplet,"devices",["heg"]);