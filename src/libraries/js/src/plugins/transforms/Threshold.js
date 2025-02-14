export class Threshold{

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(label, session, params={}) {
        this.label = label
        this.session = session
        this.params = params

        this.ports = {
            default: {
                default: false,
                input: {type: 'number'},
                output: {type: 'boolean'},
                onUpdate: (user) => {
                    user.data = user.data > this.params.threshold
                    return user
                }
            },

            threshold: {
                default: 0.5,
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    this.params.threshold = user.data
                }
            }
        }
    }

    init = () => {}

    deinit = () => {}
}