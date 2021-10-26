
//multithreaded event manager, spawn one per thread and import a single instance elsewhere.

/**
 * This is both a simple wrapper for a trigger-only state manager as well 
 * as an interface for multithreaded events for simpler, more dynamic threading pipelines
 * 
 * From any thread:
 * emit -> tx
 * rx -> run trigger 
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
    emit(eventName, input, workerIdx=undefined) {
        let output = input;
        if(typeof output === 'object') {
            output.eventName = eventName;
        }
        else {
            output = {eventName:eventName, output:output};
        }

        if (this.workermanager) { //when emitting values for workers, val should be an object like {input:0, foo'abc', origin:'here'}
            this.workermanager.postToWorker(output,workerIdx);
        } else if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
        // run this in global scope of window or worker. since window.self = window, we're ok
            postMessage(output); //thread event 
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