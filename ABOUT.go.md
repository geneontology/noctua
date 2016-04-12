# Introduction

Welcome to the general public face of Noctua. _Current development is
very rapid, so some of these docs may be out of date._

![Noctua screenshot](https://geneontology.github.io/noctua/images/screenshot.png)

## Quickstart

 * *Noctua Users*
    * Start with the [video demos](https://vimeo.com/channels/Noctua), such as the [editing example](https://vimeo.com/channels/noctua/148780879)
    * GO curators should read the [LEGO modeling guide](https://docs.google.com/document/d/18ihslb7prB6CWtu2yjF-pMHZBTY1-AdXJAu-ZyuyXS4/edit#) (draft, in progress)
    * For general tool usage, see the instructions below
 * *Software Developers* -- Development and technical documentation can be found on the [GitHub repository](http://github.com/geneontology/noctua).
 * *Bioinformaticians and Systems Biologists* -- See the [Noctua models repository](http://github.com/geneontology/noctua-models) for access to the underlying models and explanation of the OWL representation
 * *Biologists and end-users* -- We are working on a number of ways to make the models easier to search and to use in data interpretation
    * [Embeddable widgets for adding to existing database websites](https://github.com/geneontology/noctua/issues/221)
    * Browsing of models and annotons in AmiGO. Currently only available in labs. Choose "Select/Browse" on the landing page
    * Network-based enrichment analysis
    * Check back on this site throughout 2016 to see progress!

## How to use the beta

The current preview instance is available here; for a toy example model, see [one of the](http://noctua.berkeleybop.org/editor/graph/gomodel:55ad81df00000001) scratch models.
  
This instance is configured for use with the [Gene Ontology](http://geneontology.org) project.

### Generating/selecting a model

* Models that are currently known (either in memory or file) are found under [Current State] > select "Usable" > [Jump]
* To create a new model from a class and a DB, use [Wizard] > (fill out first sections) > [Generate]; this operation could take tens of minutes depending on the complexity
* To create a new model from just a DB, use [Wizard] > (fill out second section) > [Generate]; this operation may take minutes depending on the size of the GAF to be loaded
* Directly loading by copy-and-paste is not currently tested

### Instances and edges

* A new instance can be created by filling in the form on the left side of the display
* Double clicking edges and instances allows the editing of evidence and comments
* Clicking on the green box upper-left of an instance allows you to view and edit the instance type information
* By dragging the blue circle in the upper-right of an instance to anywhere on a different instance will allow you to create a relation between the two
   
### Models

* Model meta information can be edited by selecting [Model] > [Edit annotations] from the top menu
* [Model] > [Soft refresh] gets a fully updated model from the server; this is what you'll use for the time being when another user makes a change to the model
* [Model] > [Reset] complete reloads everything from the server from scratch
* To export to a text file (Manchester syntax), use [Export]
* To save your current model, select [Model] > [Save]; your model should now be available from the landing page

### General navigation

* Dragging on the background of the model allows you to pan around without using the scrollbars
* Under [Views], there are various zooming options
* To reduce clutter, the "part of" relation can be hidden by selecting [View] > [Show/hide "part of"]
* The minimum space you start with is 800x600px. If you need more, try reseting your model--the space you can use will grow with it.

## Known Issues

The bulk of major issues and feature requests are handled by the
tracker (https://github.com/geneontology/noctua/issues). If something is
not mentioned here or in the tracker, please contact Seth, Heiko, or Chris.

* When editing large models, you may reach a point where almost anything you do will cause an error and hang (refresh to get back to where you were); if you want to make sure your model is saved, contact Seth [#151](https://github.com/geneontology/noctua/issues/151)
* Sometimes, when moving instance or relations near a boundary, the relations will fall out of sync; either move nearby instances or refresh the model
* Sometimes, when editing an instance, the relations (edges) will fall out of sync; either move nearby instances or refresh the model

## Troubleshooting

* Newer versions of Chrome and Firefox are supported, __Safari is not supported__
* You need to have cookies allowed in your browser (for Persona)
* Ad-blockers have been known to cause problems, please use a clean browser profile
* You cannot save unless you have a title.
* You cannot delete.
* When weird things happen, this is pretty much what you should try:
 * Refresh your page
 * "Hard" refresh your page (probably by pressing "shift" or something when you refresh; the idea is to try and flush your cache, getting things freshly from the server)
 * Are you logged in? Are you sure? Try logging out and logging back in again--a bad session can cause all sorts of interesting things
 * Try going back to the main landing page, finding your model again, and trying again
 * Try contacting Seth, Chris, or Heiko
