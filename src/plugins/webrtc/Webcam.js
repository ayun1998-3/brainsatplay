export class Webcam {

  static id = String(Math.floor(Math.random() * 1000000))
  static category = 'webrtc'

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
        input: { type: null },
        output: { type: Element },
      },
      stream: {
        edit: false,
        input: { type: null },
        output: {type: MediaStream}
      }
    }
  }

  init = () => {
    this.props.audioSelect.onchange = this._getStream;
    this.props.videoSelect.onchange = this._getStream;

    this._getDevices()
  }

  deinit = () => {
    this._deinit()
    this.props.container.remove()
  }


  _getDevices = () => {
    navigator.mediaDevices
      .enumerateDevices()
      .then(this._gotDevices)
      .then(this._getStream)
      .catch(this._handleError);
  }

  _gotDevices = (deviceInfos) => {

    const option = document.createElement("option");
    option.value = 'Default'
    this.props.videoSelect.appendChild(option);

    for (let i = 0; i !== deviceInfos.length; ++i) {
      const deviceInfo = deviceInfos[i];
      const option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === "audioinput") {
        option.text =
          deviceInfo.label || "microphone " + (this.props.audioSelect.length + 1);
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

    console.log(this.props.videoSelect)
    const constraints = {}

    if (this.props.videoSelect.value === 'Default') constraints.video = true
    else constraints.video = { deviceId: { exact: this.props.videoSelect.value } }

      // audio: {
      //   deviceId: { exact: audioSelect.value },
      // },

      // video: { width: { min: 1280 }, height: { min: 720 } }, // HD
      // video: { width: { exact: 640 }, height: { exact: 480 } }, // VGA


    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(this._gotStream)
      .catch(this._handleError);
  }

  _gotStream = (stream) => {
    console.log(stream)
    this.update('stream', { data: stream }); // make stream available to console
    this.props.videoElement.srcObject = stream;
  }

  _handleError = (error) => {
    console.error("Error: ", error);
  }
}