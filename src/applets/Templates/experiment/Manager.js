class Manager{

    static id = String(Math.floor(Math.random()*1000000))

    constructor(label, session) {

        // Generic Plugin Attributes
        this.label = label
        this.session = session
        this.params = {}

        // UI Identifier
        this.props = {
            id: String(Math.floor(Math.random() * 1000000)), 
            states: {},
            lastAtlas: null  ,
            prevState: null        
        }
        
        this.props.container = document.createElement('div')
        this.props.container.id = this.props.id
        this.props.container.innerHTML = `
            <div style="width: 100%; text-align: center;">
                <p id="${this.props.id}-readout" style="  
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
                "></p>
            </div>
            <h3 id="${this.props.id}-label"></h3>
            <div id="${this.props.id}-bar" style="background: transparent; height: 7px; width: 100%; position: absolute; bottom: 0; left: 0;">
                <div style="background: white; height: 100%; width: 100%;">
            </div>`


        // Port Definition
        this.ports = {
            default: {
                input: {type: undefined},
                output: {type: null},
                onUpdate: (user) => {
                    this.props.lastAtlas = user.data
                    // this.props.lastAtlas.eeg.forEach(o => {
                    //     console.log(o)
                    // })
                    // return [{data: null}] // Return Alpha
                }
            }, 

            schedule: {
                input: {type: 'string'},
                output: {type: null},
                onUpdate: (user) => {
                    let labelDiv = document.getElementById(`${this.props.id}-label`)
                    labelDiv.innerHTML = user.meta.state
                    let barDiv = document.getElementById(`${this.props.id}-bar`)
                    let statePercentage = user.meta.stateTimeElapsed / user.meta.stateDuration
                    // Fill a Progress Bar
                    let fillBar = barDiv.querySelector('div')
                    if (user.meta.state === 'ITI') fillBar.style.background = 'red'
                    else fillBar.style.background = '#00FF00'
            
                    if (statePercentage > 1) statePercentage = 1
                    fillBar.style.width = `${statePercentage*100}%`
                }
            },

            element: {
                edit: false,
                input: {type: null},
                output: {type: Element},
                default: this.props.container,
                onUpdate: () => {
                    this.params.element = this.props.container
                    return {data: this.params.element}
                }
            },

            state: {
                edit: false,
                input: {type: 'string'},
                output: {type: null},
                onUpdate: (user) => {

                    if (user.data != null){
                        let state = (user.data != 'ITI') ? user.data : this.props.prevState
                        if (this.props.states[state] == null) this.props.states[state] = new Set()
                        this.props.states[state].add(this.props.lastAtlas.eeg[0].fftCount)
                        this.props.prevState = state
                    }
                }
            },

            done: {
                edit: false,
                input: {type: undefined},
                output: {type: null},
                onUpdate: (user) => {
                    console.log(user)
                    
                    let alphaMeans = {}
                        Object.keys(this.props.states).forEach((key,i) => {

                        alphaMeans[key] = {}
                        this.props.lastAtlas.eeg.forEach(coord => {

                            let i1 = this.props.states[key][0]
                            let i2 = this.props.states[key][1]
                            
                            let a1 = coord.means.alpha1.slice(i1, i2)
                            let a2 = coord.means.alpha2.slice(i1, i2)
                            console.log(i1, i2, a1, a2)
                            let a = (this.session.atlas.mean(a1) + this.session.atlas.mean(a2)) / 2
                            alphaMeans[key][coord.tag] = a
                        })
                    })

                    console.log(this.props.lastAtlas)

                    console.log(alphaMeans)
                }
            }
        }
    }

    init = () => {}

    deinit = () => {}
}

export {Manager}