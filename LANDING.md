# Welcome...

...to the general public face of Noctua. _Current development is
very rapid, so some of these docs may be out of date._

Development and technical documentation can be found on the [GitHub repository](http://github.com/geneontology/noctua).
  
Please start with the [video demo](https://www.dropbox.com/sh/36ds0rgpmxgzfdi/AABm_TKBG6i0mKThItSMGVxka?preview=noctua-go-demo-intro.mp4).
  
![Noctua screenshot](http://geneontology.github.io/noctua/images/screenshot.png)

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
* A complex expression can be added by opening the instance type editor and
* Selecting: enabled_by
* Entering an expression of the form: "GO:0043234 and ('has part' some UniProtKB:P0002) and ('has part' some UniProtKB:P0003)"
   
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

* Sometimes, when moving instance or relations near a boundary, the relations will fall out of sync; either move nearby instances or refresh the model
* Sometimes, when editing an instance, the relations (edges) will fall out of sync; either move nearby instances or refresh the model
* The endpoint scheme is reversed between creation and instantiation
* TODO, etc.
