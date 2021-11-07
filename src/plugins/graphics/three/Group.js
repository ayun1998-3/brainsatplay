export class Group {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'graphics'
    static hidden = true

    constructor(info, graph, params={}) {
        
        let version = '0.134.0'
        this.dependencies = {THREE: `https://cdn.skypack.dev/three@${version}`}
        

        this.props = {
            group: null
        }
        

        this.ports = {
            default: {
                edit: false,
                data: undefined,
                input: {type: undefined},
                output: {type: Object, name: 'Group'},
                onUpdate: (user) => {

                    if (!Array.isArray(user.data)) user.data = [user.data]
                    user.data.forEach(o => {
                        let existingObject = this.props.group.getObjectByName(o.name);
                        if (existingObject) this.props.group.remove(existingObject)
                        this.props.group.add(o)
                    })

                    return {data: this.props.group}
                }
            },
            rotatex: {
                data: 0, min: -2*Math.PI, max: 2*Math.PI, step: 0.1, input: {type: 'number'}, output: {type: null},
                onUpdate: (user) => {
                    this.props.group.rotateX(user.data)
                }
            },
            rotatey: {
                data: 0, min: -2*Math.PI, max: 2*Math.PI, step: 0.1, input: {type: 'number'}, output: {type: null},
                onUpdate: (user) => {
                    this.props.group.rotateY(user.data)
                }
            },
            rotatez: {
                data: 0, min: -2*Math.PI, max: 2*Math.PI, step: 0.1, input: {type: 'number'}, output: {type: null},
                onUpdate: (user) => {
                    this.props.group.rotateZ(user.data)
                }
            }
        }
    }

    init = () => {


        this.props.group = new this.dependencies.THREE.Group()
        this.update('default', {forceUpdate: true, data: this.props.group})


        this.ports.rotatex.onUpdate(this.ports.rotatex)
        this.ports.rotatey.onUpdate(this.ports.rotatey)
        this.ports.rotatez.onUpdate(this.ports.rotatez)
    }

    deinit = () => {}
}