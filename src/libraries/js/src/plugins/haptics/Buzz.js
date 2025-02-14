import { StateManager } from '../../ui/StateManager'

export class Buzz{

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(label, session, params={}) {
        this.label = label
        this.session = session
        this.params = params

        this.paramOptions = {
            motor1: {default: 255, min:0, max: 255, step: 1.0},
            motor2: {default: 255, min:0, max: 255, step: 1.0},
            motor3: {default: 255, min:0, max: 255, step: 1.0},
            motor4: {default: 255, min:0, max: 255, step: 1.0},
            led1color: {default: `#00ff00`},
            led2color: {default: `#00ff00`},
            led3color: {default: `#00ff00`},
            led1intensity: {default: 0, min:0, max: 1, step: 0.01},
            led2intensity: {default: 0, min:0, max: 1, step: 0.01},
            led3intensity: {default: 0, min:0, max: 1, step: 0.01},
            position: {default: 0, min: 0, max: 1, step: 0.01}
        }

        this.props = {
            state: new StateManager(),
            deviceSubscriptions: {},
            toUnsubscribe: {
                stateAdded: [],
                stateRemoved: []
            },
            device: null
        }

        this.ports = {
            motors: {
                input: {type: 'boolean'},
                output: {type: null},
            },
            leds: {
                input: {type: 'boolean'},
                output: {type: null},
            },
            audioToMotors: {
                input: {type: Array},
                output: {type: null},
            },
            mapOnBand: {
                input: {type: 'number'},
                output: {type: null},
            },
            fillLEDs: {
                input: {type: 'number'},
                output: {type: null},
            },
            status: {
                input: {type: null},
                output: {type: 'boolean'},
            }
        }

        let added = (k) => {
            this._subscribeToDevices(k,['buzz'])
            this.session.graph.runSafe(this,'status',{forceRun: true})
        }

        let removed = (k) => {
            if (k.includes('device')){
                // Update Internal Device State
                this.props.device = this.session.getDevice('buzz')
                if (this.props.device)  this.props.device = this.props.device.device
            }
            this.status()
        }

        this.props.toUnsubscribe['stateAdded'].push(this.session.state.subscribeSequential('stateAdded', added))
        this.props.toUnsubscribe['stateRemoved'].push(this.session.state.subscribeSequential('stateRemoved', removed))
    }

    init = () => {

        // Check if Buzz Exists
        this.props.device = this.session.getDevice('buzz')
        if (!this.props.device)  console.log('Must connect your Buzz first')
        else this.props.device = this.props.device.device.device
        this.session.graph.runSafe(this,'status',{forceRun: true})
    }

    deinit = () => {

    }

    status() {
        return {data: (this.session.getDevice('buzz') != null), meta:{}}
    }

    // Expects True/False
    motors = (user) => { 
        if (this.props.device){   
            // Check User Requests
            if (user.data == true && user.meta.user === this.session.info.auth.id){ // Run if you
                let motorCommand = [this.params.motor1,this.params.motor2,this.params.motor3,this.params.motor4]
                this.props.device.vibrateMotors([motorCommand,[0,0,0,0]])
            }
        }
    }

    // Expects True/False
    leds = (user) => {
        if (this.props.device){

            // Check User Requests
            let c1 = [0,0,0]
            let c2 = [0,0,0]
            let c3 = [0,0,0]
            if (user.data == true){
                c1 = this._hexToRgb(this.params.led1color)
                c2 = this._hexToRgb(this.params.led2color)
                c3 = this._hexToRgb(this.params.led3color)
            }
            
            let ledColors = [c1,c2,c3]
            let ledIntensities = [this.params.led1intensity,this.params.led2intensity,this.params.led3intensity]
            ledIntensities = ledIntensities.map(i => Number.parseFloat(i))
            this.props.device.setLEDs(ledColors, ledIntensities)
        }
    }

    // Expects an FFT
    audioToMotors = (user) => {
        if (this.props.device)this.props.device.vibrateMotors([this.props.device.mapFrequencies(user.data)])
    }

    // Expects a value between 0-1
    mapOnBand = (user) => {
        if (this.props.device){
            if (user.data != false){
                let position = (user.data == true) ? this.params.position : user.data
                this.props.device.vibrateMotors([this.props.device.getIllusionActivations(position)])
            } else {
                this.props.device.vibrateMotors([0,0,0,0])
            }
        }
    }

    fillLEDs = (user) => {
        if (this.props.device){

            let c1 = this._hexToRgb(this.params.led1color)
            let c2 = this._hexToRgb(this.params.led2color)
            let c3 = this._hexToRgb(this.params.led3color)
            
            // Fills the Lights (Multi User)
            let mean = user.data

            let i1 = Math.min(mean/.33,1)
            let i2 = (i1 === 1 ? Math.min((mean-.33)/.33,1) : 0)
            let i3 = (i2 === 1 ? Math.min((mean-.66)/.33,1) : 0)

            let ledColors = [c1,c2,c3]
            let ledIntensities = [i1,i2,i3]
            ledIntensities = ledIntensities.map(i => Number.parseFloat(i))
            this.props.device.setLEDs(ledColors, ledIntensities)
        }
    }
    
    _subscribeToDevices(k, nameArray=[]) {
        if (k.includes('device')){
            let deviceInfo = this.session.state.data[k]
            if (nameArray.includes(deviceInfo.deviceName)){
            this.props.device = this.session.getDevice(deviceInfo.deviceName).device.device
        }
        }
     }

    _hexToRgb = (hex) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16),parseInt(result[2], 16),parseInt(result[3], 16)] : [0,0,0];
    }

}