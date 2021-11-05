export const settings = {
    name: "Blank Project",
    devices: ["EEG", "HEG"],
    author: "Brains@Play",
    description: "Start from scratch with a new project using brainsatplay.js!",
    categories: ["Learn", 'templates'],
    instructions: "",
    display: {
      production: false,
      development: false
    },

    // App Logic
    graphs:
    [{
      nodes: [
        {name:'eeg', class: 'EEG'},
        {name:'neurofeedback', class: 'Neurofeedback'},
        // {name:'sine', class: 'Sine', params: {amplitude: 0.2, frequency: 1/3}},
        {name:'circle', class: 'Circle', params: {radius: 0.2}},
        {name:'canvas', class: 'Canvas', params: {animate: true}},
        {name:'dom', class: 'DOM'},
      ],
      edges: [
        {
          source: 'eeg:atlas',
          target: 'neurofeedback'
        },
        {
          source: 'neurofeedback',
          target: 'circle:radiusOffset'
        },
        // {
        //   source: 'sine',
        //   target: 'circle:radiusOffset'
        // },
        {
          source: 'circle:draw',
          target: 'canvas:draw'
        },
        {
          source: 'canvas:element',
          target: 'dom:content'
        }
    ]
    }],

    // editor: {
    //   show: true,
    //   style: `
    //   position: block;
    //   z-index: 9;
    //   `,
    // }
}