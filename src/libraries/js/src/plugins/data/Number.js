export class Number{

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(label, session, params={}) {
        this.label = label
        this.session = session
        this.params = params

        this.ports = {
            value: {
                default: 5,
                input: {type: 'number'},
                output: {type: 'number'},
                onUpdate: (user) => {
                    this.params.value = user.data
                    return user
                }
            }
        }
    }

    init = () => {
        // this.session.graph.runSafe(this, 'default', [{data: this.params.default, forceUpdate: true}])
    }

    deinit = () => {}
}