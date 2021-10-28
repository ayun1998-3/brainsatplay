
// import featureImg from './feature.png'
import {UI} from './UI.js'
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
        {name: 'blink_left', class: 'Event', params: {keycode: 'ArrowLeft'}},
        {name: 'blink_right', class: 'Event', params: {keycode: 'ArrowRight'}},
        {name: 'ui', class: UI, params: {}},
        {name: 'document', class: 'DOM'},

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
