import vertexShader from '../shader/vertex.glsl'
import blankFragment from '../shader/blankFragment.glsl'

export class Material  {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'scene'

    constructor() {

        let version = '0.134.0'
        this.dependencies = {THREE: `https://cdn.skypack.dev/three@${version}`}

        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            material: null,
            // state: new StateManager(),
            lastRendered: Date.now(),
            uniforms: {},
            defaultColor: '#ffffff',
            lastMaterialType: null
        }
        
        this.ports = {
            default: {
                edit: false,
                input: {type: null},
                output: {type: Object, name: 'Material'},
                onUpdate: () => {
                    switch(this.props.lastMaterialType){
                        case 'PointsMaterial':
                            this.props.material = new this.dependencies.THREE.PointsMaterial()
                            break
                        case 'MeshBasicMaterial':
                            this.props.material = new this.dependencies.THREE.MeshBasicMaterial( {color: this.ports.color.data} );
                            break
                        case 'MeshStandardMaterial':
                            this.props.material = new this.dependencies.THREE.MeshStandardMaterial( {color: this.ports.color.data} );
                            break
                        case 'ShaderMaterial':

                            this._replaceUniformsWithThreeObjects(this.props.uniforms) // Conduct on original object

                            this.props.material = new this.dependencies.THREE.ShaderMaterial({
                                vertexShader: this.ports.vertexShader.data,
                                fragmentShader: this.ports.fragmentShader.data,
                                uniforms: this.props.uniforms
                            });
                            break
                    }
            
                    if (this.props.material){
                        this.props.material.side = 2 // double side
                        this.props.material.transparent = this.ports.transparent.data
                        this.props.material.opacity = this.ports.opacity.data
                        this.props.material.wireframe = this.ports.wireframe.data
                        this.props.material.depthWrite = this.ports.depthWrite.data
                        this.props.material.alphaTest = this.ports.alphaTest.data
                    }

                    return {data: this.props.material}
                }
            },
            type: {
                data: 'MeshBasicMaterial', 
                options: [
                    'MeshBasicMaterial',
                    'MeshStandardMaterial',
                    'ShaderMaterial',
                    'PointsMaterial'
                ],
                input: {type: 'string'}, 
                output: {type: null},
                onUpdate: (user) => {
                    this.props.lastMaterialType = user.data
                    this.update('default', {forceUpdate: true})
                }
            },
            fragmentShader: {
                data: blankFragment,
                input: {type: 'GLSL'},
                output: {type: null},
                onUpdate: (user) => {
                    this.ports.fragmentShader.data = user.data
                    this._updateUniforms(user.meta.uniforms)
                    this._passShaderMaterial()
                }
            },
            vertexShader: {
                data: vertexShader,
                input: {type: 'GLSL'},
                output: {type: null},
                onUpdate: (user) => {
                        this.ports.vertexShader.data = user.data
                        this._updateUniforms(user.meta.uniforms)
                        this._passShaderMaterial()
                }
            },
            color: {data: this.props.defaultColor, input: {type: 'color'}, output: {type: null}, onUpdate: (user) => {
                if (this.props.material?.color) this.props.material.color = new this.dependencies.THREE.Color(user.data)
            }},
            transparent: {data: false, input: {type: 'boolean'}, output: {type: null},onUpdate: (user) => {this.props.material.transparent = user.data}},
            opacity: {data: 1, min: 0, max: 1, step: 0.01, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.material.opacity = user.data}},
            wireframe: {data: false, input: {type: 'boolean'}, output: {type: null}, onUpdate: (user) => {this.props.material.wireframe = user.data}},
            depthWrite: {data: true, input: {type: 'boolean'}, output: {type: null}, onUpdate: (user) => {this.props.material.depthWrite = user.data}},
            alphaTest: {data: 0, min: 0, max: 1, step: 0.01, input: {type: 'number'}, output: {type: null}, onUpdate: (user) => {this.props.material.alphaTest = user.data}},
            // size: {data: 0, min: 0, step: 0.01, input: {type: 'number'}, output: {type: null}},
        }
    }

    init = () => {
        this.update('default', {forceUpdate: true}) // create default material
        this.update('type',this.ports.type) // FIX: Shouldn't be necessary
        this._passShaderMaterial()
    }

    deinit = () => {
        if (this.props.material){
            this.props.material.dispose()
        }
    }


    _updateUniforms = (uniforms) => {
        if (typeof uniforms === 'object'){
            this._filterMisformattedUniforms(uniforms) // Conduct on original object
            this.props.uniforms = Object.assign(this.props.uniforms, uniforms) // Deep copy to keep params and props separate
            this._replaceUniformsWithThreeObjects(this.props.uniforms)
        }
    }

    _filterMisformattedUniforms = (uniforms) => {
        for (let key in uniforms){
            // Remove Misformatted Uniforms
            if (typeof uniforms[key] !== 'object' || !('value' in uniforms[key])) delete uniforms[key]
        }
    }

    _replaceUniformsWithThreeObjects = (uniforms) => {
        for (let key in uniforms){
            let value = uniforms[key].value

            // Remove Misformatted Uniforms
            if (typeof uniforms[key] === 'object' && !('value' in uniforms[key])) delete uniforms[key]

                       
            // Try Making Colors from Strings
            else if (typeof value === 'string') uniforms[key].value = new this.dependencies.THREE.Color(value)
            

            // Make Vectors from Properly Formatted Objects
            else if (typeof value === 'object' && 'x' in value && 'y' in value) uniforms[key].value = new this.dependencies.THREE.Vector2(value.x, value.y)
        }

        // console.log(uniforms)

    }

    _passShaderMaterial = () => {
        if (!!this.ports.vertexShader.data && !!this.ports.fragmentShader.data) {
            this.update('type',{data: 'ShaderMaterial'})
        }
        else this.ports.type.data = this.props.lastMaterialType || 'MeshBasicMaterial'
    }

    _hexToRgb = (hex) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16),parseInt(result[2], 16),parseInt(result[3], 16)] : [0,0,0];
    }
}