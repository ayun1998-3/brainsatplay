export const settings = {
    name: "Ideal Project",
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
    graphs: [{
      nodes: [
        {name:'eeg', class: 'EEG'},
        {name:'neurofeedback', class: 'Neurofeedback'},
        {name:'event', class: 'Event'},

      ],
      edges: [
        {
          source: 'eeg:atlas',
          target: 'neurofeedback'
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