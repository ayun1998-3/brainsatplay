import { Session } from './Session.js'
import { DOMFragment } from './utils/DOMFragment.js'
import { StateManager } from './utils/StateManager.js'
import { Graph } from './graph/Graph.js'

// Utilities
import { Dropdown } from "./ui/Dropdown.js";

// Images
import appletSVG from './ui/assets/th-large-solid.svg'
// import dragSVG from '../../assets/arrows-alt-solid.svg'
import nodeSVG from './ui/assets/network-wired-solid.svg'
import expandSVG from './ui/assets/expand-arrows-alt-solid.svg'
import deviceSVG from './ui/assets/wave-square-solid.svg'

// Workers
import { WorkerManager } from './utils/workers/WorkerManager.js';

export class App {
    constructor(
        info = {},
        parent = document.body,
        session = new Session(),
        settings = []
    ) {

        // ------------------- SETUP -------------------
        this.ui = {
            container: document.createElement('div') // wraps the app ui
        }

        this._setCoreAttributes(info, parent, session, settings)

        this.uuid = String(Math.floor(Math.random() * 1000000)),

        // Main Properties
        this.editor = null
        this.graphs = new Map() // graph execution
        this.devices = []

        if (!window.workers) window.workers = new WorkerManager()
        this.worker = {id: window.workers.addWorker()} // Create an app thread


        this.props = { // Changes to this can be used to auto-update the HTML and track important UI values 
            id: null, // Keep random ID
            sessionId: null, // Track Brainstorm sessions,
            ready: false,
            edgeCallbacks: [],
            elements: [],
        };

        // Track Data Streams
        this.streams = []

        // Track Analysis
        this.analysis = {
            default: [],
            dynamic: []
        }

        // Track Controls
        this.controls = []

        // Create Default Menu
        this._createMenu()

        // Set Shortcuts
        if (this.info.shortcuts != false) document.addEventListener('keydown', this.shortcutManager);

    }

    shortcutManager = (e) => {
        if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {

            if (e.key === 'r') { // Reload Application
                e.preventDefault();
                this.reload()
            }
            else if (e.key === 'd') { // Open Device Manager (FIX: Distinguish between multiple apps)
                e.preventDefault();
                this.session.toggleDeviceSelectionMenu(this.info?.connect?.filter)
            }
        }
    }

    // ------------------- NEW API STUFF -------------------

    enumerateGraphs = async () => { // App is really just a glorified graph collection
        return Array.from(this.graphs).map(arr => arr[1])
    }

    // ------------------- START THE APPLICATION -------------------

    init = async () => {

        this.props.sessionId = null

        // Keep Style of Previous Top-Level Wrapper
        if (this.props.id == null) this.ui.container.style = `height:100%; width:100%; max-height: 100vh; max-width: 100vw; position: relative; display: flex; overflow: scroll;`

        // Get New ID
        this.props.id = this.ui.container.id = String(Math.floor(Math.random() * 1000000))


        // Auto-Assign Single Graph Name
        if (this.info.graphs.length === 1 && this.info.graphs[0].name == null) this.info.graphs[0].name = this.info.name

        // Add Functionality to Applet 
        this.info.graphs.map(g => this.addGraph(g)) // initialize all graphs

        // Create Base UI
        this.AppletHTML = this.ui.manager = new DOMFragment( // Fast HTML rendering container object
            this.ui.container,       //Define the html template string or function with properties
            this.ui.parent,    //Define where to append to (use the parentNode)
            this.props,         //Reference to the HTML render properties (optional)
            this._setupUI,          //The setup functions for buttons and other onclick/onchange/etc functions which won't work inline in the template string
            undefined,          //Can have an onchange function fire when properties change
            "NEVER",             //Changes to props or the template string will automatically rerender the html template if "NEVER" is changed to "FRAMERATE" or another value, otherwise the UI manager handles resizing and reinits when new apps are added/destroyed,
            this._deinit,
            this.responsive
        )

        // Start Graph
        await Promise.all(Array.from(this.graphs).map(async a => await this.startGraph(a[1]))) // parallel


        // Register App in Session
        this.session.registerApp(this) // Rename

        // Create App Intro Sequence
        this.session.createIntro(this, async (sessionInfo) => {

            // this.tutorialManager.init();

            this.props.ready = true

            // Multiplayer Configuration
            this.props.sessionId = sessionInfo?.id ?? this.props.id
            this.session.startApp(this)

            // Run Specified Edge Onstart Callbacks
            this.graphs.forEach(async g => {
                for (const arr of Array.from(g.edges)) {
                    await Promise.all(arr[1].onstart.map(async (f) => { await f() }))
                }
            })
        })
}

// Properly set essential attributes for the App class (used on construction and when reloaded)
_setCoreAttributes = (info = {}, parent = document.body, session = new Session(), settings = []) => {

    // ------------------- DEFAULTS -------------------
    if (!('editor' in info)) info.editor = {}
    if (info.editor.toggle == null) info.editor.toggle = "brainsatplay-visual-editor"

    // ------------------- SETUP -------------------
    this.session = session; //Reference to the Session to access data and subscribe
    this.ui.parent = parent; // where to place the container
    info = this._copySettingsFile(info) // ensure that settings files do not overlap
    this.info = this.parseSettings(info) // parse settings (accounting for stringified functions)
    this.settings = settings // 
}

// Executes after UI is created
_setupUI = () => {

    // Create Device Manager
    this._createDeviceManager(this.info.connect ?? {})

    // Toggle Editor
    if ((this.info.editor.show) && this.editor) this.editor.toggleDisplay(true, this)

    // Resize App UI
    this.graphs.forEach(g => g._resizeUI())
}

// Populate the UI with a Device Manager
_createDeviceManager = ({ parentNode, toggle, filter, autosimulate, onconnect, ondisconnect }) => {
    let elements = this.session.connectDevice(parentNode, toggle, filter, autosimulate, onconnect, ondisconnect)
    this.props.elements.push(...elements)
}

// ------------------- STOP THE APPLICATION -------------------

deinit = async (soft = false) => {

    if (this.AppletHTML) {

        // Soft Deinit
        if (soft) {
            if (this.intro?.deleteNode instanceof Function) this.intro.deleteNode()
            // this._removeAllFragments()
            if (this.editor) this.editor.init()
        }

        // Hard Deinit
        else {
            if (this.editor) this.editor.deinit()
            document.removeEventListener('keydown', this.shortcutManager);
            this.AppletHTML.deleteNode();
            this.AppletHTML = null
            
            window.workers.terminate(this.worker.id);
        }

        this.session.removeApp(this)

        this.props.elements.forEach(el => {
            if (el) el.remove()
        })

        this.graphs.forEach(g => g.deinit())
        this.graphs = new Map()
    }
}

// ------------------- Additional Utilities -------------------
responsive = () => { }
configure = () => { }

// ------------------- Manipulation Utilities -------------------

replace = (info = this.info, parent = this.parent, session = this.session, settings = this.settings) => {
    this._setCoreAttributes(info, parent, session, settings)
    this.deinit(true)
    this.init()
}

reload = async () => {

    if (this.editor) this.editor.toggleDisplay(false)

    this.info.graphs = this.export() // Replace settings
    await this.deinit(true) // soft
    await this.init()
}

export = () => {

    let graphs = []

    this.graphs.forEach(g => {

        let graph = {
            nodes: Array.from(g.nodes).map(arr => arr[1].export()),
            edges: Array.from(g.edges).map(arr => arr[1].export()),
            graphs: Array.from(g.graphs).map(arr => arr[1].export()),
            events: Array.from(g.events).map(arr => arr[1].export())
        }

        graphs.push(graph)
    })

    return graphs

}

_createMenu = () => {

    var container = document.createElement('div');
    container.id = `${this.props.id}-brainsatplay-default-ui`
    container.classList.add('brainsatplay-default-interaction-menu')
    this.ui.container.insertAdjacentElement('beforeend', container);

    let headers = [{ label: 'Applet Menu', id: 'options-menu' }]

    let editLinkCreated = false
    let options = [
        {
            header: 'options-menu', content: `<div class="toggle"><img src="${deviceSVG}"></div><p>Connect Device</p>`, onclick: (el) => {
                this.session.toggleDeviceSelectionMenu(this.info.connect?.filter)
            }
        },
        {
            header: 'options-menu', content: '<div class="toggle">i</div><p>Info</p>', onclick: (el) => {
                if (infoMask.style.opacity != 0) {
                    infoMask.style.opacity = 0
                    infoMask.style.pointerEvents = 'none'
                } else {
                    infoMask.style.opacity = 1
                    infoMask.style.pointerEvents = 'auto'
                    appletMask.style.opacity = 0;
                    appletMask.style.pointerEvents = 'none';
                }
            }
        },
        {
            header: 'options-menu', content: `<div class="toggle"><img src="${nodeSVG}"></div><p>Edit</p>`, id: "brainsatplay-visual-editor", onload: (el) => {
                if (this.editor) this.editor.setToggle(this, el)
            }, onclick: (el) => {
                if (this.editor && !editLinkCreated) {
                    this.editor.setToggle(this, el, true)
                    editLinkCreated = true
                }
            }
        },
        // {header: 'options-menu', content: `<div class="toggle"><img src="${appletSVG}"></div><p>Browse Apps</p>`, id:"brainsatplay-browser", onclick: async (el) => {
        //         if (appletMask.style.opacity != 0) {
        //             appletMask.style.opacity = 0
        //             appletMask.style.pointerEvents = 'none'
        //         } else {
        //             appletMask.style.opacity = 1
        //             appletMask.style.pointerEvents = 'auto'
        //             infoMask.style.opacity = 0;
        //             infoMask.style.pointerEvents = 'none';
        //             // if (instance == null) {
        //             //     getAppletSettings(appletManifest['Applet Browser'].folderUrl).then((browser) => {

        //             //         let config = {
        //             //             hide: [],
        //             //             applets: Object.keys(appletManifest).map(async (key) => {
        //             //                 return await getAppletSettings(appletManifest[key].folderUrl)
        //             //             }),
        //             //             presets: presetManifest,

        //             //             // OLD
        //             //             appletIdx: appletIdx,
        //             //             showPresets: false,
        //             //             displayMode: 'tight'
        //             //         }

        //             //         Promise.all(config.applets).then((resolved) => {
        //             //             config.applets=resolved
        //             //             let instance  = new App(browser, appletMask, this.session, [config])

        //             //           // FIX
        //             //             instance.init()

        //             //             thisApplet.deinit = (() => {
        //             //                 var defaultDeinit = thisApplet.deinit;

        //             //                 return function() {    
        //             //                     instance.deinit()
        //             //                     appletDiv.querySelector(`.option-brainsatplay-browser`).click()                              
        //             //                     let result = defaultDeinit.apply(this, arguments);                              
        //             //                     return result;
        //             //                 };
        //             //             })()
        //             //         })
        //             //     })
        //             // }
        //         }
        // }},

        // {header: 'options-menu', content: `Drag`, onload: (el) => {
        //     let swapped = null
        //     el.classList.add("draggable")
        //     console.log(el)
        //     el.addEventListener('dragstart', () => {
        //         appletDiv.classList.add("dragging")
        //         console.log('dragging')
        //     })
        //     el.addEventListener('dragend', () => {
        //         appletDiv.classList.remove("dragging")
        //     })

        //     appletDiv.addEventListener('dragover', (e) => {
        //         e.preventDefault()
        //         if (this.prevHovered != appletDiv){
        //             let dragging = document.querySelector('.dragging')
        //             if (dragging){
        //                 let draggingGA = dragging.style.gridArea
        //                 let hoveredGA = appletDiv.style.gridArea
        //                 appletDiv.style.gridArea = draggingGA
        //                 dragging.style.gridArea = hoveredGA
        //                 this.responsive()
        //                 this.prevHovered = appletDiv
        //                 if (appletDiv != dragging){
        //                     this.lastSwapped = appletDiv
        //                 }
        //             }
        //         }
        //         appletDiv.classList.add('hovered')
        //     })

        //     appletDiv.addEventListener('dragleave', (e) => {
        //         e.preventDefault()
        //         appletDiv.classList.remove('hovered')
        //     })

        //     appletDiv.addEventListener("drop", (event) => {
        //         event.preventDefault();
        //         if (this.lastSwapped){
        //         let dragging = document.querySelector('.dragging')
        //         let draggingApplet = this.applets.find(applet => applet.name == dragging.name) 
        //             let lastSwappedApplet = this.applets.find(applet => applet.name == this.lastSwapped.name)
        //             let _temp = draggingApplet.appletIdx;
        //             draggingApplet.appletIdx = lastSwappedApplet.appletIdx;
        //             lastSwappedApplet.appletIdx = _temp;
        //             this.showOptions()
        //         }

        //         for (let hovered of document.querySelectorAll('.hovered')){
        //             hovered.classList.remove('hovered')
        //         }

        //     }, false);
        // }},
        {
            header: 'options-menu', content: `<div class="toggle"><img src="${expandSVG}"></div><p>Toggle Fullscreen</p>`, onclick: (el) => {
                const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
                if (!fullscreenElement) {
                    if (this.ui.container.requestFullscreen) {
                        this.ui.container.requestFullscreen()
                    } else if (this.ui.container.webkitRequestFullscreen) {
                        this.ui.container.webkitRequestFullscreen()
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen()
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen()
                    }
                }
            }
        },
        {
            header: 'options-menu', content: `<div class="toggle">?</div><p>Show Tutorial</p>`, onload: (el) => {

                if (this.tutorialManager != null) {
                    this.tutorialManager.clickToOpen(el)
                } else {
                    el.remove()
                }

            }
        },
    ]

    let dropdown = new Dropdown(container, headers, options, { hidden: true })

    let devices = this.info.devices ?? []
    let categories = this.info.categories ?? []
    let htmlString = `
        <div class="brainsatplay-default-applet-mask" style="position: absolute; top:0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.75); opacity: 0; pointer-events: none; z-index: 999; transition: opacity 0.5s; padding: 5%;">
        </div>
        <div class="brainsatplay-default-info-mask" style="position: absolute; top:0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.75); opacity: 0; pointer-events: none; z-index: 999; transition: opacity 0.5s; padding: 5%; overflow: scroll;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr)">
                <div>
                <h1 style="margin-bottom: 0; padding-bottom: 0;">${this.info?.name}</h1>
                <p style="font-size: 69%;">${this.info?.description}</p>
                </div>
                <div style="font-size: 80%;">
                    <p>Devices: ${devices.join(', ')}</p>
                    <p>Categories: ${categories.join(' + ')}</p>
                </div>
            </div>
            <hr>
            <h2>Instructions</h2>
            <p>${this.info.instructions}</p>
        </div>
        `

    this.ui.container.insertAdjacentHTML('beforeend', htmlString);
    let defaultUI = this.ui.container.querySelector(`.brainsatplay-default-interaction-menu`)

    // Flash UI
    setTimeout(() => {
        defaultUI.style.opacity = 1.0
        setTimeout(() => {
            defaultUI.style.opacity = ''
        }, 3000) // Wait to Fade Out 
    }, 1000)

    let appletMask = this.ui.container.querySelector('.brainsatplay-default-applet-mask')
    let infoMask = this.ui.container.querySelector('.brainsatplay-default-info-mask')
}

_copySettingsFile(info){
    let infoCopy = Object.assign({}, info)

    // ------------------- CONVERSIONS -------------------
    if (!('graphs' in infoCopy)) infoCopy.graphs = [] // create graph array
    if ('graph' in infoCopy) {
        infoCopy.graphs.push(infoCopy.graph) // push single graph
        delete infoCopy.graph
    }

    infoCopy.graphs = infoCopy.graphs.filter(g => Object.keys(g).length > 0)

    // ------------------- CONVERSIONS -------------------
    let keys = ['nodes', 'edges']
    infoCopy.graphs = [...infoCopy.graphs.map(g => Object.assign({}, g))]

    infoCopy.graphs.forEach(g => {
        keys.forEach(k => {
            if (g[k]) {
                g[k] = [...g[k]]
                g[k].forEach(o => {
                    o = Object.assign({}, o)
                    for (let key in o) {
                        if (o[key] === Object) o[key] = Object.assign({}, o[key])
                    }
                })
            }
        })
    })

    return infoCopy
}

// ------------------- GRAPH UTILITIES -------------------


addGraph = (info) => {
    let graph = new Graph(info, { app: this }); // top-level graph
    if (!this.graphs.get(graph.name)) this.graphs.set(graph.name, graph)
}

startGraph = async (g) => {
    await g.init()
}

removeGraph = (name = '') => {
    this.graphs.get(name).deinit()
    this.graphs.delete(name)
}

// ------------------- HELPER FUNCTIONS -------------------

// Unstringify Functions
parseSettings = (settings) => {

    settings.graphs.forEach(g => {
        if (g.nodes) g.nodes.forEach(n => {
            for (let k in n.params) {
                let value = n.params[k]
                let regex = new RegExp('(|[a-zA-Z]\w*|\([a-zA-Z]\w*(,\s*[a-zA-Z]\w*)*\))\s*=>')
                let func = (typeof value === 'string') ? value.substring(0, 8) == 'function' : false
                let arrow = (typeof value === 'string') ? regex.test(value) : false
                n.params[k] = (func || arrow) ? eval('(' + value + ')') : value;
            }
        })
    })
    return settings
}

// UI Helper
createFragment = (HTMLtemplate, parentNode, props, setupHTML, onchange, rerender = "NEVER", deinit, responsive) => {
    return new DOMFragment( // Fast HTML rendering container object
        HTMLtemplate,   //Define the html template string or function with properties
        parentNode,    //Define where to append to (use the parentNode)
        props,         //Reference to the HTML render properties (optional)
        setupHTML,          //The setup functions for buttons and other onclick/onchange/etc functions which won't work inline in the template string
        onchange,          //Can have an onchange function fire when properties change
        rerender,             //Changes to props or the template string will automatically rerender the html template if "NEVER" is changed to "FRAMERATE" or another value, otherwise the UI manager handles resizing and reinits when new apps are added/destroyed
        deinit, // deinit
        responsive // responsive (CHECK IF CORRECT)
    )
}
}