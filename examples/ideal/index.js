import {settings} from './settings.js' // ideal settings file
import * as brainsatplay from '../src/index.js'

/* ------------------------------- Session -------------------------------

The Session class manages all settings relevant to a single session.
In other words, this resets once the user closes the browser.

-------------------------------------------------------------------------- */

let session = new brainsatplay.Session()

/* --------------------------------- App ---------------------------------

The App class manages the active graphs of the current website.

-------------------------------------------------------------------------- */

let app =  new brainsatplay.App(

    settings,           // Application Settings
    document.body,      // Parent DOM Node
    session,            // Base Brains@Play Session
    []                  // Configuration Settings

)

await app.init()

/* ----------------------------- Async Callbacks -----------------------------

These Async Callbacks allow users to access any point on Apps on-demand.

------------------------------------------------------------------------------- */

app.enumerateGraphs().then((arr) => {
    arr.forEach(g => {
        g.enumerateNodes().then(arr => arr.forEach(d => console.log(d)))
    })
})
.catch(e => console.error(e));

/* ------------------------------- Editor -------------------------------

The Editor allows users to create and inspect Apps in real-time.

------------------------------------------------------------------------- */

let editor = new brainsatplay.Editor(document.body) // edit the application (optional)
if (session.app) editor.addApp(session.app) // add global app
editor.addApp(app) // add local app