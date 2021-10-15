
// import featureImg from './feature.png'
import {UI} from './UI.js'
import * as brainsatplay from '../../../libraries/js/brainsatplay'
import featureImg from './img/feature.png'

export const settings = {
    name: "Blink",
    devices: ["EEG"],
    author: "Garrett Flynn",
    description: "A staring contest (with yourself...)",
    categories: ["train"],
    "image":  featureImg,
    instructions:"Coming soon...",
    // intro: {
    //   mode: 'single'
    // },
    // App Logic
    graph:
      {
      nodes: [
        {id: 'blink_left', class: brainsatplay.plugins.controls.Event, params: {keycode: 'ArrowLeft'}},
        {id: 'blink_right', class: brainsatplay.plugins.controls.Event, params: {keycode: 'ArrowRight'}},
        {id: 'ui', class: UI, params: {}},
        {id: 'document', class: brainsatplay.plugins.interfaces.UI},

      ],
      edges: [
        {
          source: 'blink_left', 
          target: 'ui:left'
        }, 
        {
          source: 'blink_right', 
          target: 'ui:right'
        },
        {
          source: 'ui:element', 
          target: 'document:content'
        }
      ]
    },
}
