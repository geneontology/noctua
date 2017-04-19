# Introduction

Welcome to the general public face of Noctua. _Current development is
very rapid, so some of these docs may be out of date._

![Noctua screenshot](https://geneontology.github.io/noctua/images/screenshot.png)

## Quickstart

 * *Noctua Users*
    * Start with the [video demos](https://vimeo.com/channels/Noctua), such as the [editing example](https://vimeo.com/channels/noctua/148780879)
    * GO curators should read the [Noctua Quickstart](https://docs.google.com/document/d/1amJmQciIT0UlssIBXePf1d-apW2Sjq20Gx_AdpAnap0/edit#) (draft, in progress)
    * After that, read the full [LEGO modeling guide](https://docs.google.com/document/d/18ihslb7prB6CWtu2yjF-pMHZBTY1-AdXJAu-ZyuyXS4/edit#) (draft, in progress)
    * For general tool usage, see the instructions below
 * *Software Developers* -- Development and technical documentation can be found on the [GitHub repository](http://github.com/geneontology/noctua).
 * *Bioinformaticians and Systems Biologists* -- See the [Noctua models repository](http://github.com/geneontology/noctua-models) for access to the underlying models and explanation of the OWL representation
 * *Biologists and end-users* -- We are working on a number of ways to make the models easier to search and to use in data interpretation
    * [Embeddable widgets for adding to existing database websites](https://github.com/geneontology/noctua/issues/221)
    * Browsing of models and annotons in AmiGO. Currently only available in labs. Choose "Select/Browse" on the landing page
    * Network-based enrichment analysis
    * Check back on this site throughout 2016 to see progress!


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
