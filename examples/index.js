import {settings} from './blank/settings.js' // blank demo

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
session.edit(document.body) // Edit the application (optional)

