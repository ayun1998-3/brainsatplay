import bci from 'bcijs/browser.js'

class Manager {

    static id = String(Math.floor(Math.random() * 1000000))

    constructor(label, session) {

        // Generic Plugin Attributes
        this.label = label
        this.session = session

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
            startButton: document.createElement('button'),
            chart: null,
        }

        this.props.container.id = this.props.id
        this.props.experiment.style = this.props.start.style = 'width: 100%; text-align: center;'

        // Start Screen
        this.props.start.innerHTML = `<h2 style="margin: 0px">Alpha Power</h2>`
        this.props.start.innerHTML += `<i style='font-size: 80%'>Eyes Open vs. Eyes Closed</i><br/><br/>`

        this.props.startButton.innerHTML = 'Start Experiment'
        this.props.startButton.classList.add('brainsatplay-default-button')
        this.props.startButton.onclick = () => {
            this.session.graph.runSafe(this, 'start', { data: true })
        }

        this.props.start.insertAdjacentElement('beforeend', this.props.startButton)
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
                    if (this.props.lastAtlas == null) this.props.startButton.classList.toggle('disabled')
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

                    let nIntervals = 6;

                    // // Training set
                    // let class1 = [[0, 0, 0, 0, 0], [1, 2, 1, 2, 0], [2, 2, 5, 2, 0]];
                    // let class2 = [[8, 8, 10, 12, 9], [9, 10, 10, 20, 21], [7, 8, 9, 10, 16]];

                    // // Learn an LDA classifier
                    // let ldaParams1 = bci.ldaLearn(class1, class2);
                    // console.log(ldaParams1)

                    // let testClass1 = [[1, 1, 1, 2, 1, 1], [2, 1, 3, 4, 1, 0]]
                    // let testClass2 = [[10, 10, 10, 10, 10, 12], [21, 21, 23, 24, 15, 12]]

                    // for (let i = 0; i < testClass1.length; i++) {
                    //     let pred = bci.ldaProject(ldaParams1, testClass1[i])
                    //     let pred2 = bci.ldaProject(ldaParams1, testClass2[i])
                    //     console.log(pred, pred2)
                    // }
                    

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
                                // let a1 = coord.means.alpha1.slice(i1, i2)
                                // let a2 = coord.means.alpha2.slice(i1, i2)
                                // let a = (this.session.atlas.mean(a1) + this.session.atlas.mean(a2)) / 2
                                // alphaMeans[key][coord.tag] = a
                            })
                        }
                    })

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
                                // div.innerHTML += `<p style="font-size: 80%">${tag}: ${alphaMeans[condition][tag].toFixed(4)}</p>`
                            }
                            this.props.start.insertAdjacentElement('beforeend', div)
                            // this.props.start.insertAdjacentElement('beforeend', this.props.chart)

                        }
                    }


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
                        alphaMeans[state] = tAlphaMeans;

                    }

                    for (let i = 0; i < alphaMeans["Eyes Closed"][0].length; i++) {
                        console.log(alphaMeans["Eyes Closed"][0][i] += 10);
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
            buttonToggle: {
                onUpdate: (user) => {
                    console.log('START')
                    if (user.data) {
                        this.props.startButton.classList.toggle('disabled')
                    }
                }
            },

            learn: {
                input: { type: undefined },
                output: { type: 'number' },
                onUpdate: (user) => {

                    let openTraining = user.data['Eyes Open'].slice(0, 4)
                    let closedTraining = user.data['Eyes Closed'].slice(0, 4)
                    let openTesting = user.data['Eyes Open'].slice(4)
                    let closedTesting = user.data['Eyes Closed'].slice(4)
                    console.log(openTraining, openTesting, closedTraining, closedTesting)

                    // let reshape = (data) => {
                    //     let nData = data.map(value => { //adds dimension
                    //         let temp = [];
                    //         temp.push(value)
                    //         return temp
                    //     })
                    //     return nData
                    // }

                    // openData = reshape(openData)
                    // closedData = reshape(closedData)

                    let ldaParams = bci.ldaLearn(openTraining, closedTraining); // something not working witht he ldaParams, gives me huge theta values

                    console.log(ldaParams)

                    let classify = (feature) => {
                        let prediction = bci.ldaProject(ldaParams, feature);
                        console.log(prediction)
                        return (prediction < 0) ? 0 : 1;
                    }
                    // Classify testing data


                    let openPredictions = openTesting.map(classify);
                    let closedPredictions = closedTesting.map(classify);
                    console.log(openPredictions, closedPredictions)

                    // Evaluate the classifer
                    let openActual = new Array(openPredictions.length).fill(0);
                    let closedActual = new Array(closedPredictions.length).fill(1);
                    console.log(openActual, closedActual)

                    let predictions = openPredictions.concat(closedPredictions);
                    let actual = openActual.concat(closedActual);
                    console.log(predictions, actual)

                    let confusionMatrix = bci.confusionMatrix(predictions, actual);

                    let bac = bci.balancedAccuracy(confusionMatrix);
                    console.log(bac)
                    console.log('confusion matrix');
                    console.log(bci.toTable(confusionMatrix));
                    console.log('balanced accuracy');
                    console.log(bac);
                }

            },

            test: {
                input: { type: undefined },
                output: { type: 'number' },
                onUpdate: (user) => {
                    let ldaParams = user.data

                }
            },

        }
    }

    init = () => { }

    deinit = () => { }
}

export { Manager }