// import {settings} from './blank/settings.js' // blank demo
import {settings} from './webcam/settings.js' // webcam demo
// import {settings} from './app/settings.js' // breath garden


import * as brainsatplay from './src/index.js'

// console.log(brainsatplay)
// window.brainsatplay = brainsatplay

// ------------------ Session ------------------
let session = new brainsatplay.Session()

// ------------------ Application ------------------
let app =  new brainsatplay.App(

    settings,           // Application Settings
    document.body,      // Parent DOM Node
    session,            // Base Brains@Play Session
    []                  // Configuration Settings

)

app.init()

// ------------------ Editor ------------------
let editor = new brainsatplay.Editor(document.body) // Edit the application (optional)

// Add Global App
if (session.app) editor.addApp(session.app)

// Add Local App
editor.addApp(app)