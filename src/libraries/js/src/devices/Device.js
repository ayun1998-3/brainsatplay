
export class Device {
    constructor(connectionClass, mode, onconnect, ondisconnect){

        this.connectionClass = connectionClass // BLE or USB

        this.mode = mode
        this.atlas = null;
        this.device = null;
        this.filters = [];

        this.info = {
            deviceType: null, // NOTE: eeg, heg, other
            pipeToAtlas: false
        }

        if (onconnect) this.onconnect = onconnect; // only reset if exists
        if (ondisconnect) this.ondisconnect = ondisconnect; // only reset if exists

    }


    init = async (info,pipeToAtlas) => {

            Object.assign(this.info, info)
            this.info.pipeToAtlas = pipeToAtlas

            this.device = new this.connectionClass(
                (res) => {
                    if (res) {
                        if (res.command.includes('auth as developer')){
                            let display = document.getElementById(`neosensory-termsDisplay`)
                            if (display) display.innerHTML = `To use your Neosensory Buzz on The Brains@Play Platform, please agree to Neosensory Inc's Developer Terms and Conditions, which can be viewed at <a href='https://neosensory.com/legal/dev-terms-service'>https://neosensory.com/legal/dev-terms-service</a>`
                        }
                    }
                })


            this.device.onNotificationCallback = (e) => {
                let val = this.devic.decoder.decode(e.target.value);
                console.log("BLE MSG: ",val);
            }   
    }

    setupAtlas = async () => {

        // Create Atlas
        if(this.info.pipeToAtlas === true) {
            let config = 'default'; // NOTE: No idea how to dynamically assign this
            this.atlas = new DataAtlas( location+":" + this.mode, {}, config );
            await this.atlas.init()
            this.info.useAtlas = true;
        } 
        
        // Set with External Atlas Reference
        else if (typeof this.info.pipeToAtlas === 'object') {
            this.atlas = this.info.pipeToAtlas;
            this.info.useAtlas = true;
        }

        this.atlas.settings.deviceConnected = true; 
    }

    // Wait for connection to finish
    connect = async () => {
        await this.device.connect();
        await this.setupAtlas(this.info, pipeToAtlas);
        this.onconnect()
    }

    // Disconnect Device
    disconnect = () => {
        this.device.disconnect();
        this.ondisconnect();
        this.atlas.settings.deviceConnected = false; 
    }

    onconnect = () => {}
    ondisconnect = () => {}

    addControls = (parentNode = document.body) => {

        let element = document.createElement('div')

        // this.device.sendMessage()
        parentNode.insertAdjacentElement('beforeend',element)

    }

    
}