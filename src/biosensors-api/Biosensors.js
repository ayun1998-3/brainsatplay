/* 

The Biosensor interface provides access to connected biosensing hardware like EEGs. 
In essence, it lets you obtain access to any hardware source of biosensor data.

Based on https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API

*/

import { devices } from '../devices/index.js';

export default class Biosensors extends EventTarget {

    constructor () {
        super()
        
        this.devices = devices

    }

    enumerateDevices = async () => {

        // TODO: Get devices actually connected--not just those potentially available.
        return [
            ...this.devices
        ]
    }

    getSupportedConstraints = async () => {

        return {
            sampleRate: true
        }
    }

    getUserStream = async (constraints) => {

        // Get Stream based on Constraints
        let stream = {} // get stream
        if (constraints.emg) console.log('emg') // get emg
        if (constraints.eeg) console.log('eeg') // get eeg
        if (constraints.fnirs) console.log('fnirs') // get fnirs

        // Apply Contraints
        stream.applyConstraints(constraints)
        // stream.getSettings() // Returns a dictionary currently set values for the constraints

        return stream
    }

}