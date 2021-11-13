/**
 * Module for creating BCI application in Javascript.
 * @module brainsatplay
 */

 import 'regenerator-runtime/runtime' // must include or webpack breaks

// Default CSS Stylesheet
import './ui/styles/defaults.css' 

// Plugins
import * as plugins from './plugins/index.js'
export {plugins}

// Session Manager
export {Session} from './Session.js'

// App
export {App} from './App.js'

export {devices} from './devices/index.js'

// Editor
export {Editor} from './graph/Editor.js'


// export * from './src/analysis/Math2'

// CommonJS Exports Not Working for Node.js Utilities
// import * as brainstorm from './src/brainstorm/Brainstorm'
// export {brainstorm}

