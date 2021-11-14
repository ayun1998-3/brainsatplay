import '../../utils/workers/gpu/gpu-browser.min.js'
import { makeCanvasKrnl, gpuUtils } from '../../utils/workers/gpu/gpuUtils.js'
import { addGpuFunctions, createGpuKernels as krnl } from '../../utils/workers/gpu/gpuUtils-functs';

export class WorkerProcess {

  static id = String(Math.floor(Math.random() * 1000000))
  static category = 'webrtc'

  constructor() {

    if (!window.workers) window.workers = new WorkerManager()

    this.props = {
      container: document.createElement('div'),
      canvas: document.createElement('canvas'),
      videoElement: document.createElement('video'),
      worker: {},
      looping: false,
      kernels: {
        edgeDetection: [
          -1, -1, -1,
          -1,  8, -1,
          -1, -1, -1
        ],
        boxBlur: [
          1/9, 1/9, 1/9,
          1/9, 1/9, 1/9,
          1/9, 1/9, 1/9
        ],
        sobelLeft: [
            1,  0, -1,
            2,  0, -2,
            1,  0, -1
        ],
        sobelRight: [
            -1, 0, 1,
            -2, 0, 2,
            -1, 0, 1
        ],
        sobelTop: [
            1,  2,  1,
            0,  0,  0,
           -1, -2, -1  
        ],
        sobelBottom: [
            -1, 2, 1,
             0, 0, 0,
             1, 2, 1
        ],
        identity: [
            0, 0, 0, 
            0, 1, 0, 
            0, 0, 0
        ],
        gaussian3x3: [
            1,  2,  1, 
            2,  4,  2, 
            1,  2,  1
        ],
        emboss: [
            -2, -1,  0, 
            -1,  1,  1, 
             0,  1,  2
        ],
        sharpen: [
            0, -1,  0,
           -1,  5, -1,
            0, -1,  0
        ]
      },
      gpu: null,
      gpuUtils: null,
      convolution: null
    }

    // Size Video
    this.props.videoElement.autoplay = true
    this.props.videoElement.style.width = '100%'
    this.props.videoElement.style.height = '100%'

    this.props.container.style.display = 'flex'
    this.props.container.style.width = '100%'
    this.props.container.style.height = '100%'
    // this.props.container.insertAdjacentElement('beforeend', this.props.videoElement)
    this.props.container.onresize = this.responsive

    // Create GPU Instance
    this.props.gpu = new GPU({})
    this.props.gpuUtils = new gpuUtils(this.props.gpu);
    let kernel = this.props.gpuUtils.addCanvasKernel('convolveImage', krnl.multiImgConv2DKern, this.props.container,316, 778);
    this.props.canvas = kernel.canvas;

    // Add GPU Display
    this.props.container.insertAdjacentElement('beforeend', this.props.canvas)

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
          }
        }
      },
      kernel: {
        data: 'edgeDetection',
        options: Object.keys(this.props.kernels)
      }
    }
    
  }

  responsive = () => {
      let dims = this.getDimensions()
      this.props.videoElement.width = dims.width
      this.props.videoElement.height = dims.height
  }

  getDimensions = () => {
    // let settings = this.props.videoElement.srcObject?.getVideoTracks()[0].getSettings()
    return {
      width: //settings?.width ?? 
      this.props.container.clientWidth,
      height: //settings?.height ?? 
      this.props.container.clientHeight
    }
  }
  start = () => {


      // Worker Stuff
      // this._grabFrame(this.props.videoElement.srcObject).then(this._passToWorker)
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

    // // -------------------- Worker Stuff --------------------
    // this.props.worker.id = window.workers.addWorker()

    // // Create Grayscale Image
    // window.workers.addEvent('workerprocess', this.uuid, 'process', this.props.worker.id);
    // window.workers.addWorkerFunction(
    //   'process',
    //   this._grayscale.toString(),
    //   this.uuid,
    //   this.props.worker.id
    // );

    // window.workers.subEvent('workerprocess', this._onWorkerResponse)

    // -------------------- GPU Stuff --------------------
    
    // Listen for srcObject to be added
    this.props.videoElement.addEventListener('loadeddata',()=>{
      
      let width = this.props.videoElement.width
      let height = this.props.videoElement.height

        let render = () => {
          if (this.props.looping) {
            const kernel = this.props.kernels[this.ports.kernel.data];
            let args = [this.props.videoElement, width, height, [kernel], [kernel.length], 1, 1];
            console.log(args)
            this.props.gpuUtils.callKernel('convolveImage', args)
            requestAnimationFrame(render);
          }
        }
        render();
    },false);
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