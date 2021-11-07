
export class Light {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'scene'
    static hidden = true

    constructor(info, graph, params={}) {
        
        
        let version = '0.134.0'
        this.dependencies = {THREE: `https://cdn.skypack.dev/three@${version}`}


        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            mesh: null,
            // state: new StateManager(),
            lastRendered: Date.now()
        }


        this.ports = {
            add: {
                edit: false,
                data: null,
                input: {type: null},
                output: {type: Object, name: 'Mesh'},
                onUpdate: () => {
                    if (this.props.mesh == null){
                        this.props.mesh = new this.dependencies.THREE.AmbientLight( this.ports.color.data );
                        this.props.mesh.target.position.set( 0, 0, - 2 );
                    }
                    this.props.mesh.position.set( this.ports.x.data, this.ports.y.data, this.ports.z.data );
                    return {data: this.props.mesh}
                }
            },
            radius: {
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    this.ports.radius.data = Math.abs(Number.parseFloat(user.data))
                }
            },
            dx: {
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    let desiredX = Number.parseFloat(this.ports.x.data) + Number.parseFloat(user.data)
                    if (desiredX > 0){
                        this.ports.x.data = desiredX
                    }
                }
            },
            dy: {
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    let desiredY =  Number.parseFloat(this.ports.y.data) + Number.parseFloat(user.data)
                    if (desiredY > 0){
                        this.ports.y.data = desiredY
                    }
                }
            },
            color: {
                input: {type: 'color'},
                output: {type: null},
                onUpdate: (user) => {
                    this.ports.color.data = user.data
                }
            },

            x: {data: -1, min: -10, max:10, step: 0.01},
            y: {data: 1.5, min: -10, max:10, step: 0.01},
            z: {data: -1.5, min: -10, max:10, step: 0.01},
            color: {data: '#ffffff'},
            intensity: {data: 1, min: 0, max:10, step: 0.01},
            distance: {data: 100, min: 0, max:1000, step: 0.01},
            decay: {data: 1, min: 0, max:10, step: 0.01},
        }
    }

    init = () => {
        this.props.mesh = new this.dependencies.THREE.AmbientLight( 0xFFFFFF ); //new this.dependencies.THREE.DirectionalLight();
        this.update('add', {forceUpdate: true, data: this.props.mesh})
    }

    deinit = () => {
        if (this.props.mesh){
            // if (this.props.mesh.type === 'Mesh') {
            //     this.props.mesh.geometry.dispose();
            //     this.props.mesh.material.dispose();
            // }
            // this.props.scene.remove(this.mesh);
        }
    }
}