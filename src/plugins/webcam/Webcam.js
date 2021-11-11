export class Webcam {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'webcam'

    constructor() {

        this.props = {
            container: document.createElement("div"),
            videoElement: document.createElement("video"),
            videoSelect: document.createElement("select"),
            audioSelect: document.createElement("select"),
        }

        this.props.videoElement.autoplay = true
        this.props.videoElement.style.width = '100%'
        this.props.videoElement.style.height = '100%'
        this.props.container.style.width = '100%'
        this.props.container.style.height = '100%'
        this.props.container.insertAdjacentElement('beforeend', this.props.videoElement)


        this.ports = {
            debug: {
                data: this.props.container,
                input: {type: null},
                output: {type: Element},
            },
            stream: {
              input: {type: null},
          }
        }
    }

    init = () => {
        this.props.audioSelect.onchange = this._getStream;
        this.props.videoSelect.onchange = this._getStream;


        navigator.mediaDevices
        .enumerateDevices()
        .then(this._gotDevices)
        .then(this._getStream)
        .catch(this._handleError);
    }

    deinit = () => {
        this._deinit()
        this.props.container.remove()
    }

    _gotDevices = (deviceInfos) => {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text =
        deviceInfo.label || "microphone " + (audioSelect.length + 1);
        this.props.audioSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || "camera " + (this.props.videoSelect.length + 1);
      this.props.videoSelect.appendChild(option);
    } else {
      console.log("Found another kind of device: ", deviceInfo);
    }
  }
}

_deinit = () => {
    if (this.props.stream) {
        this.props.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }
}

_getStream = () => {
  this._deinit()

  const constraints = {
    // audio: {
    //   deviceId: { exact: audioSelect.value },
    // },
    video: true,
    //   video: { width: { min: 1280 }, height: { min: 720 } }, // HD
    // video: { width: { exact: 640 }, height: { exact: 480 } }, // VGA
    // video: {
    //   deviceId: { exact: videoSelect.value },
    // },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(this._gotStream)
    .catch(this._handleError);
}

_gotStream = (stream) => {
    this.update('stream', {data: stream}); // make stream available to console
    this.props.videoElement.srcObject = stream;
}

_handleError = (error) => {
  console.error("Error: ", error);
}
}