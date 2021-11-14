export class CSSFilters {

    static id = String(Math.floor(Math.random()*1000000))
    static category = 'webrtc'

    constructor() {

        this.props = {
          container: document.createElement('div'),
          videoElement: document.createElement('video')
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
                input: {type: Element},
                output: {type: null},
                onUpdate: (user) => {
                  if (user.data) this.props.videoElement.srcObject = user.data;
                }
            },
            filters: {
              data: '',
              input: {type: 'string'},
              output: {type: null},
              options: [
                "",
                "grayscale",
                "sepia",
                "blur",
                "brightness",
                "contrast",
                "hue-rotate",
                "hue-rotate2",
                "hue-rotate3",
                "saturate",
                "invert",
              ],
              onUpdate: (user) => {
                  switch (user.data){
                    case 'blur':
                      this.props.videoElement.style.filter = 'blur(3px)'
                      break;

                    case 'contrast':
                      this.props.videoElement.style.filter = 'contrast(8)'
                      break;

                    case 'brightness':
                      this.props.videoElement.style.filter = 'brightness(5)'
                      break;

                    case 'hue-rotate':
                      this.props.videoElement.style.filter = 'hue-rotate(90deg)'
                      break;

                    case 'hue-rotate2':
                      this.props.videoElement.style.filter = 'hue-rotate(180deg)'
                      break;

                    case 'hue-rotate3':
                      this.props.videoElement.style.filter = 'hue-rotate(270deg)'
                      break;

                    case 'saturate':
                      this.props.videoElement.style.filter = 'saturate(10)'
                      break;

                    default:
                      console.log('DEFAULTING')
                      this.props.videoElement.style.filter = (user.data) ? `${user.data}(1.0)` : '';
                      break;
                  }
              }
            }
        }
    }

    init = () => { }

    deinit = () => { 
      this.props.container.remove()
    }

}