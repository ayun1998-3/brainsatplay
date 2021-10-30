import {Session} from '../../../libraries/js/src/Session'
import {DOMFragment} from '../../../libraries/js/src/ui/DOMFragment'
import { WorkerManager } from '../../../libraries/js/src/utils/workers/Workers';
import { ThreadedCanvas } from '../../../libraries/js/src/utils/workers/ThreadedCanvas'

import * as settingsFile from './settings'

//WIP WIP WIP WIP WIP WIP WIP
export class MultithreadedApplet {

    constructor(
        parent=document.body,
        bci=new Session(),
        settings=[]
    ) {
    
        //-------Keep these------- 
        this.session = bci; //Reference to the Session to access data and subscribe
        this.parentNode = parent;
        this.info = settingsFile.settings;
        this.settings = settings;
        this.AppletHTML = null;
        //------------------------

        this.props = { //Changes to this can be used to auto-update the HTML and track important UI values 
            id: String(Math.floor(Math.random()*1000000)), //Keep random ID
            //Add whatever else
        };

        //etc..
        this.loop = null;
        this.looping = false;
   
        this.canvas = null;
        this.ctx = null;
        this.angle = 0;
        this.angleChange = 0.001;
        this.bgColor = 'black'

        this.worker1Id;
        this.worker1Waiting = false;
        this.worker2Id;
        this.worker2Waiting = false;
        this.canvasWorkerId;
        this.canvasWorkerWaiting = false;

        this.thread1lastoutput = 1;
        this.increment = 0.001;

    }

    //---------------------------------
    //---Required template functions---
    //---------------------------------

    //Initalize the app with the DOMFragment component for HTML rendering/logic to be used by the UI manager. Customize the app however otherwise.
    init() {

        //HTML render function, can also just be a plain template string, add the random ID to named divs so they don't cause conflicts with other UI elements
        let HTMLtemplate = (props=this.props) => { 
            return `
            <div id=${props.id}>
                <div style='position:absolute;'>
                    <button id='${props.id}input'>Increment</button>
                </div>
                <canvas id='${props.id}canvas' style='z-index:1;'></canvas>
            </div>
            `;
        }

        //HTML UI logic setup. e.g. buttons, animations, xhr, etc.
        let setupHTML = (props=this.props) => {
            this.canvas = document.getElementById(props.id+"canvas");
            this.ctx = this.canvas.getContext('2d');

            document.getElementById(props.id+'input').onclick = () => {
                
                if(this.canvasWorkerWaiting === false) { 
                    window.workers.postToWorker({foo:'add',input:[this.increment,0.001]});
                }
            };

            this.canvasWorker = new ThreadedCanvas(
                this.canvas,
                '2d',
                this.draw().toString(),
                {angle:0,angleChange:0.000,bgColor:'black'}, //'this' values, canvas and context are also available under 'this'
                this.canvasWorkerId
            );    // This also gets a worker

            this.canvasWorker.startAnimation();

        }

        this.AppletHTML = new DOMFragment( // Fast HTML rendering container object
            HTMLtemplate,       //Define the html template string or function with properties
            this.parentNode,    //Define where to append to (use the parentNode)
            this.props,         //Reference to the HTML render properties (optional)
            setupHTML,          //The setup functions for buttons and other onclick/onchange/etc functions which won't work inline in the template string
            undefined,          //Can have an onchange function fire when properties change
            "NEVER"             //Changes to props or the template string will automatically rerender the html template if "NEVER" is changed to "FRAMERATE" or another value, otherwise the UI manager handles resizing and reinits when new apps are added/destroyed
        );  

        if(this.settings.length > 0) { this.configure(this.settings); } //You can give the app initialization settings if you want via an array.


        if(!window.workers) { window.workers = new WorkerManager();}

        this.worker1Id = window.workers.addWorker(); // Thread 1
        this.worker2Id = window.workers.addWorker(); // Thread 2
        this.canvasWorkerId = window.workers.addWorker(); // Thread 3

        this.origin = this.props.id;

        window.workers.events.addEvent('thread1process',this.origin,undefined,this.worker1Id);
        window.workers.events.addEvent('thread2process',this.origin,undefined,this.worker2Id);

        window.workers.postToWorker({foo:'addfunc',input:['add',function add(a,b){return a+b;}.toString()],origin:this.origin},this.worker1Id);
        window.workers.postToWorker({foo:'addfunc',input:['mul',function mul(a,b){return a*b;}.toString()],origin:this.origin},this.worker1Id);
        //on input event send to thread 1

        window.workers.events.subEvent('thread1process',(output) => { //send thread1 result to thread 2
            console.log('thread1',output);
            this.canvasWorkerWaiting = true;
            window.workers.postToWorker({foo:'mul',input:[increment,2]},this.worker2Id);
            this.increment = output;
        });

        window.workers.events.subEvent('thread2process',(output) => { //send thread2 result to canvas thread to update visual settings
            console.log('thread2',output);
            window.workers.postToWorker({foo:'setValues',input:{angleChange:output}},this.canvasWorkerId);
        });

        window.workers.events.subEvent('render',(output)=>{
            console.log('output',output);
            this.canvasWorkerWaiting = false;
        });

        //Add whatever else you need to initialize
        this.looping = true;
        this.loop = this.updateLoop();
        
    }

    //Delete all event listeners and loops here and delete the HTML block
    deinit() {
        this.looping = false;
        cancelAnimationFrame(this.loop);
        if(window.audio){
            if(window.audio.osc[0] != undefined) {
                window.audio.osc[0].stop(0);
            }
        }

        this.AppletHTML.deleteNode();
        //Be sure to unsubscribe from state if using it and remove any extra event listeners
    }

    //Responsive UI update, for resizing and responding to new connections detected by the UI manager
    responsive() {
        this.canvas.width = this.AppletHTML.node.clientWidth;
        this.canvas.height = this.AppletHTML.node.clientHeight;
        this.canvas.style.width = this.AppletHTML.node.clientWidth;
        this.canvas.style.height = this.AppletHTML.node.clientHeight;

        //this.draw();
    }

    configure(settings=[]) { //For configuring from the address bar or saved settings. Expects an array of arguments [a,b,c] to do whatever with for setup
        settings.forEach((cmd,i) => {
            //if(cmd === 'x'){//doSomething;}
        });
    }

    //--------------------------------------------
    //--Add anything else for internal use below--
    //--------------------------------------------

    mean(arr){
		let sum = arr.reduce((prev,curr)=> curr += prev);
		return sum / arr.length;
	}

    updateLoop = () => {
        if(this.looping){
            if(this.session.atlas.settings.heg && this.session.atlas.settings.deviceConnected) {
                let ct = this.session.atlas.data.heg[0].count;
                if(ct >= 2) {
                    let avg = 40; if(ct < avg) { avg = ct; }
                    let slice = this.session.atlas.data.heg[0].ratio.slice(ct-avg);
                    let score = this.session.atlas.data.heg[0].ratio[ct-1] - this.mean(slice);
                    this.angleChange = score; this.score += score;
                    document.getElementById(this.props.id+'score').innerHTML = this.score.toFixed(3);
                }
            }
            // this.draw();
            setTimeout(() => { this.loop = requestAnimationFrame(this.updateLoop); },16);
        }
    }

    draw = () => {
        let cWidth = this.canvas.width;
        let cHeight = this.canvas.height;
           // style the background
        let gradient = this.ctx.createRadialGradient(cWidth*0.5,cHeight*0.5,2,cWidth*0.5,cHeight*0.5,100*this.angle*this.angle);
        gradient.addColorStop(0,"purple");
        gradient.addColorStop(0.25,"dodgerblue");
        gradient.addColorStop(0.32,"skyblue");
        gradient.addColorStop(1,this.bgColor ?? 'black');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0,0,cWidth,cHeight);
        
        // draw the circle
        this.ctx.beginPath();

        this.angle += this.angleChange;

        let radius = cHeight*0.04 + (cHeight*0.46) * Math.abs(Math.cos(this.angle));
        this.ctx.arc(cWidth*0.5, cHeight*0.5, radius, 0, Math.PI * 2, false);
        this.ctx.closePath();
        
        // color in the circle
        this.ctx.fillStyle = this.cColor;
        this.ctx.fill();
        //console.log(this.ctx, this.cColor, this.bgColor)
        
    }

} 
