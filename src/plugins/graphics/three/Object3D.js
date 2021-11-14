import {StateManager} from '../../../utils/StateManager'
export class Object3D {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'scene'

    constructor(info, graph, params={}) {
        // 
        
        let version = '0.134.0'
        this.dependencies = {THREE: `https://cdn.skypack.dev/three@${version}`}

        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            geometry: null,
            material: null,
            mesh: null,
            state: new StateManager(),
            lastRendered: Date.now(),
            tStart: Date.now(),
            looping: false,
        }

        this.ports = {
            add: {
                edit: false,
                data: this.props.mesh,
                input: {type: null},
                output: {type: Object, name: 'Mesh'},
                onUpdate: () => {
                    this._setObject()
                    this._updateProps()
                    return {data: this.props.mesh}
                }
            },
            material: {
                edit: false,
                input: {type: Object, name: 'Material'},
                output: {type: null},
                onUpdate: (user) => {
                    this.props.material = user.data
                    if (this.props.mesh){
                        this.props.mesh.material.dispose()
                        this.props.mesh.material = this.props.material
                    }
                }
            },
            geometry: {
                edit: false,
                input: {type: Object, name: 'Geometry'},
                output: {type: null},
                onUpdate: (user) => {
                    this.props.geometry = user.data
                    if (this.props.mesh){
                        this.props.mesh.geometry.dispose()
                        this.props.mesh.geometry = this.props.geometry
                    }
                    this.update('add',{ forceUpdate: true})

                }
            },
            scale: {
                data: 1,
                input: {type: 'number'},
                output: {type: null},
                min: 0,
                onUpdate: (user) => {
                    let scale = Math.abs(Number.parseFloat(user.data))
                    this.ports.scalex.data = this.ports.scaley.data = this.ports.scalez.data = scale 
                    this.update('scalex', {data: scale})
                    this.update('scaley', {data: scale})
                    this.update('scalez', {data: scale})
                }
            },
            scaleOffset: {
                data: 0,
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    this.props.mesh.scale.set(this.ports.scalex.data + user.data, this.ports.scaley.data + user.data, this.ports.scalez.data + user.data)
                }
            },
            dx: {
                data: 0,
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    let desiredX = Number.parseFloat(this.ports.x.data) + Number.parseFloat(user.data)
                    this.update('y', {data: desiredX})
                }
            },
            dy: {
                data: 0,
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    let desiredY =  Number.parseFloat(this.ports.y.data) + Number.parseFloat(user.data)
                    this.update('y', {data: desiredY})

                }
            },
            dz: {
                data: 0,
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    let desiredZ = Number.parseFloat(this.ports.z.data) + Number.parseFloat(user.data)
                    this.update('z', {data: desiredZ})
                }
            },

            type: {data: 'Mesh', options: ['Mesh', 'Points']},
            scalex: {data: 1, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.scale.set(user.data + this.ports.scaleOffset.data, this.ports.scaley.data + this.ports.scaleOffset.data, this.ports.scalez.data + this.ports.scaleOffset.data)}},
            scaley: {data: 1, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.scale.set(this.ports.scalex.data + this.ports.scaleOffset.data, user.data + this.ports.scaleOffset.data, this.ports.scalez.data + this.ports.scaleOffset.data)}},
            scalez: {data: 1, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.scale.set(this.ports.scalex.data + this.ports.scaleOffset.data, this.ports.scaley.data + this.ports.scaleOffset.data, user.data + this.ports.scaleOffset.data)}},
            x: {data: 0, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.position.set(user.data, this.ports.y.data, this.ports.z.data)}},
            y: {data: 1, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.position.set(this.ports.x.data, user.data, this.ports.z.data)}},
            z: {data: -2, input: {type: 'number'}, output: {type:null}, onUpdate: (user) => {this.props.mesh.position.set(this.ports.x.data, this.ports.y.data, user.data)}},
            rotatex: {data: 0, min: -2*Math.PI, max: 2*Math.PI, step: 0.1, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.rotateX(user.data)}},
            rotatey: {data: 0, min: -2*Math.PI, max: 2*Math.PI, step: 0.1, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.rotateY(user.data)}},
            rotatez: {data: 0, min: -2*Math.PI, max: 2*Math.PI, step: 0.1, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.mesh.rotateZ(user.data)}},
            // interactable: {data: false},
        }
    }

    init = () => {

        // this.update('default',{forceUpdate: true}) // Create default mesh

        this._setObject() // moved down

        this.update('add',{ forceUpdate: true})
        this.props.prevType = this.ports.type.data

        this.props.looping = true

        let animate = () => {
            if (this.props.looping){
                let tElapsed = (Date.now() - this.props.tStart)/1000; 

                // Set Default Uniforms
                if (this.props.mesh.material.uniforms){

                    // Init
                    if (this.props.mesh.material.uniforms.iTime == null) this.props.mesh.material.uniforms.iTime = {value: tElapsed}
                    if (this.props.mesh.material.uniforms.iResolution == null) this.props.mesh.material.uniforms.iResolution = {value: new this.dependencies.THREE.Vector2(1,1)} // ensure iResolution is a vector
                    
                    // Update
                    this.props.mesh.material.uniforms.iTime.value = tElapsed
                }
                setTimeout(() => {animate()},1000/60)
            }
        }
        animate()

    }

    deinit = () => {
        if (this.props.mesh){
            if (this.props.mesh.type === 'Mesh') {
                this.props.mesh.geometry.dispose();
                this.props.mesh.material.dispose();
            }
            if (this.props.mesh.parent) this.props.mesh.parent.remove(this.props.mesh)
        }
        this.props.looping = false
    }

    _updateProps = () => {
        this.props.mesh.scale.set(this.ports.scalex.data + this.ports.scaleOffset.data, this.ports.scaley.data + this.ports.scaleOffset.data, this.ports.scalez.data + this.ports.scaleOffset.data)
        this.props.mesh.position.set(this.ports.x.data, this.ports.y.data, this.ports.z.data)
        if (this.props.mesh.material?.uniforms?.iResolution != null) this.props.mesh.material.uniforms.iResolution.value = new this.dependencies.THREE.Vector2(1,1);
        this.props.mesh.rotateX(this.ports.rotatex.data)
        this.props.mesh.rotateY(this.ports.rotatey.data)
        this.props.mesh.rotateZ(this.ports.rotatez.data)
        this.props.mesh.name = `${this.name}`
    }

    // Macros
    _setObject = () => {
        if (this.ports.type.data === 'Mesh'){
            this._createMesh()
        } else if (this.ports.type.data === 'Points'){
            this._createPoints()
        }
    }


    _createMesh = () => {
        if (this.props.material == null) this.props.material = new this.dependencies.THREE.MeshBasicMaterial()
        if (this.props.geometry == null) this.props.geometry = new this.dependencies.THREE.SphereGeometry()
        this.props.mesh = new this.dependencies.THREE.Mesh( this.props.geometry, this.props.material )
    }

    _createPoints = () => {
        if (this.props.material == null) this.props.material = new this.dependencies.THREE.PointsMaterial()
        if (this.props.geometry == null) this.props.geometry = new this.dependencies.THREE.BufferGeometry()
        this.props.mesh = new this.dependencies.THREE.Points( this.props.geometry, this.props.material )
    }
}