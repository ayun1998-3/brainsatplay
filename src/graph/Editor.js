import { StateManager } from '../ui/StateManager.js'

// Project Selection
// import {appletManifest} from '../../../../platform/appletManifest' // MUST REMOVE LINKS TO PLATFORM
import { getAppletSettings } from "../utils/general/importUtils.js"
import { ProjectManager } from '../utils/ProjectManager.js'
import {getLibraryVersion, load, getSettings} from '../utils/projectUtils.js'


// Node Interaction
import { Port } from './Port.js'

export class Editor{
    constructor(parent=document.body, loadedApps={}) {

        // Create Project Manager
		this.projects = new ProjectManager()
		this.projects.init()

        this.parentNode = (typeof parent === 'string') ? document.getElementById(parent) : parent 

        this.graph=null
        this.shown = false
        this.context = {
            scale: 1
        }
        this.searchOptions = []
        this.local = window.location.origin.includes('localhost')

        this.toggle = null

        this.loadedApps = loadedApps

        this.selectorToggle = null
        this.search = null
        this.state = new StateManager()

        this.lastMouseEvent = {}

        this.files = {}

        this.open = false

        this.props = {
            id: String(Math.floor(Math.random()*1000000)),
            projectContainer: null,
            projectDefaults: null,
            lastClickedProjectCategory: '',
            galleries: {},
            currentApp: null,
        }

        // Set Shortcuts
        document.addEventListener('keydown', this.shortcutManager);

        // Create UI
        this.elementTypesToUpdate = ['INPUT', 'SELECT', 'OUTPUT', 'TEXTAREA']
    
            this.container = document.createElement('div')
            this.container.id = `${this.props.id}GraphEditorMask`
            this.container.classList.add('brainsatplay-default-container')
            this.container.classList.add('brainsatplay-node-editor')
            this.container.style.background = 'black'
            this.container.style.display ='none'
            this.container.innerHTML = `
                    <div id="${this.props.id}FileSidebar" class="brainsatplay-node-sidebar" style="min-width: 150px; width: 150px; height: 100%;">
                    </div>
                    <div id="${this.props.id}MainPage" class="main">
                        <div class="brainsatplay-node-editor-preview-wrapper">
                            <div id="${this.props.id}preview" class="brainsatplay-node-editor-preview">
                                <div style="width: 100%; height: 100%;" id="${this.props.id}defaultpreview"></div>
                            </div>
                        </div>
                        <div id="${this.props.id}ViewTabs" class="brainsatplay-node-editor-tabs">
                        </div>
                        <div id="${this.props.id}Editor" class="brainsatplay-node-viewer">
                        </div>
                    </div>
                    <div id="${this.props.id}GraphEditor" class="brainsatplay-node-sidebar">
                        <div>
                            <div class='node-sidebar-section'>
                                <h3>Projects</h3>
                            </div>
                            <div id="${this.props.id}projects" class='node-sidebar-content'>
                            </div>
                            <div class='node-sidebar-section'>
                                <h3>Project Info</h3>
                            </div>
                            <div id="${this.props.id}settings" class='node-sidebar-content'></div>
                            <div class='node-sidebar-content' style="display: flex; flex-wrap: wrap; padding: 10px;">
                                <button id="${this.props.id}download" class="brainsatplay-default-button">Download Project</button>
                                <button id="${this.props.id}reload" class="brainsatplay-default-button">Reload Project</button>
                                <button id="${this.props.id}save" class="brainsatplay-default-button">Save Project</button>
                                <button id="${this.props.id}publish" class="brainsatplay-default-button">Publish Project</button>
                                <button id="${this.props.id}exit" class="brainsatplay-default-button">Close Editor</button>
                            </div>
                            <div class='node-sidebar-section'>
                                <h3>Node Editor</h3>
                                <button id="${this.props.id}add" class="brainsatplay-default-button addbutton">+</button>
                            </div>
                            <div id="${this.props.id}portEditor" class='node-sidebar-content'>
                            <p></p>
                            </div>
                        </div>
                        <div>
                            <div id="${this.props.id}params" class='node-sidebar-content' style="display: flex; flex-wrap: wrap; padding-top: 10px;">
                                <button id="${this.props.id}edit" class="brainsatplay-default-button">Edit Node</button>
                                <button id="${this.props.id}delete" class="brainsatplay-default-button">Delete Node</button>
                            </div>
                        </div>
                    </div>
                `
        
            // this.element = new DOMFragment(
            //     this.container,
            //     this.parentNode,
            //     undefined,
            //     () => {
                    // Set UI Attributes
                    this.filesidebar = {}
                    this.filesidebar.container = this.container.querySelector(`[id="${this.props.id}FileSidebar"]`)
                    this.mainPage = this.container.querySelector(`[id="${this.props.id}MainPage"]`)
                    this.editor = this.container.querySelector(`[id="${this.props.id}Editor"]`)
                    this.viewer = this.container.querySelector(`[id="${this.props.id}NodeViewer"]`)
                    this.preview = this.mainPage.querySelector('.brainsatplay-node-editor-preview')
                    this.sidebar = this.container.querySelector(`[id="${this.props.id}GraphEditor"]`)
                    this.download = this.container.querySelector(`[id="${this.props.id}download"]`)
                    this.reload = this.container.querySelector(`[id="${this.props.id}reload"]`)
                    this.exit = this.container.querySelector(`[id="${this.props.id}exit"]`)
                    this.defaultpreview = this.container.querySelector(`[id="${this.props.id}defaultpreview"]`)
                    this.portEditor = this.container.querySelector(`[id="${this.props.id}portEditor"]`)
                    this.edit = this.container.querySelector(`[id="${this.props.id}edit"]`)
                    this.delete = this.container.querySelector(`[id="${this.props.id}delete"]`)
                    this.saveButton = this.container.querySelector(`[id="${this.props.id}save"]`)
                    this.tabs = this.container.querySelector(`[id="${this.props.id}ViewTabs"]`)
                // } // setup function, moved to init
            // )

        window.addEventListener('resize', this.responsive)


        // Setup UI (only once)
        this.insertProjects()

        // Setup User Interactions
        let publishButton = this.container.querySelector(`[id="${this.props.id}publish"]`)
        publishButton.onclick = () => {
            this.props.currentApp.updateGraph()
            // this.projects.publish(this.props.currentApp)
        }
        publishButton.classList.add('disabled')

        this.edit.style.display = 'none'
        this.delete.style.display = 'none'

        this.download.onclick = () => {
            this.projects.download(this.props.currentApp, undefined, () => {this.download.classList.remove('disabled')}, () => {this.download.classList.add('disabled')})
        }

        this.saveButton.onclick = () => {this.save(this.props.currentApp)}
        this.reload.onclick = () => {this.props.currentApp.reload()}

        this.exit.onclick = () => {this.toggleDisplay()}

        // Create Tab Container
        this.createViewTabs()

        // Insert Node Selector with Right Click
        this.toggleContextMenuEvent(this.editor)

        // Search for Plugins
        this.createPluginSearch(this.mainPage)

        // Start the Editor
        this.setApp()
    }


    // Shortcuts
    shortcutManager = (e) => {
        if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {

                if (e.key === 'e') { // Toggle Editor
                    e.preventDefault();
                    this.toggleDisplay()
                }
                else if (e.key === 's') { // Save Application
                    if (this.shown){
                        e.preventDefault();
                        this.props.currentApp.graphs.forEach(g => g.save())
                        this.save(this.props.currentApp)
                    }
                }
        }
    }

    // Save App
    save = async (app) => {
        app.info.graphs = app.export() // Replace settings
        await this.projects.save(app, () => {
            this.download.classList.remove('disabled')
        }, () => {
            this.download.classList.add('disabled')
        })
        this.lastSavedProject = app.name
    }

    // Apps
    setApp = (app) => {
        if (app != this.props.currentApp){

            // Swap Focused Editor UI
            if (this.open && app.uuid !== 'global') {

                // Move Out
                this.props.currentApp.ui.parent.appendChild(this.props.currentApp.ui.container)
                this.props.currentApp.graphs.forEach(g => g._resizeUI() )

                // Move In
                this.preview.appendChild(app.ui.container)
                app.graphs.forEach(g => g._resizeUI() )
            }

            this.props.currentApp = app

            // let graphFiles = this.files[app.uuid].graphs
            // Object.keys(graphFiles).find(uuid => {
            //     if (graphFiles[uuid]?.files?.graph?.tab) {
            //         graphFiles[uuid]?.files?.graph?.tab.click()
            //         return true
            //     }
            // })
            this.init()
        }
    }

    // Initialization
    init = async () => {

            this.portEditor.innerHTML = ''
            
            this.settings = Object.assign({parentId: this.props.currentApp?.ui?.parent?.id, show: false, create: true}, this.props.currentApp?.info?.editor ?? {})

            if (!document.getElementById(this.settings.parentId)) this.settings.parentId = this.props.currentApp?.ui?.parent?.id

            this.download.classList.add('disabled')

            this.createSettingsEditor(this.props.currentApp)

            // Setup Presentation Based On Settings
            if (this.settings.style) this.container.style = this.settings.style 

            if (this.settings.show) this.toggleDisplay(true)
        }

    setToggle = (app, toggle = this.settings?.toggle, activate=false) => {
        this.toggle = (typeof toggle === 'string') ? this.props.currentApp.ui.container.querySelector(`[id="${toggle}"]`) : toggle
        if (this.toggle) this.toggle.addEventListener('click', () => {this.toggleDisplay(undefined, app)})
        if (activate) this.toggleDisplay(undefined, app)
    }

    insertProject = ({settings, destination}) => {

            let restricted = ['BuckleUp', 'Analyzer', 'Brains@Play Studio', 'One Bit Bonanza', 'Applet Browser']

            if (!restricted.includes(settings.name)){

            // Set Experimental Version on Example Projects
            if (!['Defaults', 'My Projects'].includes(destination)) settings.version = 'experimental'

            let item = document.createElement('div')
            item.innerHTML = settings.name
            item.classList.add('brainsatplay-option-node')
            item.style.padding = '10px 20px'
            item.style.display = 'block'

            item.onclick = async () => {
                

                // Import App Only when Necessary
                let fullSettings = await getAppletSettings(settings)

                // Copy Template Projects
                if (destination !== 'My Project') fullSettings = Object.assign({}, fullSettings)

                // Create Application
                if (fullSettings.name === 'Load from File') {
                    let loadedSettings = await this.projects.loadFromFile()
                    if (loadedSettings) await this._createApp(loadedSettings)
                } else {
                    if (((this.lastSavedProject === this.props.currentApp.info.name) || this.props.lastClickedProjectCategory == 'My Projects') && destination === 'My Projects' && this.props.currentApp.info.name === fullSettings.name) await this._createApp(this.props.currentApp.info)
                    else await this._createApp(fullSettings)
                }
            // }
            this.props.lastClickedProjectCategory = destination

            }

            if (settings.name === 'Blank Project' || settings.name === 'Load from File') this.props.galleries[destination].insertAdjacentElement('afterbegin',item)
            else this.props.galleries[destination].insertAdjacentElement('beforeend',item)

            let header = this.props.galleries[destination].previousElementSibling
            if (header && header.classList.contains('active')) this._resizeGallery(destination) // show all
        }
    }

    insertProjects = async () => {

        // --------------- Create UI --------------- 
        this.props.projectContainer = this.container.querySelector(`[id="${this.props.id}projects"]`)
        this.props.projectContainer.style.padding = '0px'
        this.props.projectContainer.style.display = 'block'

        let galleries =  ['Defaults', 'My Projects', 'Templates', 'Library']
        galleries.forEach(k => {

            // Create Top Header
            if (k !== 'Defaults'){
                let div = document.createElement('div')
                div.classList.add(`brainsatplay-option-type`) 
                div.classList.add(`option-type-collapsible`)
                div.innerHTML = k
                this.addDropdownFunctionality(div)
                this.props.projectContainer.insertAdjacentElement('beforeend', div)
            }

            // Create Project List
            this.props.galleries[k] = document.createElement('div')
            this.props.galleries[k].id = `${this.props.id}-projectlist-${k}`
            this.props.galleries[k].classList.add("option-type-content")
            this.props.projectContainer.insertAdjacentElement(`beforeend`, this.props.galleries[k])

            if (k === 'Defaults') {
                this.props.projectDefaults = this.props.galleries[k]
                this._resizeGallery(k)
            }
        })

        // Add Load from File Button
        this.insertProject({settings: {name: 'Load from File'}, destination: 'Defaults'})

        // --------------- Get Project Settings Files --------------- 
        let projectSet = await this.projects.list()
        for (let key in projectSet) projectSet[key] = Array.from(projectSet[key])

        // --------------- Local --------------- 
        projectSet.local.map(async str => {
            let files = await this.projects.getFilesFromDB(str)
            await load(files).then(settings => {
                this.insertProject({destination: 'My Projects', settings})
            })
        })

        // // --------------- Templates --------------- 
        for (let key in this.loadedApps){
            try {
                let settings = this.loadedApps[key]
                if (settings.graphs || settings.zip) {
                    if (settings.categories.includes('templates')) this.insertProject({destination: 'Templates', settings})
                    else this.insertProject({destination: 'Library', settings})
                }
            } catch (e) { console.log(e)}
        }
    }

    async _createApp(settings){
        
        settings = await getSettings(settings) // filter through to get external .zip files

        settings.editor = {
            parentId: this.props.currentApp.ui.parent,
            show: true,
            style: `
            position: block;
            `,
        }

        this.props.currentApp.replace(settings)
    }

    createViewTabs = () => {

        // Add Tab Div
        let tabs = document.createElement('div')
        tabs.classList.add('tab')
        this.tabs.insertAdjacentElement('afterbegin', tabs)
    }
    
    removeGraph = (graph) => {
        if (this.files[graph.app.uuid].graphs[graph.uuid]){
            for (const key in this.files[graph.app.uuid].graphs[graph.uuid].files){
                let elements = this.files[graph.app.uuid].graphs[graph.uuid].files[key]
                if (elements.close) elements.close.click()
            }

            delete this.files[graph.app.uuid].graphs[graph.uuid]

            // Auto-Remove App from Editor
            if (Object.keys(this.files[graph.app.uuid].graphs).length === 0){
                this.files[graph.app.uuid].element.remove()
                delete this.files[graph.app.uuid]

            // Only Graph-Based Apps
            this.setApp(this.files[Object.keys(this.files)[0]].app) // set first app
            }
        }
    }

    addApp = (app) => {

        // TODO: Filter non-compliant structures 
        if (!this.files[app.uuid]) {

            // Tack on an Editor to the App
            app.editor = this // TODO: Fix since this arbitrarily adds an object to the apps...
            // Create Elements to Represent the App
            let element = document.createElement('div')

            let header = document.createElement('div')
            header.classList.add('header')
            header.classList.add('node-sidebar-section')
            header.innerHTML = `<h3>${app?.info?.name}</h3>`

            element.insertAdjacentElement('afterbegin', header)
            element.insertAdjacentHTML('beforeend', `
                <div class="brainsatplay-option-type option-type-collapsible">Graphs</div>
                <div class="graphs option-type-content"></div>

                <div class="brainsatplay-option-type option-type-collapsible">Code</div>
                <div class="code option-type-content">
            `)

            this.filesidebar[app.uuid] = {}                  
            this.filesidebar[app.uuid].graph = element.querySelector(`.graphs`)
            this.addDropdownFunctionality(this.filesidebar[app.uuid].graph.previousElementSibling)

            this.filesidebar[app.uuid].code = element.querySelector(`.code`) 
            this.addDropdownFunctionality(this.filesidebar[app.uuid].code.previousElementSibling)

            this.filesidebar[app.uuid].header = header

            if (app.uuid === 'global') this.filesidebar.container.insertAdjacentElement('afterbegin', element)
            else this.filesidebar.container.insertAdjacentElement('beforeend', element)

            this.files[app.uuid] = {app, graphs: {}, element}

            // Add Initial Graphs
            app.graphs.forEach(g => {
                this.addGraph(g)
            })

            // Initialize Current App OR Overwrite Global
            if (!this.props.currentApp || this.props.currentApp.uuid === 'global') this.setApp(app)
        }
    }

    addGraph(graph){

            this.addApp(graph.app)

            // Create Graph File
            let type = graph.constructor?.name
            this.files[graph.app.uuid].graphs[graph.uuid] = {name: graph.name, type, nodes: [], graph}
            this.files[graph.app.uuid].graphs[graph.uuid].elements = {}
            this.files[graph.app.uuid].graphs[graph.uuid].elements.code = (graph.ui.code instanceof Function) ? graph.ui.code() : graph.ui.code 
            this.files[graph.app.uuid].graphs[graph.uuid].elements.graph = (graph.ui.graph instanceof Function) ? graph.ui.graph() : graph.ui.graph 

            // Derive Display Settings
            let graphs = graph.info.graphs.length // initial nodes
            let nodes = graph.info.nodes.length // initial nodes
            let parentnodes = graph.parent?.info?.nodes?.length // initial nodes
            let showGraph = graph.app.uuid !== 'global' && type === 'Graph' && (nodes > 0 || (graphs === 0 && (parentnodes === 0 || parentnodes == undefined)))
            
            // Create File Representation
            this.createFileElement(this.files[graph.app.uuid].graphs[graph.uuid], {graph: showGraph})
    }

    addCloseIcon(parent, callback){
        let closeIcon = document.createElement('div')
        closeIcon.classList.add('closeIcon')

        if (callback){
            closeIcon.innerHTML = 'x'
            closeIcon.onclick = (ev) => {
                callback(ev)
            }
        }

        if (parent.style.position != 'absolute') parent.style.position = 'relative'
        parent.insertAdjacentElement('beforeend', closeIcon)
        return closeIcon
    }

    addTab(o, type, onOpen=()=>{}, lock=false){

        if (o.files[type].tab == null){
            let tab = document.createElement('button')
            tab.classList.add('tablinks')
            tab.innerHTML = o.name

            // Format Containers
            // if (o.elements[type] instanceof Function) o.elements[type] = o.elements[type]() // construct if required

            o.elements[type].style.position = 'absolute'
            o.elements[type].style.top = '0'
            o.elements[type].style.left = '0'
            this.editor.insertAdjacentElement('beforeend', o.elements[type])

            let isGraph = !!o.graph

            let defaultOnClose = (ev) => {
                ev.stopPropagation()
                let toOpen = tab.previousElementSibling ?? tab.nextElementSibling

                if (toOpen) toOpen.click()
                if (o.files[type].tab) o.files[type].tab.remove()
                delete o.files[type].tab
                o.elements[type].style.display = 'none'
            }

            o.files[type].close = this.addCloseIcon(tab, defaultOnClose)

            tab.onclick = () => {

                if (tab.style.display !== 'none'){
                    // Close Other Tabs
                    for (const app in this.files){
                        for (const name in this.files[app].graphs){
                            let file = this.files[app].graphs[name]
                            for (let type in file.files){
                                if (file.files[type]?.tab && file.elements[type]){
                                    if(file.files[type]?.tab != tab) {
                                        file.elements[type].style.display = 'none'
                                        file.files[type]?.tab.classList.remove('active')
                                    } else {
                                        file.elements[type].style.display = ''
                                        tab.classList.add('active')
                                        onOpen(file.elements[type])
                                        this.setApp(this.files[app].app) // swap to the app that this corresponds to
                                    }
                                }
                            }
                        }
                    }
                }


                if (isGraph) this.graph = o.graph
                else this.graph = null
                this.currentFile = o.files[type]

                this.responsive()
            }

            this.container.querySelector('.tab').insertAdjacentElement('beforeend', tab)
            this.responsive()
            o.files[type].tab  = tab
        }

        
        let currentTab = this.currentFile?.tab
        o.files[type].tab.click()
        if (currentTab && !lock) currentTab.click()

        return o.files[type].tab 
    }

    toggleContextMenuEvent = (el) => {
        el.addEventListener('contextmenu', (ev) =>{
            ev.preventDefault();
            this.nextNode = {
                position: {
                    x: ev.clientX,
                    y: ev.clientY
                }
            }
            // alert('success!');
            this.selectorToggle.click()
            return false;
        }, false);
    }

    createSettingsEditor(app){

            let target = app.info
            let settingsContainer = this.container.querySelector(`[id="${this.props.id}settings"]`)
            settingsContainer.innerHTML = ''

            // settings = Object.assign({}, settings) // shallow copy

            let toParse ={}

            let dummySettings = {
                name: "",
                devices: [""],
                author: "",
                description: "",
                categories: [],
                instructions: "",
                image: null,
                version: app.info.version ?? 'experimental',

                display: {
                  production: false,
                  development: false
                },

                intro: {
                    title: false,
                    mode: 'solo', // 'solo', 'multiplayer'
                    login: null,
                    domain: null,
                    session: null,
                    spectating: false,
                },

                // editor: {
                //     create: false,
                //     parentId: null,
                //     show: false,
                //     style: '',
                // },

                connect: {
                    filter: null,
                    toggle: null,
                    onconnect: () => {}
                },
            
                // App Logic
                // graph:
                // {
                //   nodes: [],
                //   edges: []
                // },
            }

            let inputDict = {}
            Object.keys(dummySettings).forEach(key => {
                if (target[key] == null) target[key] = dummySettings[key]
                toParse[key] = {data: target[key], target}
                toParse[key].input =  {type: typeof target[key]}

                switch(key){
                    case 'image':
                        toParse[key].input =  {type: 'file', accept: 'image/*'}
                        break
                    case 'instructions':
                        toParse[key].input =  {type: 'HTML'}
                        break    
                    default:
                        let type = typeof target[key]
                        if (type === 'object') if (Array.isArray(target[key])) type = Array
                        toParse[key].input =  {type}
                }

                let includeButDontShow = ['display', 'version']
                 
                if (!includeButDontShow.includes(key)){
                    let {container, input} = this.createObjectEditor(toParse, key)
                    if (container) {
                        settingsContainer.insertAdjacentElement('beforeend', container)
                        inputDict[key] = input
                    }
                }
            })

            delete this.state.data[`activeSettingsFile`]


        }

        _resizeGallery = (name) => {
            setTimeout(() => {if (this.props.galleries[name]) this.props.galleries[name].style.maxHeight = `${this.props.galleries[name].scrollHeight}px`}, 50)
        }


    toggleDisplay = (on, app) => {

        // Set App if not in Existing Apps
        if (app) this.setApp(app)

        if (this.props.currentApp) {
        // if (this.element){
            if (on === true || (on != false && this.open === false)){

                this.open = true
               
                // if (app != null) app.ui.parent.insertAdjacentElement('beforeend', this.container) ?? 
                this.parentNode.insertAdjacentElement('beforeend', this.container)
               
                setTimeout(() => {
                    this.container.style.display = ''
                // this.container.style.opacity = 1
                this.container.style.pointerEvents = 'auto'
                this.shown = true

                // Move App Into Preview
                    this.preview.appendChild(this.props.currentApp.ui.container)
                    this.defaultpreview.style.display = 'none'
                    // setTimeout(() => {
                        this.responsive()
                        this.props.currentApp.graphs.forEach(g => {
                            g._resizeUI() 
                            if (g === this.graph) {
                                this.graph.resizeAllNodes()
                                this.graph.resizeAllEdges()
                                // this.graph._nodesToGrid()
                            }
                        })
                    this._resizeGallery('Defaults')
                },50)
            } else if (!on) {

                this.open = false

                this.container.style.display = 'none'
                // this.container.style.opacity = 0
                this.container.style.pointerEvents = 'none'
                this.shown = false

                this.props.currentApp.ui.parent.appendChild(this.props.currentApp.ui.container)

                this.defaultpreview.style.display = 'block'
                this.responsive()
                this.props.currentApp.graphs.forEach(g => {
                    g._resizeUI() 
                })
            }
        }
    }


    createObjectEditor(toParse, key){

        // Properly Nest Divs
        let container = document.createElement('div')
        let innerContainer = document.createElement('div')
        let label = document.createElement('p')
        label.innerHTML = key

        innerContainer.insertAdjacentElement('beforeend', label)
        container.insertAdjacentElement('beforeend', innerContainer)

        if (toParse[key] instanceof Port) {
            label.style.cursor = 'pointer'

            label.onclick = () => {
                toParse[key].edit('self')
            }
        }

        let inputContainer = document.createElement('div')
        inputContainer.style.position = 'relative'

        if (!!toParse[key] && toParse[key].edit != false){ // only parse ports that exist on initialization

            // Port Type
            let defaultType = toParse[key].output?.type  // Otherwise specified output type
            if (defaultType == null) {
                if (defaultType === null) defaultType = toParse[key].input?.type // Input if output is null
                if (defaultType == null) defaultType = typeof toParse[key].data // Last option: Data type if output is undefined
            }

            if (typeof defaultType !== 'string' && defaultType?.name) defaultType = defaultType.name
            // Catch Functions
            if (defaultType === 'function') defaultType = 'Function'

            // Filter out elements
            defaultType = (defaultType === "object" ? toParse[key].data instanceof HTMLElement : toParse[key].data && typeof toParse[key].data === "object" && toParse[key].data !== null && toParse[key].data.nodeType === 1 && typeof toParse[key].data.nodeName==="string") ? 'Element' : defaultType
            

            let specifiedOptions = toParse[key].options
            let optionsType = typeof specifiedOptions
            let input
        // Cannot Handle Objects or Elements

        if (defaultType && defaultType != 'undefined' && defaultType != 'Element'){
            if (optionsType == 'object' && specifiedOptions != null){
                    let options = ``
                    specifiedOptions.forEach(option => {
                        let attr = ''
                        if (option === toParse[key].data) attr = 'selected'
                        options += `<option value="${option}" ${attr}>${option}</option>`
                    })
                    input = document.createElement('select')
                    input.innerHTML = options
            } else if (defaultType === 'Array'){

                if (!Array.isArray(toParse[key].data)) toParse[key].data = []

                let container = document.createElement('div')
                container.style.width = '100%'
                container.style.fontSize = `75%`
                
                let insertOption = (v) => {
                    let option = document.createElement('div')
                    option.style.padding = '6px 0px'
                    option.innerHTML = v
                    this.addCloseIcon(option, () => {
                        option.remove()
                        toParse[key].data.find((val,i) => {
                            if (val === v){
                                toParse[key].data.splice(i,1)
                            }
                        })
                    })
                    container.insertAdjacentElement('beforeend',option)
                }

                input = document.createElement('div')
                input.style.width = '100%'

                toParse[key].data.forEach(v => {
                    insertOption(v)
                })

                let div = document.createElement('div')
                div.style= `
                    display: flex;
                    align-items: center;
                    width: 100%;
                    flex-grow: 0;
                `

                let textInput = document.createElement('input')
                textInput.type = 'text'
                textInput.placeholder = 'Add tag'

                let button = document.createElement('button')
                button.classList.add('brainsatplay-default-button')
                button.classList.add('addbutton')
                button.innerHTML = `+`
                button.onclick = () => {
                    let set = new Set(toParse[key].data)
                    if (!set.has(textInput.value)){
                        insertOption(textInput.value)
                        toParse[key].data.push(textInput.value)
                    }
                    textInput.value = ''
                }

                div.insertAdjacentElement('beforeend',textInput)
                div.insertAdjacentElement('beforeend',button)
                input.insertAdjacentElement('beforeend',container)
                input.insertAdjacentElement('beforeend',div)


            } else if (defaultType === 'object'){
                input = document.createElement('textarea')
                input.value = JSON.stringify(toParse[key].data, null, '\t')
            } else if (defaultType === 'boolean'){
                input = document.createElement('input')
                input.type = 'checkbox'
                input.checked = toParse[key].data
            } else if (defaultType === 'number'){
                if ('min' in toParse[key] && 'max' in toParse[key]){
                    input = document.createElement('input')
                    input.type = 'range'
                    input.min = toParse[key].min
                    input.max = toParse[key].max
                    if (toParse[key].step) input.step = toParse[key].step
                    let output = document.createElement('output')
                    inputContainer.insertAdjacentElement('afterbegin',output)
                    input.value = toParse[key].data
                    output.innerHTML = input.value
                } else {
                    input = document.createElement('input')
                    input.type = 'number'
                    input.value = toParse[key].data
                }
            } else if (['Function', 'HTML', 'CSS', 'GLSL'].includes(defaultType)){
                input = document.createElement('button')
                input.classList.add('brainsatplay-default-button')
                input.style.width = 'auto'
                input.innerHTML = `Edit ${defaultType}`

                input.onclick = () => {
                    toParse[key].edit()
                }
            } else if (defaultType === 'file'){
                
                let text = 'Choose File'
                input = document.createElement('input')
                input.type = 'file'
                input.accept = toParse[key].input?.accept // Only in new format

                if (toParse[key].input?.multiple){
                    input.multiple = true // Only in new format
                }
                input.style.display = 'none'

                // Add image display
                let button = document.createElement('button')
                let img = document.createElement('img')
                button.classList.add('brainsatplay-default-button')
                button.innerHTML = text
                button.style.width = 'auto'

                if (input.accept.includes('image')){
                    img.style = `
                        max-width: 50%;
                        cursor: pointer;
                    `

                    input.addEventListener('input', () => {
                        let file = input.files[0]
                        if (file){
                            var reader = new FileReader();
                            reader.onloadend = () => {
                                toParse[key].data = reader.result
                                if (toParse[key].data) {
                                    img.src = toParse[key].data
                                    img.style.display = ''
                                    button.style.display = 'none'
                                } else {
                                    img.style.display = 'none'
                                    button.style.display = ''
                                }
                            }
                            reader.readAsDataURL(file);
                        }
                    })
                
                if (toParse[key].data != null){
                    img.src = toParse[key].data
                    img.style.display = ''
                    button.style.display = 'none'
                } else {
                    img.style.display = 'none'
                    button.style.display = ''
                }
                inputContainer.insertAdjacentElement('beforeend',img)
            } 
                inputContainer.insertAdjacentElement('beforeend',button)

                img.onclick = button.onclick = () => {
                    input.click()
                    button.blur()
                }
            }
            else {
                    input = document.createElement('input')

                    // Check if Color String
                    if (defaultType == 'color' || /^#[0-9A-F]{6}$/i.test(toParse[key].value)){
                        input.type = 'color'
                    } else {
                        input.type = 'text'
                    }
                    input.value = toParse[key].data
            }

            // Add to Document
                inputContainer.insertAdjacentElement('beforeend',input)
                container.insertAdjacentElement('beforeend',inputContainer)
                container.classList.add(`content-div`)                

                // Update Object Data from Gui
                input.oninput = (e) => {
                    
        let value
        if (this.elementTypesToUpdate.includes(input.tagName)){
            if (input.tagName === 'TEXTAREA') {
                try{
                    value = JSON.parse(input.value)
                } catch (e) {console.warn('JSON not parseable', e)}
            }
            else if (input.type === 'checkbox') value = input.checked
            else if (input.type === 'file') value = input.files;
            else if (['number','range'].includes(input.type)) {
                let possibleUpdate = Number.parseFloat(input.value)

                if (!isNaN(possibleUpdate)) value = possibleUpdate
                else return

                if (input.type === 'range') {
                    input.parentNode.querySelector('output').innerHTML = input.value
                }
            }
            else value = input.value
            
            if (toParse[key] instanceof Port) toParse[key].set({value, forceUpdate: true}) // port
            else toParse[key].target[key] = value // settings or other objects

            if (!['number','range', 'text', 'color'].includes(input.type) && input.tagName !== 'TEXTAREA') input.blur()
        }
                }
                return {container, input}
            } else return {}
        } else return {}
    }

    async createFile(nodeInfo, name, graph){

        let activeNode = (nodeInfo.class) ? nodeInfo : null
        let cls = (nodeInfo.class) ? nodeInfo.class : nodeInfo

        if (name == null || name === '') name = `${cls.name}`
        let filename = `${name}.js`

        if (this.files[graph.app.uuid].graphs[filename] == null){
            this.files[graph.app.uuid].graphs[filename] = {}


            if (activeNode == null){
                // this.clickTab(this.files[graph.name].tab)
                let nodeInfo = await graph.addNode({class:cls})
                activeNode = nodeInfo.instance
            } 


            this.files[graph.app.uuid].graphs[filename].name = filename
            this.files[graph.app.uuid].graphs[filename].type = 'Plugin'
            // this.files[filename].container = activeNode.ui.code
            this.files[graph.app.uuid].graphs[filename].elements = {
                code: activeNode.ui.code,
                graph: activeNode.ui.graph
            }

            this.createFileElement(this.files[graph.app.uuid].graphs[filename])


            // Add Option to Selector
            this.addNodeOption({id:cls.id, label: cls.name, class:cls})

        } else {
            let files = this.files[graph.app.uuid].graphs[filename].files
            let toClick = files.code?.tab ?? files.code?.toggle
            toClick.click()
        }
    }

    createFileElement = (fileDict, initialize={}) => {

        fileDict.files = {}
        for (let type in fileDict.elements){

            if (fileDict.elements[type]){
            fileDict.files[type] = {}

            fileDict.files[type].toggle = document.createElement('div')
            fileDict.files[type].toggle.innerHTML = fileDict.name
                
            fileDict.files[type].toggle.classList.add('brainsatplay-option-node')
            fileDict.files[type].toggle.style.padding = '10px 20px'
            fileDict.files[type].toggle.style.display = 'block'
            fileDict.files[type].container = fileDict.elements[type]

            fileDict.files[type].toggle.onclick = () => {
                if (fileDict.files[type].tab == null){
                    fileDict.files[type].tab = this.addTab(fileDict, type, (el) => {
                        el.style.pointerEvents = 'all'
                        el.style.opacity = '1'
                    }, false)
                }
                fileDict.files[type].tab.click()
            }

            this.filesidebar[fileDict.graph.app.uuid][type].insertAdjacentElement('beforeend', fileDict.files[type].toggle)
            
            if (initialize[type]) fileDict.files[type].toggle.click()
        }
        }
    }
 
    createView(id=String(Math.floor(Math.random()*1000000)), className, content){
        let view = document.createElement('div')
        view.id = id
        view.className = className
        view.innerHTML = content
        this.mainPage.insertAdjacentElement('beforeend',view)
        return view
    }

    createPluginSearch = async (container) => {
        let selector = document.createElement('div')
        selector.id = `${this.props.id}nodeSelector`
        selector.style.opacity = '0'
        selector.style.pointerEvents = 'none'
        selector.classList.add(`brainsatplay-node-selector`)

        this.selectorMenu = document.createElement('div')
        this.selectorMenu.classList.add(`brainsatplay-node-selector-menu`)

        this.selectorToggle = this.container.querySelector(`[id="${this.props.id}add"]`)

        let toggleVisibleSelector = (e) => {
            if(!e.target.closest('.brainsatplay-node-selector-menu') && !e.target.closest(`[id="${this.props.id}add"]`)) this.selectorToggle.click()
        }

        this.selectorToggle.addEventListener('click', () => {
            if (selector.style.opacity == '1'){
                selector.style.opacity='0'
                selector.style.pointerEvents='none'
                this.search.value = ''
                this.matchOptions()
                document.removeEventListener('click', toggleVisibleSelector)
            } else {
                selector.style.opacity='1'
                selector.style.pointerEvents='all'
                document.addEventListener('click', toggleVisibleSelector)
            }
        })
        this.selectorMenu.insertAdjacentHTML('beforeend',`<input type="text" placeholder="Search"></input><div class="node-options"></div>`)
        selector.insertAdjacentElement('beforeend',this.selectorMenu)
        container.insertAdjacentElement('afterbegin',selector)

        // Populate Available Nodes
        let nodeDiv = document.createElement('div')
        this.search = this.selectorMenu.getElementsByTagName(`input`)[0]


        // Allow Search of Plugins
        this.search.oninput = (e) => {
            this.matchOptions()
        }

        let version = this.props.currentApp?.info?.version
        this.library = await getLibraryVersion(version)

        let usedClasses = []
        this.classRegistry = this.library.plugins

        this.addNodeOption(undefined)


        for (let className in this.classRegistry) this.addNodeOption(this.classRegistry[className])

        // TODO: Traverse all graphs
        // this.graphs.forEach(g => {        
        if (this.graph){
        this.graph.nodes.forEach(async n => {
            if (n.class != null){

            let cls = this.classRegistry[n.class.name]

            let checkWhere = async (n, cls) => {
                if (cls && n.class === cls){
                    // clsInfo.class = n.class
                    let baseClass = this.library.plugins[cls.name]

                    if (cls != baseClass){
                        info.category = null // 'custom'
                        this.addNodeOption({class: cls})
                    }
                } else {
                    this.addNodeOption({category: null, class: n.class})
                }
            }

            await checkWhere(n, cls)
        }
        })
    }
    // })

        this.selectorMenu.insertAdjacentElement('beforeend',nodeDiv)
        this.responsive()
    }

    matchOptions = () => {
        let regex;
        try {
            regex = new RegExp(`^${this.search.value}`, 'i')
        } catch (e) {
            console.error('Invalid search value')
        }

        let matchedHeaderTypes = []

        // Show Matching Headers
        let headers = this.selectorMenu.querySelectorAll('.brainsatplay-option-type')
        for (let header of headers){
            for (let cls of header.classList){
                if (cls.includes('nodetype-')){
                    let type = cls.replace('nodetype-','')
                    let labelMatch = (regex != null) ? regex.test(type) : false
                    if (labelMatch) {
                        matchedHeaderTypes.push(type)
                    }
                }
            }
        }

        this.searchOptions.forEach(o => {

            let change = 0
            let show = false
            let parent = o.element.parentNode
            let nodetype = Array.from(o.element.parentNode.classList).find(cls => cls.includes('nodetype-'))
            nodetype = nodetype.replace('nodetype-','')

            if (this.search.value !== ''){

                if (matchedHeaderTypes.includes(nodetype)) show = true // Show header if matched
                else {
                    // Check Label
                    let labelMatch = (regex != null) ? regex.test(o.name) : false

                    if (labelMatch || o.lock == true) show = true

                    // Check Types
                    o.types.forEach(type => {
                        let typeMatch = (regex != null) ? regex.test(type) : false
                        if (typeMatch) show = true
                    })
                }

                if (show && o.element.style.display === 'none') {
                    o.element.style.display = ''
                    change = 1
                } else if (!show && o.element.style.display !== 'none') {
                    o.element.style.display = 'none'
                    change = -1
                }
            } else if (o.element.style.display === 'none'){
                o.element.style.display = ''
                change = 1
            }

            let count = this.container.querySelector(`.${o.category}-count`)
            if (count) {
                let numMatching = Number.parseFloat(count.innerHTML) + change
                count.innerHTML = numMatching

                // Open/Close Dropdown
                if (parent.previousElementSibling){
                    if (show) {
                        parent.previousElementSibling.classList.add("active");
                        parent.style.maxHeight = parent.scrollHeight + "px";
                    } else if (numMatching === 0 || this.search.value === '') {
                        parent.previousElementSibling.classList.remove('active') // Close dropdown
                        parent.style.maxHeight = null
                    }

                    // Also Show/Hide Toggle
                    if (!show && numMatching === 0) parent.previousElementSibling.style.display = 'none'
                    else parent.previousElementSibling.style.display = ''
                }
            }
        })
    }

    addNodeOption(classInfo={name:'newplugin', label: 'Add New Plugin', class: this.library.plugins.Blank, category: null, types: []}){
        
        if (!('types' in classInfo)) classInfo.types = []


        let type = classInfo.category
        let id = classInfo.id // TODO Fix this
        let name = classInfo?.class?.name ?? classInfo.name
        let label = classInfo.label

        if (type !== undefined){
        let options = this.selectorMenu.querySelector(`.node-options`)
        let contentOfType = options.querySelector(`.option-type-content.nodetype-${type}`)
        if (contentOfType == null) {

            contentOfType = document.createElement('div')
            contentOfType.classList.add('option-type-content')
            contentOfType.classList.add(`nodetype-${type}`)

            if (type != null){
                let selectedType = document.createElement('div')
                selectedType.innerHTML = type[0].toUpperCase() + type.slice(1)
                selectedType.classList.add(`brainsatplay-option-type`)
                selectedType.classList.add(`option-type-collapsible`)
                selectedType.classList.add(`nodetype-${type}`)

                let count = document.createElement('div')
                count.classList.add('count')
                count.classList.add(`${type}-count`)
                count.innerHTML = 0
                selectedType.style.display = 'none' // Initialily hide the header

                selectedType.insertAdjacentElement('beforeend',count)
                options.insertAdjacentElement('beforeend',selectedType)
                this.addDropdownFunctionality(selectedType)
            }

            options.insertAdjacentElement('beforeend',contentOfType)
        }

        let element = contentOfType.querySelector(`.${name}`)
        if (element == null){
            element = document.createElement('div')
            element.classList.add("brainsatplay-option-node")
            element.classList.add(`${id}`)
            element.innerHTML = `<p>${label ?? name}</p>`
            

            if (classInfo.label === 'Add New Plugin') classInfo.lock = true
            element.onclick = async () => {

                if (classInfo.label === 'Add New Plugin') {
                    Object.assign(classInfo, {
                        class:this.library.plugins.Blank,
                        name: (this.search.value) ? this.search.value : 'blank'
                    })
                }

                if (!('class' in classInfo)) {
                    classInfo.class = this.classRegistry[classInfo.name]
                    // let module = await dynamicImport(classInfo.folderUrl)
                    // classInfo.class = module[classInfo.name]
                }
    
                await this.graph.addNode(classInfo)
                this.responsive()
                // onClick()
                this.container.querySelector(`[id="${this.props.id}add"]`).click() // Close menu
            }

            // element.insertAdjacentElement('beforeend',labelDiv)
            contentOfType.insertAdjacentElement('beforeend',element)

            if (classInfo == null){}
            else if (classInfo.hidden && !this.local) element.remove()
            else {
                if (classInfo.hidden) element.classList.add("experimental")

                // Add Instance Details to Plugin Registry

                let types = classInfo.types.map(t => {
                    if (typeof t === 'string' && t.includes('Element')) return eval(t)
                    else return t
                    // if (type instanceof Object) types.add(type.name)
                })

                this.searchOptions.push({name, element, types, category: type, lock: classInfo.lock})
                if (type == null) contentOfType.style.maxHeight = 'none'; // Resize options without a type (i.e. not hidden)

                let count = options.querySelector(`.${type}-count`)
                let header = options.querySelector(`.nodetype-${type}`)
                if (count) {
                    count.innerHTML = Number.parseFloat(count.innerHTML) + 1
                    if (Number.parseFloat(count.innerHTML) === 0) header.style.display = 'none'
                    else header.style.display = ''
                }
            } 
        }
    }
    }

    addDropdownFunctionality = (node) => {
        node.onclick = () => {
            node.classList.toggle("active");
            var content = node.nextElementSibling;
            if (content.style.maxHeight) content.style.maxHeight = null; 
            else content.style.maxHeight = content.scrollHeight + "px";
        }
    }



    responsive = () => {
        if (this.tabs){
            let mainWidth =  this.container.offsetWidth - this.sidebar.offsetWidth - this.filesidebar.container.offsetWidth
            this.mainPage.style.width = `${mainWidth}px`
            if (this.preview.innerHTML != '') {
                this.preview.style.height = `${window.innerHeight * this.mainPage.style.width/window.innerWidth}px`
                this.preview.parentNode.style.height = '100%'
            }
            else this.preview.parentNode.style.height = 'auto'
        }

        let selector = this.container.querySelector(`[id="${this.props.id}nodeSelector"]`)

        if (selector){
            selector.style.height = `${selector.parentNode.offsetHeight}px`
            selector.style.width = `${selector.parentNode.offsetWidth}px`
        }


        if(this.currentFile){

            let currentEditor = this.currentFile.container

            if (currentEditor.parentNode){
                // Set Grid Width and Height (only get bigger...)
                let newWidth = this.editor.clientWidth
                let oldWidth = Number.parseFloat(currentEditor.style.width.replace('px',''))
                if (oldWidth < newWidth || isNaN(oldWidth)) currentEditor.style.width = `${newWidth}px`
                let newHeight = currentEditor.parentNode.clientHeight
                let oldHeight = Number.parseFloat(currentEditor.style.height.replace('px',''))
                if (oldHeight < newHeight || isNaN(oldHeight)) currentEditor.style.height = `${newHeight}px`
                
                if (this.graph){

                    this.graph.nodes.forEach(n => {
                        n.resizeElement()
                        n.resizeAllEdges()
                    })
                }
            }
        }
    }

    deinit(){
        if (this.container){
            // this.container.style.opacity = '0'
            this.container.remove()
            // setTimeout(() => {this.container.remove()}, 500)
        }
        window.removeEventListener('resize', this.responsive)
    }
}