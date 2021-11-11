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

        {name:'dom', class: 'DOM'},
      ],
      edges: [

        // {
        //   source: 'webcam:debug',
        //   target: 'dom:content'
        // },
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