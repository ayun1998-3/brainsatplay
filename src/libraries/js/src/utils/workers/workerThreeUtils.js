import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'


//this file imports a bunch of stuff so you can pass threejs functions

export class threeUtil {
    constructor(canvas,callbackManager) {

        this.callbackManager = callbackManager;

        this.THREE=THREE;
        this.canvas=canvas, //canvas.transferControlToOffscreen
        this.renderer=undefined,
        this.composer=undefined,
        this.gui=undefined,
        this.controls=undefined,
        this.camera=undefined,
        this.scene=undefined
        
        this.ANIMFRAMETIME = 0;

    }

    setup = () => { //setup three animation
        this.defaultSetup();
    }

    draw = () => { //frame draw function
        //do something
        this.defaultDraw();
        this.ANIMFRAMETIME = performance.now() - this.ANIMFRAMETIME;
        this.finished();
        this.ANIMFRAMETIME = performance.now();
    }

    finished = () => {
        let dict = {foo:'render',output:this.ANIMFRAMETIME,id:self.id};
        if(self.manager) {
            let emitevent = self.manager.checkEvents('render');
            if(emitevent) self.manager.events.emit('render',dict);
            else postMessage(dict);
        }
        else postMessage(dict);
    }

    clear = () => {
        this.defaultClear();
    }

    defaultSetup = () => {
        this.renderer = new THREE.WebGLRenderer( { canvas:this.canvas, antialias: true, alpha: true } );
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.width / this.canvas.height, 0.01, 1000);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.composer = new EffectComposer(this.renderer.renderTarget);

        this.renderer.setAnimationLoop(this.draw);
    }

    defaultDraw = () => {

    }

    defaultClear = () => {
        
        this.renderer.setAnimationLoop( null );
        this.scene = null;
        this.renderer.domElement = null;
        this.renderer = null;
    }

};

/////////////https://threejsfundamentals.org/threejs/lessons/threejs-offscreencanvas.html
export function init(data) {   /* eslint-disable-line no-unused-vars */
    const {canvas, inputElement} = data;
    const renderer = new THREE.WebGLRenderer({canvas});
  
    const fov = 75;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 4;
  
    const controls = new OrbitControls(camera, inputElement);
    controls.target.set(0, 0, 0);
    controls.update();
  
    const scene = new THREE.Scene();
  
    {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);
    }
  
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  
    function makeInstance(geometry, color, x) {
      const material = new THREE.MeshPhongMaterial({
        color,
      });
  
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
  
      cube.position.x = x;
  
      return cube;
    }
  
    const cubes = [
      makeInstance(geometry, 0x44aa88, 0),
      makeInstance(geometry, 0x8844aa, -2),
      makeInstance(geometry, 0xaa8844, 2),
    ];
  
    class PickHelper {
      constructor() {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
      }
      pick(normalizedPosition, scene, camera, time) {
        // restore the color if there is a picked object
        if (this.pickedObject) {
          this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
          this.pickedObject = undefined;
        }
  
        // cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
          // pick the first object. It's the closest one
          this.pickedObject = intersectedObjects[0].object;
          // save its color
          this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
          // set its emissive color to flashing red/yellow
          this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
        }
      }
    }
  
    const pickPosition = {x: -2, y: -2};
    const pickHelper = new PickHelper();
    clearPickPosition();
  
    function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = inputElement.clientWidth;
      const height = inputElement.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
      }
      return needResize;
    }
  
    function render(time) {
      time *= 0.001;
  
      if (resizeRendererToDisplaySize(renderer)) {
        camera.aspect = inputElement.clientWidth / inputElement.clientHeight;
        camera.updateProjectionMatrix();
      }
  
      cubes.forEach((cube, ndx) => {
        const speed = 1 + ndx * .1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
      });
  
      pickHelper.pick(pickPosition, scene, camera, time);
  
      renderer.render(scene, camera);
  
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  
    function getCanvasRelativePosition(event) {
      const rect = inputElement.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  
    function setPickPosition(event) {
      const pos = getCanvasRelativePosition(event);
      pickPosition.x = (pos.x / inputElement.clientWidth ) *  2 - 1;
      pickPosition.y = (pos.y / inputElement.clientHeight) * -2 + 1;  // note we flip Y
    }
  
    function clearPickPosition() {
      // unlike the mouse which always has a position
      // if the user stops touching the screen we want
      // to stop picking. For now we just pick a value
      // unlikely to pick something
      pickPosition.x = -100000;
      pickPosition.y = -100000;
    }
  
    inputElement.addEventListener('mousemove', setPickPosition);
    inputElement.addEventListener('mouseout', clearPickPosition);
    inputElement.addEventListener('mouseleave', clearPickPosition);
  
    inputElement.addEventListener('touchstart', (event) => {
      // prevent the window from scrolling
      event.preventDefault();
      setPickPosition(event.touches[0]);
    }, {passive: false});
  
    inputElement.addEventListener('touchmove', (event) => {
      setPickPosition(event.touches[0]);
    });
  
    inputElement.addEventListener('touchend', clearPickPosition);
  }
  
  
function noop() {
}





/////////////https://threejsfundamentals.org/threejs/lessons/threejs-offscreencanvas.html

class EventDispatcher {
	addEventListener( type, listener ) {
		if ( this._listeners === undefined ) this._listeners = {};
		const listeners = this._listeners;
		if ( listeners[ type ] === undefined ) {
			listeners[ type ] = [];
		}

		if ( listeners[ type ].indexOf( listener ) === - 1 ) {
			listeners[ type ].push( listener );
		}

	}

	hasEventListener( type, listener ) {
		if ( this._listeners === undefined ) return false;
		const listeners = this._listeners;
		return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;
	}

	removeEventListener( type, listener ) {
		if ( this._listeners === undefined ) return;
		const listeners = this._listeners;
		const listenerArray = listeners[ type ];
		if ( listenerArray !== undefined ) {
			const index = listenerArray.indexOf( listener );
			if ( index !== - 1 ) {
				listenerArray.splice( index, 1 );
			}
		}
	}

	dispatchEvent( event ) {
		if ( this._listeners === undefined ) return;
		const listeners = this._listeners;
		const listenerArray = listeners[ event.type ];
		if ( listenerArray !== undefined ) {
			event.target = this;
			// Make a copy, in case listeners are removed while iterating.
			const array = listenerArray.slice( 0 );
			for ( let i = 0, l = array.length; i < l; i ++ ) {
				array[ i ].call( this, event );
			}
			event.target = null;
		}
	}
}

/////////////https://threejsfundamentals.org/threejs/lessons/threejs-offscreencanvas.html
class ElementProxyReceiver extends EventDispatcher {
    constructor() {
        super();
        // because OrbitControls try to set style.touchAction;
        this.style = {};
    }
    get clientWidth() {
        return this.width;
    }
    get clientHeight() {
        return this.height;
    }
    // OrbitControls call these as of r132. Maybe we should implement them
    setPointerCapture() {}
    releasePointerCapture() {}
    getBoundingClientRect() {
        return {
            left: this.left,
            top: this.top,
            width: this.width,
            height: this.height,
            right: this.left + this.width,
            bottom: this.top + this.height,
        };
    }
    handleEvent(data) {
        if (data.type === 'size') {
            this.left = data.left;
            this.top = data.top;
            this.width = data.width;
            this.height = data.height;
            return;
        }
        data.preventDefault = noop;
        data.stopPropagation = noop;
        this.dispatchEvent(data);
    }
    focus() {}
}

/////////////https://threejsfundamentals.org/threejs/lessons/threejs-offscreencanvas.html
class ProxyManager {
    constructor() {
        this.targets = {};
        this.handleEvent = this.handleEvent.bind(this);
    }
    makeProxy(data) {
        const {id} = data;
        const proxy = new ElementProxyReceiver();
        this.targets[id] = proxy;
    }
    getProxy(id) {
        return this.targets[id];
    }
    handleEvent(data) {
        this.targets[data.id].handleEvent(data.data);
    }
}

const proxyManager = new ProxyManager();

function start(data) {
    const proxy = proxyManager.getProxy(data.elementId);
    proxy.ownerDocument = proxy; // HACK!
    self.document = {};  // HACK!
    init({
        canvas: data.canvas,
        inputElement: proxy,
    });
}

function makeProxy(data) {
    proxyManager.makeProxy(data);
}

const handlers = {
    start,
    makeProxy,
    event: proxyManager.handleEvent,
};

this.callbackManager.runCallback('addfunc',
    [ 'proxyHandler',
        function proxyHandler(args,origin,self){
            const fn = handlers[args[0].type];
            if (!fn) {
            throw new Error('no handler for type: ' + args[0].type);
            }
            fn(args[0]);
        }.toString()
    ]
)

//cram all of this into the workercallbacks?
//also change the functions to be better generalized to our system


//some other rips from three.module
function smoothstep( x, min, max ) {
	if ( x <= min ) return 0;
	if ( x >= max ) return 1;
	x = ( x - min ) / ( max - min );
	return x * x * ( 3 - 2 * x );
}

function smootherstep( x, min, max ) {
	if ( x <= min ) return 0;
	if ( x >= max ) return 1;
	x = ( x - min ) / ( max - min );
	return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

}