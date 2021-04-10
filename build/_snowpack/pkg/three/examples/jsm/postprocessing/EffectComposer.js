import{V as d,W as _,az as b,dq as w,dB as v,L as l,r as R,b as S}from"../../../../common/three.module-f256b224.js";import{C as u}from"../../../../common/CopyShader-c0a4c94f.js";import{S as p}from"../../../../common/ShaderPass-0dccb253.js";import{P as h}from"../../../../common/Pass-35d0974f.js";var n=function(e,t){h.call(this),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1};n.prototype=Object.assign(Object.create(h.prototype),{constructor:n,render:function(e,t,r){var s=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);var f,a;this.inverse?(f=0,a=1):(f=1,a=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),i.buffers.stencil.setFunc(s.ALWAYS,f,4294967295),i.buffers.stencil.setClear(a),i.buffers.stencil.setLocked(!0),e.setRenderTarget(r),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(s.EQUAL,1,4294967295),i.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),i.buffers.stencil.setLocked(!0)}});var o=function(){h.call(this),this.needsSwap=!1};o.prototype=Object.create(h.prototype),Object.assign(o.prototype,{render:function(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}});var m=function(e,t){if(this.renderer=e,t===void 0){var r={minFilter:l,magFilter:l,format:R},s=e.getSize(new d);this._pixelRatio=e.getPixelRatio(),this._width=s.width,this._height=s.height,t=new _(this._width*this._pixelRatio,this._height*this._pixelRatio,r),t.texture.name="EffectComposer.rt1"}else this._pixelRatio=1,this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],u===void 0&&console.error("THREE.EffectComposer relies on CopyShader"),p===void 0&&console.error("THREE.EffectComposer relies on ShaderPass"),this.copyPass=new p(u),this.clock=new b};Object.assign(m.prototype,{swapBuffers:function(){var e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e},addPass:function(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)},insertPass:function(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)},removePass:function(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)},isLastEnabledPass:function(e){for(var t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0},render:function(e){e===void 0&&(e=this.clock.getDelta());var t=this.renderer.getRenderTarget(),r=!1,s,i,f=this.passes.length;for(i=0;i<f;i++)if(s=this.passes[i],s.enabled!==!1){if(s.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),s.render(this.renderer,this.writeBuffer,this.readBuffer,e,r),s.needsSwap){if(r){var a=this.renderer.getContext(),c=this.renderer.state.buffers.stencil;c.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),c.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}n!==void 0&&(s instanceof n?r=!0:s instanceof o&&(r=!1))}this.renderer.setRenderTarget(t)},reset:function(e){if(e===void 0){var t=this.renderer.getSize(new d);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2},setSize:function(e,t){this._width=e,this._height=t;var r=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(r,s),this.renderTarget2.setSize(r,s);for(var i=0;i<this.passes.length;i++)this.passes[i].setSize(r,s)},setPixelRatio:function(e){this._pixelRatio=e,this.setSize(this._width,this._height)}});var g=function(){this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1};Object.assign(g.prototype,{setSize:function(){},render:function(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}}),g.FullScreenQuad=function(){var e=new w(-1,1,1,-1,0,1),t=new v(2,2),r=function(s){this._mesh=new S(t,s)};return Object.defineProperty(r.prototype,"material",{get:function(){return this._mesh.material},set:function(s){this._mesh.material=s}}),Object.assign(r.prototype,{dispose:function(){this._mesh.geometry.dispose()},render:function(s){s.render(this._mesh,e)}}),r}();export{m as EffectComposer};