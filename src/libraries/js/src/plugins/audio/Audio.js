import {SoundJS} from '../../utils/general/Sound'



export class Audio {
    
    static id = String(Math.floor(Math.random()*1000000))
    static category = 'audio'

    constructor(info, graph) {

        this.props = {
            sourceGain: null,
            sourceNode: null,
            status: 0,
            maxVol: 0.5,
            file: null,
            audioEl: null,
        }

        if(!window.audio) window.audio = new SoundJS();

        this.ports = {
            file: {
                input: {type: 'file', accept:'audio/*'}, // Single file only
                output: {type: 'boolean'},
                // data: [],
                onUpdate: async (user) => {
                    return new Promise(async (resolve, reject) => {

                        if (user.data){
                            this._deinit()
                            let file = user.data
                            if (file instanceof FileList || Array.isArray(file)) file = file[0]
                            this.props.file = file

                            if (this.props.file){

                                console.log(this.ports.analyze.data)
                                if (typeof this.props.file === 'string'){
                                    if (this.ports.analyze.data) await this._convertToBlob(this.props.file)
                                    else this._convertToAudioElement(this.props.file,()=>{resolve({data: true})})
                                    // reject()
                                } else {
                                    this.decodeAudio(this.props.file, () => {
                                        console.log('decoded')
                                        resolve({data: true}) 
                                    })
                                }
                            }
                        }
                    })
                }
            }, 
            fft: {
                input: {type: null},
                output: {type: Array},
                onUpdate: () => {
                    var array = new Uint8Array(window.audio.analyserNode.frequencyBinCount);
                    window.audio.analyserNode.getByteFrequencyData(array);
                }
            },
            volume: {
                input: {type: 'number'},
                output: {type: null},
                data: this.props.maxVol,
                min: 0,
                max: this.props.maxVol,
                step: 0.01,
                onUpdate: (user) => {
                    let volume = user.data*this.props.maxVol
                    if (this.ports.analyze.value) this.props.sourceGain.gain.setValueAtTime(volume, window.audio.ctx.currentTime);
                    else this.props.audioEl.volume = volume
                }
            },
            analyze: {
                data: true,
                input: {type: 'boolean'},
                output: {type: null}
            },
            toggle: {
                // input: {type: 'boolean'},
                output: {type: null},
                onUpdate: (user) => {
                    if (user.data) this.triggerAudio()
                }
            }
        }
    }

    init = () => {

    }

    _convertToAudioElement = async (str, onsuccess) => {
        this.props.audioEl = new window.Audio(str)
        this.props.audioEl.addEventListener("canplaythrough", event => {
            this.props.audioEl.play();
            onsuccess()
        });
    }

    _convertToBlob = async (str) => {
        await fetch(str).then(r => r.blob()).then(blobFile => {
            let name = str.split('/')
            name = name[name.length -1]
            this.update('file', {data: false})
            let file = new File([blobFile], name)
            this.update('file', {data: [file]})
            // this.ports.file.onUpdate({data: [file]})
        })
    }

    _deinit = () => {
        this.endAudio();
    }

    deinit = () => {
        this._deinit()
        if (this.props.audioEl) this.props.audioEl.remove()
    }

    // preload = () => {

    // }

    decodeAudio = (file, callback= () => {}) => {

        return new Promise(resolve => {
        //read and decode the file into audio array buffer 
        var fr = new FileReader();

        fr.onload = (e) => {
            var fileResult = e.target.result;
            if (window.audio.ctx === null) {
                return;
            };

            let createAudio = () => {
                window.audio.ctx.decodeAudioData(fileResult, (buffer) => {

                    let onDecode = () => {
                        window.audio.finishedLoading([buffer]);
                        this.props.sourceNode = window.audio.sourceList[window.audio.sourceList.length-1];
                        this.props.sourceGain = window.audio.sourceGains[window.audio.sourceList.length-1];

                        this.props.sourceGain.gain.setValueAtTime(this.props.maxVol, window.audio.ctx.currentTime);

                        this.props.sourceNode.onended = () => {
                            if (this.props.status === 1){
                                this.endAudio()
                                this.decodeAudio(this.props.file)
                            }
                        };

                        resolve()
                    }

                    onDecode()
                    callback()
                }, (e) => {
                    console.error('Failed to decode the file!', e);
                });
            }
            createAudio()

        };
        fr.onerror = (e) => {
            console.error('Failed to read the file!', e);
        };
        //assign the file to the reader
        fr.readAsArrayBuffer(file);
    })
    }

    triggerAudio = async () => {
        
        if (this.props.sourceNode){
            if (this.props.status === 1){
                this._deinit()
                if (this.ports.analyze.value) await this.decodeAudio(this.props.file)
            }

            if (this.ports.analyze.value) this.props.sourceNode.start(0);
            else this.props.audioEl.play();
            this.props.status = 1
        }
    }
        
    endAudio = () => {
        this.props.status = 0;
        if (this.ports.analyze.value){
            this.stopAudio();
            if(window.audio.sourceList.length > 0) {try {
                this.sourceNode.stop(0);
            } catch(er){}}
        } else {
            if (this.props.audioEl) this.props.audioEl.pause();
        }
    }

    stopAudio = () => {
        if(window.audio != undefined){
            if (window.audio?.sourceList?.length > 0 && this.props.sourceNode && this.props.status === 1) {
                try {this.props.sourceNode.stop(0)} catch(er){}
            }
        }
    }
}