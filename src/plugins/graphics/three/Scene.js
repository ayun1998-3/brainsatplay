import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import WebXRPolyfill from 'webxr-polyfill';
const polyfill = new WebXRPolyfill();
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';


export class Scene {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'graphics'

    constructor(info, graph) {
        
        let version = '0.134.0'
        this.dependencies = {THREE: `https://cdn.skypack.dev/three@${version}`}

        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            scene: null,
            renderer: null,
            container: null,
            controls: null,
            camera: null,
            pointerlock: false,
            looping: false,
            velocity: null,
            direction: null,
            left: false,
            right: false,
            backward: false,
            forward: false,
            prevTime: performance.now(),
            raycaster: null,
            intersected: [],
            controllers: [],
            grips: [],
            matrix: null,
            group: null
        }

        this.props.container = document.createElement(`div`);
        this.props.container.id = this.props.id
        this.props.container.style = `width: 100%; height: 100%;`
        this.props.container.onresize = this.responsive


        this.ports = {
            add: {
                edit: false,
                input: {type: Object},
                output: {type: null},
                onUpdate: (user) => {

                    if (!Array.isArray(user.data)) user.data = [user.data]
                    user.data.forEach(mesh => {

                        if (mesh instanceof this.dependencies.THREE.Object3D) {

                            // Remove if object of the same name already exists
                            let existingObject = this.props.scene.getObjectByName( mesh.name);
                            if (existingObject) this.props.scene.remove(existingObject)

                            // Add object
                            // let animate = () => {
                            //     setTimeout(() => {
                            //         if (mesh.material?.uniforms) console.log(mesh.material.uniforms)
                            //         animate()
                            //     }, 500)
                            // }
                            // animate()

                            this.props.scene.add(mesh)
                        }
                        // if (!(mesh instanceof this.dependencies.THREE.Points)) this.props.group.add( mesh ) // Add to group (by default, if not mesh)
                    })
                }
            },
            element: {
                data: this.props.container,
                input: {type: null},
                output: {type: Element}
            },
            camerax: {data: 0, onUpdate: (user) => {this.props.camera.position.set(user.data, this.ports.cameray.data, this.ports.cameraz.data)}},
            cameray: {data: 1.6, onUpdate: (user) => {this.props.camera.position.set(this.ports.camerax.data, user.data, this.ports.cameraz.data)}},
            cameraz: {data: 1.5, onUpdate: (user) => {this.props.camera.position.set(this.ports.camerax.data, this.ports.cameray.data, user.data)}},
            controls: {data: 'first-person', input: {type: 'string'}, options: ['orbit', 'first-person'], onUpdate: (user) => {
                if (user.data === 'orbit') {
                    this._deinitFPV()
                    this.props.controls = new OrbitControls(this.props.camera, this.props.container);
                }
                else {
                    this.props.controls = new PointerLockControls(this.props.camera, this.props.container);
                    this._initFPV()
                }
            }},
        }
    }

    init = () => {

            this.props.camera = new this.dependencies.THREE.PerspectiveCamera()
            this.props.renderer = new this.dependencies.THREE.WebGLRenderer( { antialias: true } )
            this.props.scene = new this.dependencies.THREE.Scene()
            this.props.matrix = new this.dependencies.THREE.Matrix4()
            this.props.group = new this.dependencies.THREE.Group()
            this.props.direction = new this.dependencies.THREE.Vector3()
            this.props.velocity = new this.dependencies.THREE.Vector3()

            this.props.camera.fov = 75
            this.props.camera.aspect = this.props.container.offsetWidth / this.props.container.offsetHeight
            this.props.camera.near = 0.1
            this.props.camera.far = 1000
            this.props.camera.position.set( this.ports.camerax.data, this.ports.cameray.data, this.ports.cameraz.data );
            // this.props.renderer.domElement.style.width = '100%'
            // this.props.renderer.domElement.style.height = '100%'
            this.props.renderer.domElement.id = `${this.props.id}canvas`
            this.props.renderer.autoClear = false;
            this.props.renderer.setPixelRatio( window.devicePixelRatio );
            this.props.renderer.setSize( this.props.container.offsetWidth, this.props.container.offsetHeight );
            this.props.container.appendChild( this.props.renderer.domElement );
            // this.props.renderer.shadowMap.enabled = true;

            // Controls

            this.update('controls', {forceUpdate: true})

            // let minAngle = Math.PI/2 + 0.0001
            // this.props.camera.rotateX(-0.0001)
            // this.props.controls.minPolarAngle = minAngle

            // Enable WebXR
            this._initWebXR()

            this.props.raycaster = new this.dependencies.THREE.Raycaster();

            // // Interactive Group
            // this.props.scene.add(this.props.group)


            this.props.looping = true
            this.props.renderer.setAnimationLoop( this._render );
    }

    deinit = () => {
        this.props.looping = false
        for (let i = this.props.scene.children.length - 1; i >= 0; i--) {
            const object = this.props.scene.children[i];
            if (object instanceof this.dependencies.THREE.Object3D) {
                let objectsToRemove = [object]
                if (object.children.length > 0) objectsToRemove = object.children
                for (let i = objectsToRemove.length - 1; i >= 0; i--) {
                    let o = objectsToRemove[i]
                    if (o.geometery) o.geometry.dispose();
                    if (o.material) o.material.dispose();
                    this.props.scene.remove(o);
                }
                if (object) this.props.scene.remove(object);
            }
        }
        this.props.scene = null;
        this.props.renderer = null;
        this.props.container.remove()
    }

    responsive = () => {
        this.props.camera.aspect = this.props.container.offsetWidth / this.props.container.offsetHeight;
        this.props.camera.updateProjectionMatrix();
        if (this.props.renderer) this.props.renderer.setSize( this.props.container.offsetWidth, this.props.container.offsetHeight );
    }

    _lockPointer = () => {
        // Ask the browser to lock the pointer
        this.props.container.requestPointerLock = this.props.container.requestPointerLock ||
        this.props.container.mozRequestPointerLock ||
        this.props.container.webkitRequestPointerLock;
        this.props.container.requestPointerLock();
    }

    _lockChangeAlert = () => {
        if(document.pointerLockElement === this.props.container ||
            document.mozPointerLockElement === this.props.container) {
            this.props.pointerlock = true
        } else {
            this.props.pointerlock = false
        }
      }

    _initFPV = () => {
        this.props.scene.add(this.props.controls.getObject());
        this.props.container.addEventListener( 'click', this._lockPointer, false);

        if ("onpointerlockchange" in document) document.addEventListener('pointerlockchange', this._lockChangeAlert, false);
        else if ("onmozpointerlockchange" in document) document.addEventListener('mozpointerlockchange', this._lockChangeAlert, false);
          

        document.addEventListener('mousemove', _ => {
            if (this.props.pointerlock) this._moveHUD()
        },false)

        document.addEventListener('keydown', event => {if (this.props.pointerlock) this._onKeyDown(event)}, false);
        document.addEventListener('keyup', event => {this._onKeyUp(event)}, false);
    }

    _deinitFPV = () => {
        this.props.container.removeEventListener( 'click', this._lockPointer, false);
        if ("onpointerlockchange" in document) document.removeEventListener('pointerlockchange', this._lockChangeAlert);
        else if ("onmozpointerlockchange" in document) document.removeEventListener('mozpointerlockchange', this._lockChangeAlert);
    }

    // Control Locked Elements
    _moveHUD = (ev) => {
        this.props.scene.traverse((el) => {
            if (el.isHUD){
                let defaultDistance = 2.0
                let xComp = this.props.camera.position.x //- defaultDistance*Math.cos(this.props.camera.rotation.z)*Math.sin(this.props.camera.rotation.y)
                let yComp = this.props.camera.position.y //- defaultDistance*Math.sin(this.props.camera.rotation.z)*Math.sin(this.props.camera.rotation.y)
                let zComp = this.props.camera.position.z - defaultDistance//*Math.cos(this.props.camera.rotation.y)
                el.position.set(xComp,yComp,zComp)
                // el.setRotationFromEuler(this.props.camera.rotation)
            }
        })
    }

    _initWebXR = () => {
        this.props.VRButton = VRButton.createButton( this.props.renderer );
        this.props.container.appendChild( this.props.VRButton );
        this.props.VRButton.style.zIndex = 1;
        
        this.props.renderer.xr.enabled = true;

        // Setup Controllers
        this.props.controllers.push(this.props.renderer.xr.getController( 0 ));
        // this.props.controllers[0].addEventListener( 'selectstart', this._onSelectStart );
        // this.props.controllers[0].addEventListener( 'selectend', this._onSelectEnd );
        this.props.scene.add( this.props.controllers[0] );

        this.props.controllers.push(this.props.renderer.xr.getController( 1 ));
        // this.props.controllers[1].addEventListener( 'selectstart', this._onSelectStart );
        // this.props.controllers[1].addEventListener( 'selectend', this._onSelectEnd );
        this.props.scene.add( this.props.controllers[1] );

        // Setup XR Viewport
        this.props.controllers[0].addEventListener( 'connected', ( ) => {
            let canvas = document.getElementById(`${this.props.id}canvas`)
            if (canvas){
                canvas.parentNode.appendChild( this.props.VRButton );
                this.props.controls.enabled = false
            }
        });
        
        this.props.controllers[0].addEventListener( 'disconnected', () => {
            this.props.container.appendChild( this.props.VRButton );
            this.props.camera.position.set( this.ports.camerax.data, this.ports.cameray.data, this.ports.cameraz.data );
            this.responsive()
            this.props.controls.enabled = true
        } );

        // Setup XR Controller
        const controllerModelFactory = new XRControllerModelFactory();

        this.props.grips.push(this.props.renderer.xr.getControllerGrip( 0 ))
        this.props.grips[0].add( controllerModelFactory.createControllerModel( this.props.grips[0] ) );
        this.props.scene.add( this.props.grips[0] );

        this.props.grips.push(this.props.renderer.xr.getControllerGrip( 1 ))
        this.props.grips[1].add( controllerModelFactory.createControllerModel( this.props.grips[1] ) );
        this.props.scene.add( this.props.grips[1] );

        const geometry = new this.dependencies.THREE.BufferGeometry().setFromPoints( [ new this.dependencies.THREE.Vector3( 0, 0, 0 ), new this.dependencies.THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new this.dependencies.THREE.Line( geometry );
        line.name = `${this.props.id}line`;
        line.scale.z = 5;

        this.props.controllers.forEach(c => {
            c.add( line.clone() );
        })
    }

    // Mouse Lock Controls
    _onKeyDown = (e) => {
        switch (e.code){
            case 'ArrowUp':
            case 'KeyW':
                this.props.forward = true
                break
            case 'ArrowDown':
            case 'KeyS':
                this.props.backward = true
                break
            case 'ArrowLeft':
            case 'KeyA':
                this.props.left = true
                break
            case 'ArrowRight':
            case 'KeyD':
                this.props.right = true
                break
        }
    }

    _onKeyUp = (e) => {
        switch (e.code){
            case 'ArrowUp':
            case 'KeyW':
                this.props.forward = false
                break
            case 'ArrowDown':
            case 'KeyS':
                this.props.backward = false
                break
            case 'ArrowLeft':
            case 'KeyA':
                this.props.left = false
                break
            case 'ArrowRight':
            case 'KeyD':
                this.props.right = false
                break
        }
    }

    // XR Controls
    _onSelectStart = ( event ) => {

        const controller = event.target;

        const intersections = this._getIntersections( controller );

        if ( intersections.length > 0 ) {

            const intersection = intersections[ 0 ];

            const object = intersection.object;
            if (object.material.emissive) object.material.emissive.b = 1;
            controller.attach( object );

            controller.userData.selected = object;

        }

    }

    _onSelectEnd = ( event ) => {

        const controller = event.target;

        if ( controller.userData.selected !== undefined ) {

            const object = controller.userData.selected;
            if (object.interactable){
                if (object.material.emissive) object.material.emissive.b = 0;
            }
            this.props.group.attach( object );

            controller.userData.selected = undefined;

        }
    }

    _getIntersections = ( controller ) => {

        this.props.matrix.identity().extractRotation( controller.matrixWorld );

        this.props.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        this.props.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.props.matrix );

        return this.props.raycaster.intersectObjects( this.props.group.children );

    }

    _intersectObjects = ( controller ) => {

        // Do not highlight when already selected

        if ( controller.userData.selected !== undefined ) return;

        const line = controller.getObjectByName( `${this.props.id}line` );
        const intersections = this._getIntersections( controller );

        if ( intersections.length > 0 ) {

            const intersection = intersections[ 0 ];

            const object = intersection.object;

            if (object.interactable){
                if (object.material.emissive) object.material.emissive.r = 1;
            }
            
            this.props.intersected.push( object );

            line.scale.z = intersection.distance;

        } else {

            line.scale.z = 5;

        }

    }

    _cleanIntersected = () => {

        while ( this.props.intersected.length ) {
            const object = this.props.intersected.pop();
            if (object.material.emissive) object.material.emissive.r = 0;
        }

    }

    // _setCamera = () => {
    //     this.props.camera.position.set( this.ports.camerax.data, this.ports.cameray.data, this.ports.cameraz.data );
    // }

    // Render Loop

    _render = () => {

        if (this.props.looping){
            const time = performance.now()
            const delta = ( time - this.props.prevTime ) / 1000;

            // Update Raycaster Functionality
            // this._cleanIntersected();
            // this.props.controllers.forEach(c => {
            //     this._intersectObjects( c );
            // })

            // Move View

            if (this.ports.controls.data !== 'orbit'){
                this.props.velocity.x -= this.props.velocity.x * 10.0 * delta;
                this.props.velocity.z -= this.props.velocity.z * 10.0 * delta;

                this.props.direction.z = Number( this.props.forward ) - Number( this.props.backward );
                this.props.direction.x = Number( this.props.right ) - Number( this.props.left );
                this.props.direction.normalize(); // this ensures consistent movements in all directions

                if ( this.props.forward || this.props.backward ) this.props.velocity.z -= this.props.direction.z * 400.0 * delta;
                if ( this.props.left || this.props.right ) this.props.velocity.x -= this.props.direction.x * 400.0 * delta;

                this.props.controls.moveRight( - 0.1*this.props.velocity.x * delta );
                this.props.controls.moveForward( - 0.1*this.props.velocity.z * delta );
            } else this.props.controls.update() // update controls
            // if (Math.abs(this.props.velocity.x) > 0.1 || Math.abs(this.props.velocity.z) > 0.1){
            //     this._moveHUD()
            // }

            // Render
            this.props.renderer.render( this.props.scene, this.props.camera );

            this.props.prevTime = time;
        }
    }
}