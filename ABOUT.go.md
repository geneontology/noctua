Welcome to the general public face of Noctua. _Current development is
very rapid, so some of these docs may be out of date._

![Noctua screenshot](https://geneontology.github.io/noctua/images/screenshot.png)

## Quickstart for...

 * *Noctua Users*
    * Start with the [video demos](https://vimeo.com/channels/Noctua), such as the [editing example](https://vimeo.com/channels/noctua/148780879)
    * GO curators should read the [Noctua Quickstart](/doc/quick-start-guide) (draft, in progress)
    * After that, read the full [GO-CAM modeling guide](https://docs.google.com/document/d/18ihslb7prB6CWtu2yjF-pMHZBTY1-AdXJAu-ZyuyXS4/edit#) (draft, in progress)
    * For general tool usage, see the instructions below
 * *Software Developers* -- Development and technical documentation can be found on the [GitHub repository](http://github.com/geneontology/noctua).
 * *Bioinformaticians and Systems Biologists* -- See the [Noctua models repository](http://github.com/geneontology/noctua-models) for access to the underlying models and explanation of the OWL representation
 * *Biologists and end-users* -- We are working on a number of ways to make the models easier to search and to use in data interpretation
    * [Embeddable widgets](https://github.com/geneontology/noctua/issues/221) for adding to existing database websites
    * Browsing of models and annotons in AmiGO. Currently only available as an experiment; choose [Browse] in the menu bar then [Search]
    * Network-based enrichment analysis
    * Check back on this site throughout 2017 to see progress!

## How to use the beta

This instance is configured for use with the [Gene Ontology](http://geneontology.org) project.

The current preview instance is available here; for a toy example model, see [one of the](http://noctua.berkeleybop.org/editor/graph/gomodel:55ad81df00000001) scratch models.

### Selecting/creatong a model

* Current models on the landing page, which can also be accessed later by clicking the [Overview] menu item
* To create a new model, click [Create Noctua Model] while logged in on the landing page

### Instances and edges in the graph editor

* A new single instance can be created by filling opening the [Add individual] shade on the left side of the display and selecting from the autocomplete
* A new single "annoton" (the four core individuals of GO-CAM modeling) can be created by filling opening the [Add annoton] shade on the left side of the display and selecting from the autocompletes
* Clicking on the green and gray squares in the left and upper-left of entities in the graph will open popups for editing things like evidence and comments
* By dragging the blue circle in the upper-right of an instance to anywhere on a different instance will allow you to create a relation between the two
* Individuals can be moved by clicking and dragging

### Models in the graph editor

* Model meta information can be edited by selecting [Model] > [Edit annotations] from the top menu
* [Model] > [Reset], from the top menu, completely reloads everything from the server from scratch
* To export to a text file (TTL or GPAD), look at the export options under [Model]
* To save your current model, select [Model] > [Save]

### General navigation in the graph editor

* Clicking and dragging on the background of a model allows you to pan around without using the scrollbars
* Under [View] there are various zooming options
* Under [Workbenches] there are various sub-components that will open up in a new window or tab
* [Plugins] is indeed empty right now
* [Skunkworks] includes embedded utilities that you should have separate training on before using
* To reduce clutter, the "part of" relation can be hidden by selecting [View] > [Show/hide "part of"]
* The minimum space you start with is 800x600px. If you need more, try reseting your model--the space you can use will grow with it

## Known Issues

The bulk of major issues and feature requests are handled by the
tracker (https://github.com/geneontology/noctua/issues). If something is
not mentioned here or in the tracker, please contact Seth or Chris.

Some irritants that you may run into sooner rather than later:

* Sometimes, when moving instance or relations near a boundary, the relations will fall out of sync; either move nearby instances or refresh the model
* Sometimes, when editing an instance, the relations (edges) will fall out of sync; either move nearby instances or refresh the model
* The layout system can (will) get confused by larger models and models when "exploded" out; there is a tool in [Skunkworks] that can help with this in the meantime

## Troubleshooting

* Newer versions of Chrome and Firefox are tested and supported, __Safari is not tested or supported, but may work__
* You need to have cookies allowed in your browser (for initial login)
* Ad-blockers have been known to cause problems, please use a clean browser profile
* You cannot save unless you have a title
* You cannot delete a model, only mark it for deletion during periodic cleanups
* When weird things happen, this is pretty much what you should try:
 * Refresh the page in your browser
 * "Hard" refresh the page in your browser(probably by pressing "shift" or something when you refresh; the idea is to try and flush your cache, getting things freshly from the server)
 * Are you logged in? Are you sure? Try logging out and logging back in again--a bad session can cause all sorts of interesting issues
 * Try going back to the main landing page, finding your model again, and trying again
 * Try contacting Seth or Chris

### Noctua Resources

- [Noctua GitHub Repository](https://github.com/geneontology/noctua)
- [Minerva GitHub Repository](https://github.com/geneontology/minerva)
- [Noctua Issue Tracker](https://github.com/geneontology/noctua/issues)
