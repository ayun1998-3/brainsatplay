import fileSaver from 'file-saver';
import * as projectUtils from './projectUtils.js'
import {saveFile, readFile, readFiles} from './DataManager.js'
import * as blobUtils from './general/blobUtils.js'

let latest = '0.0.39'
let cdnLink = `https://cdn.jsdelivr.net/npm/brainsatplay@${latest}`;

// ---------------------- Project Manager ----------------------
// A class to manage Brains@Play projects

export class ProjectManager {
    constructor() {
        this.helper = projectUtils.zipHelper
        this.folders = {
            app: null
        }

        this.local = location.hostname === "localhost" || location.hostname === "127.0.0.1"
        this.platform = window.brainsatplayPlatform
        this.latest = latest

        // Load Latest B@P Library
        this.libraries = {}

        // Set Server Connection Variables
        this.serverResolved = true
        this.publishURL = (this.local && this.platform) ? 'http://localhost/apps' : 'https://server.brainsatplay.com/apps'

        this.createDefaultHTML = (script) => {
            return `
        <!DOCTYPE html> 
        <html lang="en"> 
            <head>
                <title>Brains@Play Starter Project</title>
                <link rel='stylesheet' href='./style.css'>
                <script src="${cdnLink}"></script>
                ${script}
            </head>
            <body></body>
        </html>
        `}
    }

    init = async () => {
        this.version = this.latest
        projectUtils.getLibraryVersion('experimental')
        if (!this.local && this.platform) projectUtils.getLibraryVersion(this.version)

        // WAITING TAKES TOO DANG LONG
        // await projectUtils.getLibraryVersion('experimental')
        // if (!this.local && this.platform) await projectUtils.getLibraryVersion(this.version)
    }

    // ---------------------- Interaction Macros ----------------------
    async download(app, filename = app.info.name ?? 'brainsatplay', onsuccess, onerror) {
        await this.generateZip(app, (zip) => {
            fileSaver.saveAs(zip, `${filename}.zip`);
        }, onsuccess, onerror)
    }

    // async publish(app) {
    //     let dataurl = await this.appToDataURL(app)
    //     await saveFile(dataurl, `/projects/${app.info.name}`)  
    //     fetch(this.publishURL, {
    //         method: 'POST',
    //         headers: {
    //             'Content-type': 'application/json; charset=UTF-8'
    //         },
    //         body: JSON.stringify({
    //             name: app.info.name,
    //             authorId: this.session.info.auth.username,
    //             dataurl
    //         })
    //     }).then(res => res.json()).then(async data => {
    //         console.log('App Published!')
    //     }).catch(function (error) {
    //         console.warn('Something went wrong.', error);
    //     });
    // }

    async appToDataURL(app, onsuccess, onerror){
        return new Promise(async resolve => {
            await this.generateZip(app, (blob) => {
                onsuccess()
                blobUtils.blobToDataURL(blob, async (dataurl) => {
                    resolve(dataurl)
                })
            }, onerror)
        })
    }


    async save(app, onsuccess, onerror) {
        let dataurl = await this.appToDataURL(app, onsuccess, onerror)
        await saveFile(dataurl, `/projects/${app.info.name}`)  
        console.log('App Saved!')
    }

    // ---------------------- Project Saving ----------------------

    addDefaultFiles() {
        this.helper.file("index.html", this.createDefaultHTML(`<script src="./index.js" type="module"></script>`))


        this.helper.file("style.css", `body {
    font-family: Montserrat, sans-serif;
    color: white;
    background: black;
    width: 100vw; 
    height: 100vh;
}
        
#application {
    width: 100%; 
    height: 100%;
    display: flex;
    align-items: center; 
    justify-content: center; 
}`)

        this.helper.file("index.js", `import {settings} from './app/settings.js'
let app =  new brainsatplay.App(settings)
app.init()`)



    }

    initializeZip = () => {
        this.helper.remove("app")
        this.folders.app = this.helper.folder("app")
        this.addDefaultFiles()
    }

    async generateZip(app, onsuccess=()=>{}, onerror=()=>{}) {
        
        this.initializeZip()

        // Convert App to File
        let o = await this.appToFile(app)
        let classInfo = o.classes.map(this.classToFile)

        // Check Ability to Load
        let settings = await projectUtils.load([o, ...classInfo])
        let library = await projectUtils.getLibraryVersion(settings.version)
        let instance = (library.Application instanceof Function) ? new library.Application(settings) : new library.App(settings)

        await instance.init().then(() => {
        
        // Add Classes to Project
        classInfo.forEach(this.addClass)

        // Combine Custom Plugins into the Compact File
        let combined = ``;
        o.classes.forEach(c => combined += c.prototype.constructor.toString()) // Combine Custom Plugins into the Compact File
        // o.classes.forEach(c => { this.session.storage.set('plugins',c.name, c)}) // save separately
        combined += o.combined;

        this.folders.app.file(o.filename, o.content)
        this.helper.file("compact.html", `
            <!DOCTYPE html> 
            <html lang="en"> 
                <head>
                    <title>Brains@Play Starter Project (Single Threaded)</title>
                    <style>
                        body {
                            font-family: Montserrat, sans-serif;
                            color: white;
                            background: black;
                            width: 100vw; 
                            height: 100vh;
                        }
                                
                        #application {
                            width: 100%; 
                            height: 100%;
                            display: flex;
                            align-items: center; 
                            justify-content: center; 
                        }
                    </style>
                    <script src="${cdnLink}"></script>
                    <script type="module">
                        ${combined}
                        let app =  new brainsatplay.App(settings);
                        app.init();
                    </script>
                </head>
                <body></body>
            </html>`)
        this.helper.generateAsync({ type: "blob" })
            .then(function (content) {
                onsuccess(content)
            });
        }).catch((e) => {
            onerror(); 
            let msg = `Project cannot be saved: ${e}`
            alert(msg)
        }).finally(() => {
            instance.deinit()
        })
    }

    addClass = (info) => {
        return this.folders.app.file(info.filename, info.content)
    }
    async appToFile(app) {

        let info = JSON.parse(JSON.stringify(app.info))
        // let info = Object.assign({}, app.info)
        info.graphs = Array.from(app.graphs).map(arr => Object.assign({}, arr[1]))
        info.graphs.forEach(g => {
            if (g.edges) g.edges = Array.from(g.edges).map(arr => Object.assign({}, arr[1].export()))
           if (g.nodes) g.nodes = Array.from(g.nodes).map(arr => Object.assign({}, arr[1].export()))
        })

        // Default Settings
        info.connect = true

        if (info.version == null) info.version = this.version
        delete info.editor

        if (info.version === this.latest) info.version = 'experimental' // experimental defaults to the packaged version

        let library = await projectUtils.getLibraryVersion(info.version)
        let plugins = this.getPluginRegistry(library)
        
        let imports = ``
        // Add imports
        let classActive = []
        let classes = []

        info.graphs.forEach(g => {
        g.nodes.forEach(n => {

            let name = n.class.name
            let basePlugin = plugins[name]
            let same = basePlugin?.toString() === n.class?.toString() // no edits

            // Custom Plugin (not included by name)
            if (!same && !(name in classActive)) {
                imports += `import {${name}} from "./${name}.js"\n`
                classes.push(n.class)
            } 

            classActive[name] = !same
        
            n.class = name

            for (let k in n?.params){ 
                if (n.params[k] instanceof Function) n.params[k] = n.params[k].toString()
            } 
        })

        for (let key in g) {
            if (key != 'nodes' && key != 'edges') {
                delete g[key]
            }
        }
    })

        info = JSON.stringify(info, null, 2);

        // Replace Stringified Class Names with Actual References (provided by imports)
        var re = /"class":\s*"([^\/"]+)"/g;
        var m;

        do {
            m = re.exec(info);
            if (m) {
                // Replace only if custom
                if (classActive[m[1]]) info = info.replaceAll(m[0], '"class":' + m[1])
            }
        } while (m);


        return {
            name: app.info.name, filename: 'settings.js', content: `${imports}
        
        export const settings = ${info};`, combined: `const settings = ${info};\n`, classes
        }
    }

    classToFile(cls) {
        return { filename: `${cls.name}.js`, content: cls.toString() + `\nexport {${cls.name}}`, combined: cls.toString() + `\n` }
    }

    // ---------------------- Project Loading ----------------------

    loadFromFile() {
        return new Promise(async (resolve) => {
            let fileArray = await new Promise(resolve => {
                let input = document.createElement('input')
                input.type = 'file'
                input.accept = ".zip"
                input.click()

                input.onchange = (e) => {
                    let fileList = input.files;
                    for (let file of fileList) {
                        this.helper.loadAsync(file)
                            .then(async (zip) => {
                                let fileArray = await projectUtils.getFilesFromZip(zip)
                                resolve(fileArray)
                            })
                    }
                }
            })
            let settings = await projectUtils.load(fileArray)
            resolve(settings)
        })
    }

    getPluginRegistry = (lib) =>{
        let keys = Object.keys(lib.plugins)
        if (lib.plugins[keys[keys.length - 1]].__esModule === true){
            const plugins = {}
            for (let type in lib.plugins) {

                if (lib.plugins[type].__esModule === true){
                    for (let name in lib.plugins[type]) {
                        let className = lib.plugins[type][name].name
                        plugins[className] = lib.plugins[type][name]
                    }
                } else plugins[lib.plugins[type].name] = lib.plugins[type]
            }
            return plugins
        } else return lib.plugins
    }

    async list() {
        let projects = {
            local: [],
            published: []
        }
        projects.local = new Set(await readFiles(`/projects/`))
        return projects
    }

    async getFilesFromDB(name) {
        // console.log('LOADING PROJECTS FROM DB')
        return new Promise(async (resolve, reject) => {
            let projects = await readFiles(`/projects/`)
            let file = projects.filter(s => s.includes(name))
            file = file[0]
            let url = await readFile(`/projects/${file}`)
            let blob = await projectUtils.getFilesFromDataURL(url)
            resolve(blob)
        })
    }

    async load(files,alert=true) {
        return new Promise(async (resolve, reject) => {
            try {
                if (files.length > 0) {

                    let info = {
                        settings: null,
                        classes: []
                    }

                    await Promise.all(files.map(async (o, i) => {
                            if (o.filename.includes('settings.js')) info.settings = o.content
                            else {
                                let isClass = o.content.match(/export/)
                                if (isClass) info.classes.push(o.content)
                                else console.error(`${o.filename} not loaded`)
                            }
                        }))

                    let classes = {}
                    let thrown = false
                    info.classes.forEach(c => {
                        
                            let toEval = (c.trim().slice(0,6) === 'export') 
                            ? c.split('export')[1] // beginning export
                            : c.split('export')[0] // end export

                            try{
                                c = eval(`(${toEval})`) 
                            } catch (e) {

                                if (alert && !thrown) alert(`Application cannot be loaded.`)
                                
                                resolve(false)
                                thrown = true
                            }
                            classes[c.name] = c
                    })

                    // Replace Class Imports with Random Ids (to avoid stringifying)
                    let classMap = {}
                    var re = /import\s+{([^{}]+)}[^\n]+/g;
                    let m;

                    do {
                        m = re.exec(info.settings)
                        if (m == null) m = re.exec(info.settings); // be extra sure (weird bug)
                        if (m) {
                            let id = String(Math.floor(Math.random() * 1000000))
                            classMap[id] = {
                                name: m[1],
                                class: classes[m[1]]
                            }

                            info.settings = info.settings.replace(m[0], ``)
                            info.settings = info.settings.replaceAll(new RegExp(`['"]?class['"]?:\\s*${m[1]}`, 'g'), `class:${id}`)
                        }
                    } while (m);

                    var re = /brainsatplay\.([^\.\,}]+)\.([^\.\,}]+)\.([^\.\,}]+)/g;
                    let m2;

                    let library;
                    let version = info.settings.match(/['"]?version['"]?:\s*"([^"]+)/)
                    if (version){
                        library = await projectUtils.getLibraryVersion(version[1])
                    } else {
                        library = await projectUtils.getLibraryVersion('experimental')
                    }


                    do {
                        m2 = re.exec(info.settings);
                        if (m2 == null) m2 = re.exec(info.settings) // be extra sure (weird bug)
                        if (m2) {
                            let defaultClass = library[m2[1]]
                            for (let i = 2; i < m2.length; i++) {
                                defaultClass = defaultClass[m2[i]]
                            }

                            let id = String(Math.floor(Math.random() * 1000000))
                            classMap[id] = {
                                name: m2[m2.length - 1],
                                class: defaultClass
                            }
                            info.settings = info.settings.replaceAll(m2[0], id)

                        }
                    } while (m2);

                    let settings
                    try {

                        // Fool Webpack
                        let evalFuncString = 'async (txt) => {return await import(txt)}'
                        let evalFunc = eval(`(${evalFuncString})`)

                        // Load module from data url
                        let moduleText = "data:text/javascript;base64," + btoa(info.settings);
                        let module = await evalFunc(moduleText)
                        settings = module.settings
                        
                        // Replace Random IDs with Classes
                        if (!('graphs' in settings)) settings.graphs = []
                        if ('graph' in settings) settings.graphs.push(settings.graph)
                        delete settings.graph

                        settings.graphs.forEach(g => {
                            g.nodes.forEach(n => {
                                if (n?.class && classMap[n.class]?.class) n.class = classMap[n.class]?.class
                            })
                        })
                        resolve(settings)
                    } catch (e) {
                        console.error(e);
                        resolve(false)
                    }
                } else { console.error('file array is empty'); resolve(false) }
            } catch (e) { 
                console.error(e) 
                resolve(false)
            }
        })
    }
}