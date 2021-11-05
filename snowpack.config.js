/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
      src: '/src',
      examples: {url: "/", static: true, resolve: false}
  },
  exclude: [
    '**/node_modules/**/*', 
  ],
  plugins: [
    '@snowpack/plugin-dotenv',
    'snowpack-plugin-glslify',
    ["@snowpack/plugin-optimize", {
        minifyJS: false,
        minifyCSS: true,
        minifyHTML: true,
        preloadModules: true,
        preloadCSS: true,
        target: 'es2015'
      }
    ],
  ],
  packageOptions: {
    polyfillNode: true
  },
  devOptions: {
    port:3000,
    secure: false,
    open: "chrome",
    output: 'stream'
  },
  buildOptions: {
    out: 'dist',
    clean: true,
    sourcemap: true,
    htmlFragments: true
},
}

//externalPackage: [...require('module').builtinModules.filter(m => m !== 'process')],
  