
import * as arithmetic from './arithmetic/index.js'
export class Arithmetic {
    
    static id = String(Math.floor(Math.random()*1000000))
    static category = 'tranforms'

    constructor() {

        this.ports = {

            // Modifies the Input Value of a Transformation
            modifier: {
                data: 0,
                input: {type: 'number'},
                output: {type: null},
            },


            // Tranformations
            add: {
                input: {type: 'number'},
                output: {type: 'number'},
                onUpdate: (user) => { 
                    user.data = arithmetic.add(user.data, this.ports.modifier.data)
                    return user
                }            
            },
            subtract: {
                input: {type: 'number'},
                output: {type: 'number'},
                onUpdate: (user) => {
                    user.data = arithmetic.subtract(user.data, this.ports.modifier.data)
                    return user
                }
            },
            multiply: {
                input: {type: 'number'},
                output: {type: 'number'},
                onUpdate: (user) => {
                    user.data = arithmetic.multiply(user.data, this.ports.modifier.data)
                    return user
                }
            },
            divide: {
                input: {type: 'number'},
                output: {type: 'number'},
                onUpdate: (user) => {
                    user.data = arithmetic.divide(user.data, this.ports.modifier.data)
                    return user
                }
            },
            mean: {
                edit: false,
                input: {type: Array},
                output: {type: 'number'},
                onUpdate: (user) => {
                    user.data = arithmetic.mean(user.data, this.ports.modifier.data)
                    return user
                }
            },
            sum: {
                edit: false,
                input: {type: Array},
                output: {type: 'number'},
                onUpdate: (user) => {
                    user.data = arithmetic.sum(user.data, this.ports.modifier.data)
                    return user
                }
            }
        }
    }
}