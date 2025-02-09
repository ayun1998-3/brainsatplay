import {DataQuality} from '../algorithms/DataQuality'
import {Canvas} from '../canvas/Canvas'

export class Blink{
    
    static id = String(Math.floor(Math.random()*1000000))

    constructor(label, session, params={}) {
        this.label = label
        this.session = session
        this.params = params

        this.ports = {
            default: {
                input: {type: Object, name: 'DataAtlas'},
                output: {type: Array},
                onUpdate: (user) => {
                    let leftBlinks = this.session.atlas.graph.runSafe(this,'left',user)
                    let rightBlinks = this.session.atlas.graph.runSafe(this,'right',user)
                    user.data = [leftBlinks[i].data, rightBlinks[i].data]
                    user.meta.label = 'blink'
                    return user
                }
            },
            left: {
                input: {type: null},
                output: {type: 'boolean'},
                onUpdate: (user) => {
                    return {data: this._calculateBlink(user,this.props.tags.left), meta: {label: 'blink_left'}}
                }
            },
            right: {
                input: {type: null},
                output: {type: 'boolean'},
                onUpdate: (user) => {
                    return {data: this._calculateBlink(user,this.props.tags.right), meta: {label: 'blink_right'}}
                }
            }
        }

        // Operator Configuration 
        this.paramOptions = {

            model: {
                default: 'Threshold', 
                options: [
                    'Threshold', 
                    // 'LDA', 
                    // 'CNN'
                ]
            }, 

            debug: {default: false},

            blinkWindow: {
                default: 25,
                options: null,
                min: 0,
                max: 2000,
                step: 1
            },

            blinkDuration: {
                default: 250,
                options: null,
                min: 0,
                max: 2000,
                step: 1
            }, 
            
            blinkThreshold: {
                default: 150,
                options: null,
                min: 0,
                max: 1000,
                step: 1
            }, 

            qualityThreshold: {
                default: 75,
                options: null,
                min: 0,
                max: 1000,
                step: 0.01
            }
        }

        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            canvas: null,
            looping: false,
            dataquality: null,
            blinkData: {},
            tags: {
                left: ['AF7','FP1'],
                right: ['AF8','FP2']
            }
        }

        // Dependencies
        this.analysis = new Set()
        this.props.dataquality = this.session.atlas.graph.instantiateNode({id: 'dataquality', class: DataQuality, params: {method: 'Mean Amplitude'}}, this.session)
        this.props.canvas = this.session.atlas.graph.instantiateNode({id: 'canvas', class: Canvas, params: {}}, this.session)
        this.analysis.add(...Array.from(this.props.dataquality.analysis))
        this.analysis.add(...Array.from(this.props.canvas.analysis))

        this.lastBlink = {}
        this.lastBlink.left = Date.now()
        this.lastBlink.right = Date.now()
    }

    init = () => {
        this.props.looping = true

        let HTMLtemplate = () => {
            return `
            <div id='${this.props.id}' style='display: flex; align-items: center; justify-content: center; width: 100%; height: 150px;'>
            </div>`
        }

        let setupHTML = (app) => {
            this.props.container = document.getElementById(`${this.props.id}`);
            this.props.canvas.instance.init()
            this.props.container.insertAdjacentElement('beforeend', this.props.canvas.instance.props.container)

            this.session.atlas.graph.runSafe(this.props.canvas.instance, 'draw', [
                {  
                    forceRun: true,
                    forceUpdate: true,
                    data: {active: true, function: (ctx) => {
                        if (this.props.looping){
                            if (this.params.debug){
                                this._drawSignal(ctx)
                            } else {
                                this.props.container.style.opacity = 0
                                this.props.container.style.pointerEvents = 'none'
                            }
                        }
                    }}
                }
            ])
        }

        return { HTMLtemplate, setupHTML}
    }

    deinit = () => {
        this.props.looping = false
        this.props.canvas.instance.deinit()
        this.props.dataquality.instance.deinit()
    }

    _drawSignal = (ctx) => {
        let scale = 0.1
        let yInt = 0.5
        let weight = 2
        let width = ctx.canvas.width;
        let height = ctx.canvas.height;
        let sideLength = width / 2

        let keys = Object.keys(this.props.blinkData)
        if (keys.length > 0){
            // Display
            this.props.container.style.opacity = 1
            this.props.container.style.pointerEvents = 'all'

            // Grab Data From First Tag
            keys.forEach(tag => {
                let side = this._getTagSide(tag)
                side = (side === 'left')? 0 : 1
                if (tag){
                    if (this.props.blinkData[tag] != null) {
                    let data = this.props.blinkData[tag]
                    let chQ = this.props.channelQuality[tag]
                    // var scale = 20;

                    // DRAW SIGNAL
                    ctx.beginPath(); // Draw a new path

                    let dx = ( sideLength )/(data.length - 1)
                    data.forEach((y,i) => ctx.lineTo(sideLength*side + dx*i,-Number.parseFloat(scale)*y + Number.parseFloat(height*yInt)))
                    let redMult = Math.max(0, Math.min(1, (1-chQ)))
                    let greenMult = 1 - Math.max(0, Math.min(1, (1-chQ)))
                    ctx.strokeStyle = `rgb(${255*redMult},${255*greenMult},${0})`; // Pick a color
                    ctx.lineWidth = Number.parseFloat(weight)
                    ctx.stroke(); // Draw

                    // DRAW THRESHOLD
                    let direction = [1,-1]
                    direction.forEach(d => {
                        ctx.beginPath(); // Draw a new path
                        let thresholdArray = [d*this.params.blinkThreshold,d*this.params.blinkThreshold]
                        dx = width/(thresholdArray.length - 1)
                        thresholdArray.forEach((y,i) => ctx.lineTo(dx*i,-Number.parseFloat(scale)*y + Number.parseFloat(height*yInt)))
                        ctx.strokeStyle = ` #808080`; // Pick a color
                        ctx.lineWidth = Number.parseFloat(2)
                        ctx.stroke(); // Draw
                    })
                }
            }
        })

        // SPLIT SIDES
        let direction = [1,-1]
        direction.forEach(d => {
            ctx.beginPath(); // Draw a new path
            ctx.lineTo(sideLength,0)
            ctx.lineTo(sideLength,height)
            ctx.strokeStyle = `#ffffff`;
            ctx.lineWidth = Number.parseFloat(2)
            ctx.stroke(); // Draw
        })


        } else {
            this.props.container.style.opacity = 0
            this.props.container.style.pointerEvents = 'none'
        }
    }

    _calculateBlink = (user, tags) => {
        let blink = false
        this.props.dataquality.params.qualityThreshold = this.params.qualityThreshold
        this.props.channelQuality = this.session.atlas.graph.runSafe(this.props.dataquality.instance,'default',[user])[0].data // Grab results of dependencies (no mutation)
        tags.forEach(tag => {
            let side = this._getTagSide(tag)
            if (Date.now() - this.lastBlink[side] > this.params.blinkDuration){
                let tryBlink = this._calculateBlinkFromTag(user,tag)
                if (tryBlink == true) {
                    blink = true // Only update blink if true (FIX: Sum up multiple channels if exists)
                    this.lastBlink[side] = Date.now() // Update blink time (if detected)
                }
            }
        })
        return blink
    }

    _calculateBlinkFromTag = (user,tag) => {
        let blink = false

        try {
            let data = this.session.atlas.getEEGDataByTag(tag,user.data) // Grab from user's own atlas data
            let chQ = this.props.channelQuality[tag] 
            if (data){
                let processedData = data.filtered // Try Filtered
                if (processedData.length === 0) processedData = data.raw // Try Raw
                if (processedData.length > 0){
                    let durationLength = (this.params.blinkDuration/1000)*user.data.eegshared.sps
                    let windowLength = (this.params.blinkWindow/1000)*user.data.eegshared.sps
                    this.props.blinkData[tag] = processedData.slice(processedData.length-durationLength)

                    let dataWindow = this.props.blinkData[tag].slice(this.props.blinkData[tag].length - Math.min(windowLength, durationLength))
                    let max = Math.max(...dataWindow.map(v => Math.abs(v)))
                    
                    // Only Count Blink if Above Quality Threshold
                    if (data != null && chQ >= 1) {
                        blink = (max > this.params.blinkThreshold)
                    }
                 }
            }
        } catch (e) {console.error('input not formatted properly')}

        return blink
    }


    _getTagSide = (tag) => {
        let sides = Object.keys(this.props.tags)
        return sides.find(s => this.props.tags[s].includes(tag))
    }
}