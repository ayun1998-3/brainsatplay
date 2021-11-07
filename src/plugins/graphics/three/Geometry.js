export class Geometry {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'graphics'

    constructor() {
        
        let version = '0.134.0'
        this.dependencies = {THREE: `https://cdn.skypack.dev/three@${version}`}
        
        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            geometry: null,
            // state: new StateManager(),
            lastRendered: Date.now(),
            type: 'SphereGeometry'
        }

        this.ports = {
            default: {
                edit: false,
                input: {type: null},
                output: {type: Object, name: 'Geometry'},
                onUpdate: () => {

                    switch(this.props.type){
                        case 'SphereGeometry':
                            this.props.geometry = new this.dependencies.THREE.SphereGeometry( 1, this.props.segments, this.props.segments );
                            break
                        case 'PlaneGeometry':
                            this.props.geometry = new this.dependencies.THREE.PlaneGeometry(1,1,this.props.segments,this.props.segments);
                            break
                        // case 'TetrahedronGeometry':
                        //     this.props.geometry = new this.dependencies.THREE.TetrahedronGeometry(this.ports.radius,this.ports.segments);
                        //     break
                        case 'TorusGeometry':
                            this.props.geometry = new this.dependencies.THREE.TorusGeometry(1);
                            break
                        case 'BoxGeometry':
                            this.props.geometry = new this.dependencies.THREE.BoxGeometry(1,1,1);
                            break
                        case 'BufferGeometry':
                            if (!(this.props.geometry instanceof this.dependencies.THREE.BufferGeometry)){
                                console.error('BUFFER GEOMETRIES MADE ELSEWHERE')
                            }
                            break
                    }            
                    return {data: this.props.geometry}
                }
            },

            type: {data: 'SphereGeometry', options: [
                'SphereGeometry',
                'PlaneGeometry', 
                // 'TetrahedronGeometry', 
                'TorusGeometry', 
                'BoxGeometry',
                'BufferGeometry'
            ],
            onUpdate: (user) => {
                this.props.type = user.data
                this.update('default', {forceUpdate: true})
            }
            },

            segments: {data: 32, min: 1, max:100, step: 1, onUpdate: (user) => {this.props.segments = user.data; this.update('default', {forceUpdate: true})}},
            // count: {data: 100, min: 0, max: 10000, step:1.0, onUpdate: () => {this.update('default', {forceUpdate: true}}},

            // Set Vertices Directly
            attributes: {
                edit: false,
                input: {type: undefined},
                output: {type: Object},
                onUpdate: (user) => {
                    this._regenerate(user)
                    return user
                }
            }, 

            // Downsample Vertices
            resolution: {
                data: 1,
                min: 0,
                max: 1,
                step: 0.01,
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    let buffer = []

                    let model = this.props.originalModel || this.ports.model?.data
                    if (model){
                    let n = (model.length / 3)
                    let desiredCount = user.data * n
                    let used = [];

                    // Downsample
                    for (let i = 0; i < n - 1; i+=Math.floor((model.length/3)/desiredCount)) {
                        buffer.push(...model.slice(i*3,(i*3)+3))
                        used.push(i)
                    }

                    // Account for Remainder
                    let remainder = desiredCount - (buffer.length/3)
                    for (let i =0; i < Math.abs(remainder); i++) {
                        if (remainder > 0) buffer.push(...model.slice((used[i]+1)*3, ((used[i]+1)*3)+3)) // Add skipped
                        else if (remainder < 0) for (let i = 0; i < 3; i++) buffer.pop() // Remove extra
                    }

                    let attributes = this.ports.attributes.value
                    if (attributes) {
                        attributes['position'].buffer = buffer
                       this.update('attributes', attributes)
                    }
                }
                }
            }, 

        }
    }

    init = () => {
        if (!this.props.geometry) this.props.geometry = new this.dependencies.THREE.SphereGeometry()
        this.update('default',{forceUpdate: true, data: this.props.geometry })
    }

    deinit = () => {
        if (this.props.geometry){
            this.props.geometry.dispose()
        }
    }
    
    _regenerate = (user) => {
        this.props.geometry = new this.dependencies.THREE.BufferGeometry()
        for (let attribute in user.value){
            let info = user.value[attribute]
            this.props.geometry.setAttribute(attribute, new this.dependencies.THREE.Float32BufferAttribute( info.buffer, info.size ) );
            if (attribute === 'position') this.props.originalModel = [...info.buffer]
        }
        this.update('default',{forceUpdate: true})
    }

}