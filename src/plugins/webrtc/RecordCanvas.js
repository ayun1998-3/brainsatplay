/*
*  BASED ON https://github.com/webrtc/samples/blob/gh-pages/src/content/capture/canvas-record/js/main.js
*
*  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

export class RecordCanvas {

    static id = String(Math.floor(Math.random() * 1000000))
    static category = 'webrtc'
    static hidden = true

    constructor() {

        this.props = {
            mediaSource: new MediaSource(),
            mediaRecorder: null,
            recordedBlobs: [],
            sourceBuffer: null,
            stream: null,
            video: document.createElement('video'),
            recording: false,
        }

        this.props.video.autoplay = true
        this.props.video.style.width = '100%'
        this.props.video.style.height = '100%'

        this.ports = {

            toggleRecording: {
                input: {type: 'boolean'},
                output: {type: 'boolean'},
                onUpdate: (user) => {
                    this.toggleRecording()
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
                    if (user.data) this.download()
                    // else this.stop()
                }
            },

            debug: {
                data: this.props.video
            },

            canvas: {
                onUpdate: (user) => {
                    this.props.stream = user.data.captureStream(); // frames per second
                    console.log(this.props.stream)
                    this.props.video.srcObject = this.props.stream // show stream before recording
                }
            },

        }

    }

    init = () => {
        this.props.mediaSource.addEventListener('sourceopen', this.handleSourceOpen, false);
    }

    handleSourceOpen = (event)  => {
        console.log('MediaSource opened');
        this.props.sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        console.log('Source buffer: ', this.props.sourceBuffer);
    }

    handleDataAvailable = (event) => {
        if (event.data && event.data.size > 0) this.props.recordedBlobs.push(event.data);
    }

    handleStop = (event)  => {
        console.log('Recorder stopped: ', event);
        const superBuffer = new Blob(this.props.recordedBlobs, { type: 'video/webm' });
        this.props.video.src = window.URL.createObjectURL(superBuffer);
    }

    toggleRecording = ()  => {
        if (!this.props.recording) this.startRecording()
        else this.stopRecording();
    }

    // The nested try blocks will be simplified when Chrome 47 moves to Stable
    startRecording = ()  => {
        if (this.props.stream) {
            let options = { mimeType: 'video/webm' };
            this.props.recordedBlobs = [];
            try {
                this.props.mediaRecorder = new MediaRecorder(this.props.stream, options);
                this.props.recording = true
            } catch (e0) {
                console.log('Unable to create MediaRecorder with options Object: ', e0);
                try {
                    options = { mimeType: 'video/webm,codecs=vp9' };
                    this.props.mediaRecorder = new MediaRecorder(this.props.stream, options);
                    this.props.recording = true
                } catch (e1) {
                    console.log('Unable to create MediaRecorder with options Object: ', e1);
                    try {
                        options = 'video/vp8'; // Chrome 47
                        this.props.mediaRecorder = new MediaRecorder(this.props.stream, options);
                        this.props.recording = true
                    } catch (e2) {
                        alert('MediaRecorder is not supported by this browser.\n\n' +
                            'Try Firefox 29 or later, or Chrome 47 or later, ' +
                            'with Enable experimental Web Platform features enabled from chrome://flags.');
                        console.error('Exception while creating MediaRecorder:', e2);
                        return;
                    }
                }
            }
            console.log('Created MediaRecorder', this.props.mediaRecorder, 'with options', options);
            this.props.mediaRecorder.onstop = this.handleStop;
            this.props.mediaRecorder.ondataavailable = this.handleDataAvailable;
            this.props.mediaRecorder.start(100); // collect 100ms of data
            console.log('MediaRecorder started', this.props.mediaRecorder);
        } else {
            console.log('No canvas stream created.')
        }
    }

    stopRecording = ()  => {
        this.props.mediaRecorder.stop();
        console.log('Recorded Blobs: ', this.props.recordedBlobs);
        this.props.video.controls = true;
        this.props.recording = false
    }

    play = ()  => {
        this.props.video.play();
    }

    download = ()  => {
        const blob = new Blob(this.props.recordedBlobs, { type: 'video/webm' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
}
