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

export default class Recorder {

    constructor() {

        this.mediaSource = new MediaSource();
        this.mediaRecorder = null;
        this.recordedBlobs = [];
        this.sourceBuffer = null;
        this.stream = null;
        this.video = document.createElement('video');
        this.recording = false;

        // Video Settings
        this.video.autoplay = true
        this.video.style.width = '100%'
        this.video.style.height = '100%'
    }

    init = () => {
        this.mediaSource.addEventListener('sourceopen', this.handleSourceOpen, false);
    }

    deinit = () => {
        this.mediaSource.removeEventListener('sourceopen', this.handleSourceOpen)
    }

    handleSourceOpen = (event)  => {
        console.log('MediaSource opened');
        this.sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        console.log('Source buffer: ', this.sourceBuffer);
    }

    handleDataAvailable = (event) => {
        if (event.data && event.data.size > 0) this.recordedBlobs.push(event.data);
    }

    handleStop = (event)  => {
        console.log('Recorder stopped: ', event);
        const superBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
        this.video.src = window.URL.createObjectURL(superBuffer);
    }

    toggleRecording = ()  => {
        if (!this.recording) this.startRecording()
        else this.stopRecording();
    }

    // The nested try blocks will be simplified when Chrome 47 moves to Stable
    startRecording = ()  => {
        if (this.stream) {
            let options = { mimeType: 'video/webm' };
            this.recordedBlobs = [];
            try {
                this.mediaRecorder = new MediaRecorder(this.stream, options);
                this.recording = true
            } catch (e0) {
                console.log('Unable to create MediaRecorder with options Object: ', e0);
                try {
                    options = { mimeType: 'video/webm,codecs=vp9' };
                    this.mediaRecorder = new MediaRecorder(this.stream, options);
                    this.recording = true
                } catch (e1) {
                    console.log('Unable to create MediaRecorder with options Object: ', e1);
                    try {
                        options = 'video/vp8'; // Chrome 47
                        this.mediaRecorder = new MediaRecorder(this.stream, options);
                        this.recording = true
                    } catch (e2) {
                        alert('MediaRecorder is not supported by this browser.\n\n' +
                            'Try Firefox 29 or later, or Chrome 47 or later, ' +
                            'with Enable experimental Web Platform features enabled from chrome://flags.');
                        console.error('Exception while creating MediaRecorder:', e2);
                        return;
                    }
                }
            }
            console.log('Created MediaRecorder', this.mediaRecorder, 'with options', options);
            this.mediaRecorder.onstop = this.handleStop;
            this.mediaRecorder.ondataavailable = this.handleDataAvailable;
            this.mediaRecorder.start(100); // collect 100ms of data
            console.log('MediaRecorder started', this.mediaRecorder);
        } else {
            console.log('No canvas stream created.')
        }
    }

    stopRecording = ()  => {
        this.mediaRecorder.stop();
        console.log('Recorded Blobs: ', this.recordedBlobs);
        this.video.controls = true;
        this.recording = false
    }

    play = ()  => {
        this.video.play();
    }

    download = ()  => {
        const blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
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