# Creating a Plugin

Let's say we're creating an Arithmetic plugin.

You'll want to structure your repository as a generic library that could be published to NPM (e.g. arithmetic-lib).


We will then wrap this functionality as a Brains@Play plugin (e.g. @brainsatplay/arithmetic).

If it is determined that this plugin is foundational to most applications, we can include this plugin in the core of the brainsatplay library (e.g. brainsatplay.plugins.arithmetic).