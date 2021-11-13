import Recorder from './recordUtils/Recorder.js'

export class RecordCanvas {

    static id = String(Math.floor(Math.random() * 1000000))
    static category = 'webrtc'
    static hidden = true

    constructor() {

        this.props = {
            recorder: new Recorder(),
        }

        this.ports = {

            toggleRecording: {
                input: {type: 'boolean'},
                output: {type: 'boolean'},
                onUpdate: (user) => {
                    this.props.recorder.toggleRecording()
                }

            },

            // play: {
            //     input: {type: 'boolean'},
            //     output: {type: 'boolean'},
            //     onUpdate: (user) => {
            //         if (user.data) this.play()
            //         // else this.stop()
            //     }
            // },

            download: {
                input: {type: 'boolean'},
                output: {type: 'boolean'},
                onUpdate: (user) => {
                    if (user.data) this.props.recorder.download()
                    // else this.stop()
                }
            },

            debug: {
                data: this.props.recorder.video
            },

            canvas: {
                onUpdate: (user) => {
                    this.props.recorder.stream = user.data.captureStream(); // frames per second
                    this.props.recorder.video.srcObject =  this.props.recorder.stream // show stream before recording
                }
            },

        }

    }

    init = () => {
        this.props.recorder.init()
    }

    deinit = () => {
        this.props.recorder.deinit()
    }
  
}
