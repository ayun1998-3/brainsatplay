import featureImg from './img/feature.png'

export const settings = {
    "name": "Vanilla",
    "author": "Joshua Brewster",
    "devices": ["HEG","EEG"],
    "description": "Original applet style",
    "categories": ["train"],
    "module": "VanillaApplet",
    "image":  featureImg,
		"instructions":`
      Edit the default functions present in the applet and work with the libraries and imports however you want as any other javascript file.
      These classes can be imported and run standalone.
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