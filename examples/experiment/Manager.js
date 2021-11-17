// import bci from 'bcijs/browser.js'
// import { Plugin } from '../../../libraries/js/src/plugins/Plugin'

export class Manager {

    static id = String(Math.floor(Math.random() * 1000000))

    constructor(info, graph) {
        


        // UI Identifier
        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            states: {},
            lastAtlas: null,
            prevState: null,
            container: document.createElement('div'),
            experiment: document.createElement('div'),
            cross: document.createElement('p'),
            start: document.createElement('div'),
            startButton: null,
            model: null,
            results: null,
        }

        this.props.container.id = this.props.id
        this.props.experiment.style = this.props.start.style = 'width: 100%; text-align: center;'

        // Start Screen
        this.props.start.innerHTML = `<h2 style="margin: 0px">Alpha Power</h2>`
        this.props.start.innerHTML += `<i style='font-size: 80%'>Eyes Open vs. Eyes Closed</i><br/><br/>`

        this.props.container.insertAdjacentElement('beforeend', this.props.start)


        // Experiment
        this.props.cross.style = `  
        display:inline-block;
        width:25px;
        height:25px;
        
        background:
        linear-gradient(#fff,#fff),
        linear-gradient(#fff,#fff),
        #000;
        background-position:center;
        background-size: 100% 2px,2px 100%; /*thickness = 2px, length = 50% (25px)*/
        background-repeat:no-repeat;
        `

        this.props.experiment.insertAdjacentElement('beforeend', this.props.cross)

        this.props.label = document.createElement('h3')
        this.props.bar = document.createElement('div')
        this.props.bar.style = 'background: transparent; height: 7px; width: 100%; position: absolute; bottom: 0; left: 0;'
        this.props.bar.innerHTML = `<div style="background: white; height: 100%; width: 100%;">`
        this.props.experiment.insertAdjacentElement('beforeend', this.props.label)
        this.props.experiment.insertAdjacentElement('beforeend', this.props.bar)

        this.props.experiment.style.display = 'none'
        this.props.container.insertAdjacentElement('beforeend', this.props.experiment)


        // Port Definition
        this.ports = {
            default: {
                input: { type: undefined },
                output: { type: null },
                onUpdate: (user) => {
                    // if (this.props.lastAtlas == null) this.props.startButton.classList.toggle('disabled')
                    this.props.lastAtlas = user.data
                    // this.props.lastAtlas.eeg.forEach(o => {
                    //     console.log(o)
                    // })
                    // return [{data: null}] // Return Alpha
                }
            },

            schedule: {
                input: { type: 'string' },
                output: { type: null },
                onUpdate: (user) => {
                    this.props.label.innerHTML = user.meta.state
                    let statePercentage = user.meta.stateTimeElapsed / user.meta.stateDuration
                    // Fill a Progress Bar
                    let fillBar = this.props.bar.querySelector('div')
                    if (user.meta.state === 'ITI') fillBar.style.background = 'red'
                    else fillBar.style.background = '#00FF00'

                    if (statePercentage > 1) statePercentage = 1
                    fillBar.style.width = `${statePercentage * 100}%`
                }
            },

            element: {
                edit: false,
                input: { type: null },
                output: { type: Element },
                data: this.props.container,
                onUpdate: () => {
                    this.ports.element.data = this.props.container
                    return { data: this.ports.element.data }
                }
            },

            state: {
                edit: false,
                input: { type: 'string' },
                output: { type: null },
                onUpdate: (user) => {
                    // console.log(user)
                    if (user.data != null) {
                        let state = (user.data != 'ITI') ? user.data : this.props.prevState
                        if (this.props.states[state] == null) this.props.states[state] = new Set()
                        if (this.props.lastAtlas) this.props.states[state].add(this.props.lastAtlas.eeg[0].fftCount)
                        this.props.prevState = state
                    }
                }
            },

            done: {
                edit: false,
                input: { type: undefined },
                output: { type: Object },
                onUpdate: (user) => {
                    // console.log(this.ports.element.output)
                    let alphaMeans = {}

                    let nIntervals = 8;


                    console.log(this.props.states)
                    Object.keys(this.props.states).forEach(key => {

                        alphaMeans[key] = {}
                        console.log(key)

                        if (this.props.lastAtlas) {
                            this.props.lastAtlas.eeg.forEach(coord => {

                                const iterator = this.props.states[key].values()

                                let i1 = iterator.next().value
                                let temp = iterator.next().value
                                let i2 = temp ? temp : coord.means.alpha1.length
                                console.log(i1, i2)
                                let interval = (i2 - i1) / nIntervals //6 intervals
                                // console.log('interval: ', interval)
                                alphaMeans[key][coord.tag] = []

                                for (let i = i1; i < i2 - 2; i += interval) {
                                    let a1 = coord.means.alpha1.slice(i, i + interval)
                                    // console.log(a1)
                                    let a2 = coord.means.alpha2.slice(i, i + interval)
                                    // console.log(a2)
                                    let a = (this.session.atlas.mean(a1) + this.session.atlas.mean(a2)) / 2
                                    console.log(a)
                                    alphaMeans[key][coord.tag].push(a)
                                }
                            })
                        }
                    })

                    console.log(alphaMeans)

                    this.props.start.style.display = 'flex'
                    this.props.start.innerHTML = ''

                    for (let condition in alphaMeans) {
                        let div = document.createElement('div')
                        div.style.padding = '80px'
                        div.style.textAlign = 'left'



                        if (condition != '') { //end screen, check for not '' condition
                            div.innerHTML += `<i style="font-size: 80%">Alpha</i>`
                            div.innerHTML += `<h2 style="margin: 0px">${condition}</h2>`
                            for (let tag in alphaMeans[condition]) {
                            }
                            this.props.start.insertAdjacentElement('beforeend', div)
                            // this.props.start.insertAdjacentElement('beforeend', this.props.chart)

                        }
                    }

                    console.log(alphaMeans)

                    delete alphaMeans[""]
                    for (let state in alphaMeans) { // change channel names to indices, transpose alphaMeans

                        let tAlphaMeans = [];
                        for (let i = 0; i < nIntervals; i++) { // loop through trials
                            let temp = [];
                            for (let channel in alphaMeans[state]) { // loop through electrodes

                                temp.push(alphaMeans[state][channel][i])
                            }
                            tAlphaMeans.push(temp)
                        }

                        // for (let channel in alphaMeans[state]){
                        //     tAlphaMeans.push(alphaMeans[state][channel])
                        // }
                        alphaMeans[state] = tAlphaMeans;

                    }

                    for (let i = 0; i < alphaMeans["Eyes Closed"].length; i++) { //add distinction to second-channel eyes-closed data
                        console.log(alphaMeans["Eyes Closed"][i][1] += 20);
                    }


                    this.props.experiment.style.display = 'none'

                    console.log(alphaMeans)
                    return { data: alphaMeans }



                }
            },

            start: {
                onUpdate: (user) => {
                    if (user.data) {
                        this.props.start.style.display = 'none'
                        this.props.experiment.style.display = ''
                        return user
                    }
                }
            },

            button: {
                data: null,
                onUpdate: (user) => {
                    console.log(user)
                }
            },

            buttonToggle: {
                onUpdate: (user) => {
                    console.log('START')
                    if (user.data) {
                        // this.props.startButton.classList.toggle('disabled')
                    }
                }
            },

            model: {
                input: { type: undefined },
                output: { type: null },
                onUpdate: (user) => {
                    this.props.model = user.data
                    console.log(this.props.model)
                }

            },

            predict: {
                input: { type: undefined }, 
                output: { type: null },
                onUpdate: (user) => {

                    if (this.props.model) {

                        let ldaParams = this.props.model
                        let predictData = []

                        this.props.lastAtlas.eeg.forEach(coord => {

                            let a1 = coord.means.alpha1
                            let a2 = coord.means.alpha2
                            let a = (this.session.atlas.mean(a1) + this.session.atlas.mean(a2)) / 2
                            predictData.push(a)

                        })
                        console.log(predictData)

                        let classify = (feature) => {
                            let prediction = bci.ldaProject(ldaParams, feature);
                            console.log(prediction)
                            return (prediction < 0) ? 0 : 1;
                        }

                        let prediction = classify(predictData)
                        console.log(prediction)

                        if (this.props.results) this.props.start.remove(this.props.results)
                        this.props.results = document.createElement('div')
                        this.props.results.style.padding = '80px'
                        this.props.results.style.textAlign = 'left'


                        div.innerHTML += `<h2 style="margin: 0px">Hello</h2>`
                        this.props.start.insertAdjacentElement('beforeend', this.props.results)



                        if (prediction === 0) {
                            console.log("Eyes Closed")
                        }
                        else {
                            console.log("Eyes Open")
                        }

                        // display results onto screen
                    }
                }
            },

        }
    }

    init = () => {
        if (this.ports.button.data == null) {
            this.ports.button.data = document.createElement('button')
            this.ports.button.data.innerHTML = 'Start Experiment'
        }

        this.ports.button.data.classList.add('brainsatplay-default-button')

        this.props.start.insertAdjacentElement('beforeend', this.ports.button.data)
    }

    deinit = () => { }
}

