
//multithreaded event manager, spawn one per thread and import a single instance elsewhere.

/**
 * How it'll work:
 * Function output --> Event Emitter Tx
 * 
 * Event Emitter Rx[] --> State sub triggers to pass output to subscribed ports.
 * 
 * So set the worker onmessage up with the event manager as well (when it's done).
 * This is going to be integral with the node/plugin system so that's what will handle wiring up event i/o
 * and enable native multithreaded graphs. 
 * Use flags, intervals, and animation loops where appropriate to avoid overrun. 
 * 
 * EX:
 * Thread 1:
 * Say ports a b and c emit events x y and z respectively at different times
 * 
 * This creates 3 events that can call postEvent separately
 * 
 * postEvent tags the output object with the event tag based on the port emitting to it
 * 
 * 
 * 
 * 
 */

import {StateManager} from '../../ui/StateManager'

export class Events {
    constructor(workermanager=undefined) {

        this.state = new StateManager({},undefined,false); //trigger only state (no overhead)
        this.workermanager = workermanager;

        if(workermanager) { //only in window
            let found = workermanager.workerResponses.find((foo) => {
                if(foo.name === 'eventmanager') return true;
            });
            if(!found) {
                workermanager.addCallback('eventmanager',this.workerCallback);
            }
        } 

    }

    //subscribe a to an event, default is the port reponse 
    subEvent(eventName, response=(output)=>{console.log(eventName,output);}) {
        return this.state.subscribeTrigger(eventName,response);
    }

    unsubEvent(eventName, sub) {
        return this.state.unsubscribeTrigger(eventName,sub);
    }

    //add an event name, can optionally add them to any threads too from the main thread
    addEvent(eventName,origin=undefined,foo=undefined,workerIdx=undefined) {
        this.state.setState({[eventName]:undefined});
        if(this.workermanager) {
            if(origin) {
                if(workerIdx) {
                    this.workermanager.postToWorker({origin:origin,foo:'addevent',input:[eventName,foo]},i);
                } else {
                    this.workermanager.workers.forEach((w,i)=>{
                        this.workermanager.postToWorker({origin:origin,foo:'addevent',input:[eventName,foo]},i); //add it to all of them since we're assuming we're rotating threads
                    });
                }
            }
        }
    }

    //remove an event
    removeEmitter(eventName) {
        this.state.unsubscribeAllTriggers(eventName);
    }

    //use this to set values by event name, will post messages on threads too
    emit(eventName, val) {
        let output = val;
        if(typeof output === 'object') {
            output.eventName = eventName;
        }
        else {
            output = {eventName:eventName, output:output};
        }
        // run this in global scope of window or worker. since window.self = window, we're ok
        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            postMessage(output); //thread event 
        } else if (this.workermanager) {
            this.workermanager.postTo
        }

        this.state.setState({[eventName]:val}); //local event 
    }

    workerCallback = (msg) => {
        if(typeof msg === 'object') {
            if(msg.eventName) {
                this.state.setState({[msg.eventName]:msg.output});
            }
        }
    }

    // portResponse = (eventName) => {
    //     let event = this.events.get(eventName);
    //     if(event && event.port) return this.state.subscribeTrigger(event.id,(output) => {event.port.set(output)});
    //     else return undefined;
    // }

    // //add an event when a port emits a value (sets state)
    // portEventEmitter(eventName, port) {
    //     let event = {name:eventName, id:randomId('event'), port:port, sub:undefined};
    //     if(port) event.sub = this.state.subscribeTrigger(port.id,(val)=>{this.emit(eventName,val);});
    //     this.events.set(eventName,event);
        
    //     return event;
    // }


    export = () => {
        return this
    }
}