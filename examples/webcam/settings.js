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
        {name:'webcam', class: 'Webcam'},
        {name:'process', class: 'WorkerProcess'},
        {name:'dom', class: 'DOM'},
      ],
      edges: [
        {
          source: 'webcam:stream',
          target: 'process:stream'
        },
        // {
        //   source: 'webcam:debug',
        //   target: 'dom:content'
        // },
        {
          source: 'process:debug',
          target: 'dom:content'
        },
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