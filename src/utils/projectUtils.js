import JSZip from 'jszip'
import * as experimental from './../index.js'
import * as blobUtils from './general/blobUtils.js'

export const zipHelper = new JSZip();
const publishURL = (location.hostname === "localhost" || location.hostname === "127.0.0.1" && window.brainsatplayPlatform) ? 'http://localhost/apps' : 'https://server.brainsatplay.com/apps'
let serverResolved = true
let libraries = {}

    // ---------------------- Grab Correct Settings File ----------------------
    export const getSettings = async (info) => {

		return new Promise((resolve, reject)=> {
			
			// Load Zip
			if (info.zip){
				if (!info.zip.includes('.zip')) info.zip = info.zip + '/app.zip'
				fetch(info.zip).then((res) => {
					zipHelper.loadAsync(res.blob())
					.then(async (file) => {
						let fileArray = await getFilesFromZip(file)
						let loadedInfo = await load(fileArray, false)
						if (!loadedInfo){
							console.log(`falling back to link: ${info.link}`)
							if (info.link) {
								window.open(info.link, "_blank"); // redirect
								reject('Redirected to external location')
							} else reject('Required information not provided')
						} else {
							console.log(`creating app from external zip`)
							resolve(loadedInfo)
						} 
					})
				})
			} 

			// Redirect to New Page (external)
			else if (info.link) {
				window.open(info.link, "_blank");
				reject('Redirected to external location')
			}

			// Swap to App (platform)
			else resolve(info)
		})
	}

    // ---------------------- Library Management ----------------------
    export const getLibraryVersion = async (version='experimental') => {

        if (version==='experimental') return experimental
        else  {
            return await Promise.resolve(new Promise(resolve => {
                if (libraries[version] == null){
                    let script = document.createElement('script')
                    script.src = `https://cdn.jsdelivr.net/npm/brainsatplay@${version}`
                    script.async = true;
                    script.onload = () => {
                        if (window.brainsatplay) resolve(window.brainsatplay)
                        window.brainsatplay = experimental // always keep the latest on window
                        script.remove()
                    }
                    document.body.appendChild(script);
                } else resolve(libraries[version])
            }))
        }
    }

    // ---------------------- Project Saving ----------------------

    // Only save if a class instance can be created from the constructor string
    export const checkIfSaveable = (node) => {

        let editable = false
        try {
            let constructor = node.info.class.prototype.constructor.toString() // save original class
            let cls = eval(`(${constructor})`)
            let instance = new cls(node.info, node.parent) // This triggers the catch
            editable = true
        }
        catch (e) {}

        return editable
    }

    // ---------------------- Project Loading ----------------------

    export const iterateFiles = (zip, base='') => {
        return new Promise(async resolve => {
            let fileArray = []
            let i = 0
            for (let filename in zip.files) {
                let includesBase = filename.includes(base) && filename !== base
                if (includesBase){
                    if (filename[filename.length - 1] === '/'){
                        iterateFiles(zip, filename).then((res) => {
                            fileArray.push(...res)
                            i++
                            if (i == Object.keys(zip.files).length) resolve(fileArray)
                        })
                    } else {
                        let split = filename.split(base)
                        if (split.length === 2 && split[1] != '') {
                            zip.file(filename).async("string").then((content) => {
                                fileArray.push({ content, filename: filename.split(base)[1] })
                                i++
                                if (i == Object.keys(zip.files).length) resolve(fileArray)
                            })
                        }
                    }
                } else i++
                if (i == Object.keys(zip.files).length) resolve(fileArray)
            }
        })
    }

    export const getFilesFromZip = (zip) => {
        return new Promise(async resolve => {
            let fileArray = await iterateFiles(zip, 'app/') // flatten all files in the app directory
            resolve(fileArray)
        })
    }

    // export const getPublishedApps = async () => {
    //     return new Promise((resolve, reject) => {
    //         let apps = []
    //         if (serverResolved){
    //             fetch(publishURL, {
    //                 method: 'GET',
    //             }).then(res => res.json()).then(data => {
    //                 data.forEach(async(url) => {
    //                     let files = await getFilesFromDataURL(url)
    //                     let project = await load(files)
    //                     apps.push(project)
    //                     if (apps.length === data.length) resolve(apps)
    //                 })
    //             }).catch((error) => {
    //                 console.warn('Server down.');
    //                 serverResolved = false
    //                 resolve(apps)
    //             });
    //         } else resolve(apps)
    //     })
    // }

    export const getFilesFromDataURL = async (url) => {
        let fileArray = []
        return new Promise(async (resolve, reject) => {
            let blob = blobUtils.dataURLtoBlob(url.toString('utf-8'))

            if (blob){
                zipHelper.loadAsync(blob)
                .then(async (zip) => {
                    let arr = await getFilesFromZip(zip)
                    arr.forEach((o,i) => {
                        fileArray.push(o)
                        if (i == arr.length - 1) resolve(fileArray)
                    })
                })
            } else console.error('Not a data url')
        })
    }

    export const load = async(files,alert=true) => {
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
                        library = await getLibraryVersion(version[1])
                    } else {
                        library = await getLibraryVersion('experimental')
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