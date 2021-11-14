import '../../utils/workers/gpu/gpu-browser.min.js'

export class WorkerProcess {

  static id = String(Math.floor(Math.random() * 1000000))
  static category = 'webrtc'

  constructor() {

    if (!window.workers) window.workers = new WorkerManager()

    this.props = {
      container: document.createElement('div'),
      videoElement: document.createElement('video'),
      worker: {},
      looping: false,
      kernels: {
        edgeDetection: [
          -1, -1, -1,
          -1, 5.05, -1,
          -1, -1, -1
        ],
        boxBlur: [
          1 / 9, 1 / 9, 1 / 9,
          1 / 9, 1 / 9, 1 / 9,
          1 / 9, 1 / 9, 1 / 9
        ],
      },
      gpu: new GPU(),
      convolution: null
    }

    this.props.convolution = this.props.gpu.createKernel(function (src, width, height, kernel, kernelRadius) {
      const kSize = 2 * kernelRadius + 1;
      let r = 0, g = 0, b = 0;

      let i = -kernelRadius;
      let imgOffset = 0, kernelOffset = 0;
      while (i <= kernelRadius) {
        if (this.thread.x + i < 0 || this.thread.x + i >= width) {
          i++;
          continue;
        }

        let j = -kernelRadius;
        while (j <= kernelRadius) {
          if (this.thread.y + j < 0 || this.thread.y + j >= height) {
            j++;
            continue;
          }

          kernelOffset = (j + kernelRadius) * kSize + i + kernelRadius;
          const weights = kernel[kernelOffset];
          const pixel = src[this.thread.y + i][this.thread.x + j];
          r += pixel.r * weights;
          g += pixel.g * weights;
          b += pixel.b * weights;
          j++;
        }
        i++;
      }
      this.color(r, g, b);
    })
      .setOutput([400, 200])
      .setGraphical(true)

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
        // input: {type: MediaStream},
        output: { type: null },
        onUpdate: (user) => {
          if (user.data) {
            this.props.videoElement.srcObject = user.data;
            this.start()
          }
        }
      },
    }
  }

  start = () => {

    if (this.props.looping) {

      // Worker Stuff
      // this._grabFrame(this.props.videoElement.srcObject).then(this._passToWorker)

      // GPU Stuff
      const kernel = this.props.kernels['edgeDetection'];
      const kernelRadius = (Math.sqrt(kernel.length) - 1) / 2;
      let render = () => {
        this.props.convolution(this.props.videoElement, this.props.videoElement.width, this.props.videoElement.height, kernel, kernelRadius);
        requestAnimationFrame(render);
      }
      render();

      // Add Display
      this.props.convolution.canvas.style = 'position: absolute; top: 0; left: 0;'
      this.props.container.insertAdjacentElement('beforeend', this.props.convolution.canvas)
    }
  }

  _grabFrame = (stream = this.props.videoElement.srcObject) => {

    return new Promise(async (resolve) => {
      try {
        const [track] = stream.getVideoTracks();
        const imageCapture = new ImageCapture(track);
        const imageBitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);
        let pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)

        let data = {
          pixels: pixels.data.buffer,
          width: canvas.width,
          height: canvas.height,
          channels: 4
        }

        resolve({ data, transfer: [pixels.data.buffer] })
      } catch (e) { }
    })
  }

  _passToWorker = ({ data, transfer }) => {
    window.workers.runWorkerFunction('process', data, this.uuid, this.props.worker.id, transfer);
  }

  _onWorkerResponse = (res) => {

    // Animate with the maxumum rate (based on worker speed)
    this.start()

    console.log('Processed', res.output)

    let pixels = new ImageData(
      new Uint8ClampedArray(res.output.pixels),
      res.output.width,
      res.output.height
    );

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    ctx.putImageData(pixels, 0, 0);
    var image = new Image();
    image.src = canvas.toDataURL();
    this.props.container.innerHTML = ''
    this.props.container.insertAdjacentElement('beforeend', image)
  }

  init = () => {

    this.props.looping = true
    this.props.worker.id = window.workers.addWorker()

    // Create Grayscale Image
    window.workers.addEvent('workerprocess', this.uuid, 'process', this.props.worker.id);
    window.workers.addWorkerFunction(
      'process',
      this._grayscale.toString(),
      this.uuid,
      this.props.worker.id
    );

    window.workers.subEvent('workerprocess', this._onWorkerResponse)
  }

  deinit = () => {
    this.props.looping = false
    this.props.container.remove()
    window.workers.terminateWorker(this.props.worker.id)
  }

  _grayscale = (self, data, origin) => {

    let pixels = new Uint8Array(data.pixels)

    for (let x = 0; x < pixels.length; x += 4) {
      let average = (
        pixels[x] +
        pixels[x + 1] +
        pixels[x + 2]
      ) / 3;

      pixels[x] = average;
      pixels[x + 1] = average;
      pixels[x + 2] = average;
    }

    data.pixels = pixels

    return data
  }

}