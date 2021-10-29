import featureImg from './img/feature.png'

export const settings = {
    "name": "Multithreaded",
    "author": "Joshua Brewster",
    "devices": ["HEG","EEG"],
    "description": "*Hard flex*",
    "categories": ["train"],
    "module": "MultithreadedApplet",
    "image":  featureImg,
		"instructions":`
      Showing off multithreading library support and the flexibility of our tools. 
      `,
    display: {
      production: false,
      development: true
    },
    
    // // App Logic
    // graph:
    // {
    //   nodes: [],
    //   edges: []
    // },

    // editor: {
    //   show: false,
    //   style: `
    //   position: block;
    //   z-index: 9;
    //   `
    // }
}