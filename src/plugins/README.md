# Creating a Plugin

Let's say we're creating an Arithmetic plugin.

You'll want to structure your repository as a generic library that could be published to NPM (e.g. arithmetic-lib).


We will then wrap this functionality as a B@P plugin (e.g. @brainsatplay/arithmetic).

If it is determined that this plugin is foundational to most applications, we can include this plugin in the core of the brainsatplay library (e.g. brainsatplay.plugins.arithmetic).

## Rationale
Through this workflow, we support the integration of standalone libraries (e.g Three for 3D graphics) with the B@P App system. 

This allows for selective importing and editing within the B@P Studio based on the needs of your project.


# Internal Roadmap
1. Break out the unique functionalities developed by Brains@Play over the past several months into their own independent libraries. Wrap intelligently into a core set of plugins. 
    - Sound.js
    - ThreeShaderUtil
2. Document the proper way to import plugins into your project.