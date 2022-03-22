### What is a "workbench"?

The intention of workbenches is that group can develop functionality
for Noctua without having to integrate with the main stack using
whatever libraries and UI paradigm they want. We are looking to also
allow "group" specific workbenches available for users as they switch
"hats".

More practically, the workbench system in Noctua is a method for
writing light site-specific sub-applications for Noctua. They are
pre-compiled JS sets/bundles that are found at startup time and
injected into an environment that contains Noctua specific global
variables for them to inspect and operate on. Users interact with them
by the menu items or buttons added by Noctua for them in their
specific contexts (see next section).

### Workbench types

There are currently four different workbench types.

- `universal`: This workbench appears as a menu item on the Noctua landing page; the client has no additional information, besides the user token, if available.
- `model`: This workbench appears as a menu item on model pages; the client has access to, besides the user token, model-specific information.
- `individual`: TODO
- `edge`: TODO

### Workbench variables

These are the environmental variables (with example values) made available to workbenches
(as above):

```javascript
global_model = null
global_id = null
// (deprecated) `model_id = null
global_model_id = null
global_individual_id = null
global_subject_individual_id = null
global_object_individual_id = null
global_relation_id = null
global_golr_server = "http://amigo-dev-golr.berkeleybop.org/"
global_golr_neo_server = "http://noctua-golr.berkeleybop.org/"
global_minerva_definition_name = "minerva_public_dev"
global_barista_location = "http://barista-dev.berkeleybop.org"
global_noctua_context = "go"
global_noctua_minimal_p = false
global_external_browser_location = "http://tomodachi.berkeleybop.org/amigo/search/model_annotation"
global_known_relations = [{"id":"BFO:0000050","label":"part_of","relevant":true},
global_collapsible_relations = ["RO:0002233","RO:0002234","RO:0002333","RO:0002488","BFO:0000066","BFO:0000051","RO:0001025"]
global_collapsible_reverse_relations = ["RO:0002430","RO:0002429","RO:0002428"]
global_barista_token = null
global_workbenches_universal = [{"menu-name":"Model count (template)","page-name":"Model Count","type":"universal","help-link":"http://github.com/geneontology/noctua/issues","javascript":["http://vuejs.org/js/vue.min.js","foo.js"],"workbench-id":"count","template-injectable":"workbenches/count/public/inject.tmpl","public-directory":"workbenches/count/public"},
global_workbenches_model = [{"menu-name":"Annotation preview","page-name":"Annotation Preview","type":"model","help-link":"http://github.com/geneontology/noctua/issues","javascript":["AnnPreviewBundle.js","jquery.dataTables.min.js"],"css":["https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"],"workbench-id":"annpreview","template-injectable":"workbenches/annpreview/public/inject.tmpl","public-directory":"workbenches/annpreview/public"},
global_workbenches_individual = [{"menu-name":"Component companion ","page-name":"Component Companion","type":"individual","help-link":"http://github.com/geneontology/noctua/issues","javascript":["http://cdnjs.cloudflare.com/ajax/libs/vue/2.1.0/vue.js","vue-spinner.min.js","GPBuddyBundle.js"],"css":[],"workbench-id":"gpbuddy","template-injectable":"workbenches/gpbuddy/public/inject.tmpl","public-directory":"workbenches/gpbuddy/public"}]
global_workbenches_edge = []
global_sparql_templates_named = {"trivial03":{"title":"Trival.","handle":"trivial03","description":"A completely trivial query, with a higher limit and for a model.","tags":["TODO"],"endpoint":"https://rdf.geneontology.org/sparql","variables":{"model_id":{"comment":"The intended GO model."}},"query":"TODO"}}
global_sparql_templates_universal = [{"title":"Trival query (longer).","handle":"trivial02","description":"A completely trivial query, with a higher limit.","tags":["TODO"],"endpoint":"https://rdf.geneontology.org/sparql","query":"TODO"}]
global_sparql_templates_model = [{"title":"foo","handle":"trivial03","description":"Trivial","tags":["TODO"],"endpoint":"https://rdf.geneontology.org/sparql","variables":{"model_id":{"comment":"The intended GO model."}},"query":"TODO"}]
global_sparql_templates_individual = []
global_sparql_templates_edge = []
global_github_api = "api.github.com"
global_github_org = "geneontology"
global_github_repo = "noctua-models"
global_use_github_p = true
```


### Workbench file scan

On startup, Noctua will scan the listed directories for workbench
definition files.

### Workbench definition file

The definition YAML file for a workbench contains the following
fields. These fields will be scanned for issues at runtime, with
problematic files getting dropped.

- `menu-name`: The string to display for this item in a menu context
- `page-name`: The string to display for this item as a page title
- `type`: The type of workbench that this file describes; the current possible values are: "universal", "model", "individual", and "edge".
- `help-link`: The URL for further help with this workbench.
- `javascript`: *OPTIONAL* A list of JavaScript files to include in the workbench page; the only two possible locations are local (the name of the file in the /public directory) and remote URL (e.g. http://vuejs.org/js/vue.min.js).
- `css`: *OPTIONAL* A list of CSS files to include in the workbench page; the only two possible locations are local (the name of the file in the /public directory) and remote URL (e.g. http://vuejs.org/css/vue.min.css).

Example:

```
menu-name: "Model count (template)"
page-name: "Model Count"
type: "universal"
help-link: "http://github.com/geneontology/noctua/issues"
javascript:
  - http://vuejs.org/js/vue.min.js
  - foo.js
```

### Workbench directory layout

The unique identifier for the workbench is the directory that it
exists in; it may only contain alphanums, it is used for asset
discovery and routing.

The assets and route for a workbench are derived from the
`workbench-id`. The asset and working directory of a workbench is the
directory `workbench-id`.

All assets to be delivered or injected must exist in `workbench-id`/public". Moreover, all *.css and *.js files will be delivered from this directory at the route: http\:\/\/noctua-instance.domain/workbench/\<workbench-id\>

The template or HTML file (one or the other) to inject into the Noctua
page must exist at `workbench-id`/`workbench-id`.tmpl" or
`workbench-id`/`workbench-id`.html". If using a template, it must be a
mustache template; a definition listing of the variables that can be
used can be found below.

All other files and directories are available to the developers for
deployment, management, and compilation.

### Workbench template file variables

TODO: pup-tent injection pattern.

### Workbench development

TODO
