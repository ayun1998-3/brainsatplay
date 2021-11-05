import * as brainsatplay from '../src/index.js' // blank demo

// console.log(brainsatplay)
// window.brainsatplay = brainsatplay
import {MultithreadedApplet} from './MultithreadedApplet.js' // blank demo


// ------------------ Session ------------------
let session = new brainsatplay.Session()

// ------------------ Application ------------------
let app =  new MultithreadedApplet(
    document.body,      // Parent DOM Node
    session,            // Base Brains@Play Session
    []                  // Configuration Settings
)

app.init()

// // ------------------ Editor ------------------
// let editor = new brainsatplay.Editor(document.body) // Edit the application (optional)

// // Add Global App
// if (session.app) editor.addApp(session.app)

// // Add Local App
// editor.addApp(app)