import fragmentShader from './fragment.glsl'
export class Shader {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'graphics'

    constructor(info, graph, params={}) {
        
        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            uniforms: {},
            restrictedUniforms: ['iTime', 'iResolution']
        }

        this.ports = {
            default: {
                data: fragmentShader, 
                meta: {label: this.name, uniforms: this.props.uniforms},
                input: {type: 'GLSL'},
                output: {type: 'GLSL'},
                onUpdate: (user) => {
                    if (typeof user.data === 'string'){
                        this.ports.default.data = user.data
                        this._setDynamicPorts(this.ports.default.data)
                        return {data: this.ports.default.data, meta: {label: this.name, uniforms: this.props.uniforms}}
                    }
                }
            },
            uniforms: {}
        }
    }

    init = () => {
        if (this.ports.uniforms.data && typeof this.ports.uniforms.data === 'object') Object.assign(this.props.uniforms, this.ports.uniforms.data)
        this.update('default',{data:this.ports.default.data, forceUpdate: true})
    }

    deinit = () => {}

    _setDynamicPorts = (glsl) => {
        // Get Uniforms
        var re = /uniform\s+([^\s]+)\s+([^;]+);/g;
        let result = [...glsl.matchAll(re)]

        result.forEach((match) => {
            let nameArr = match[2].split('[')
            let typeArr = match[1].split('[')
            let name = match[2].split('[')[0]
            let type = (typeArr.length + nameArr.length > 2) ? Array : typeArr[0]

            // remove square brackets for arrays
            this._setPort(name, type)
        })

        Object.keys(this.props.uniforms).forEach(name => {
            if (!result.includes(name)) this.removePort(name)
        })
    }

    _setPort = (name, type) => {

            // Set default uniform value

            if (this.props.uniforms[name] == null) {
                this.props.uniforms[name] = {value: this.params.uniforms[name] ?? 0}
            }

            // Set Port
            if (!this.ports[name]){
                this.addPort(name, {
                    input: {type},
                    data: this.props.uniforms[name].value,
                    output: {type: null},
                    onUpdate: (user) => {
                        if (!isNaN(user.data) || Array.isArray(user.data)) {
                            if (Array.isArray(user.data)) this.props.uniforms[name].value = user.data.flat(2)
                            else this.props.uniforms[name].value = user.data // Passed by reference at the beginning
                        }
                    }
                })
            }
    }
}