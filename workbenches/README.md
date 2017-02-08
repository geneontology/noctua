* What is a "workbench"?

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

* Workbench types

There are currently four different workbench types.

- `universal`: This workbench appears as a menu item on the Noctua landing page; the client has no additional information, besides the user token, if available.
- `model`: This workbench appears as a menu item on model pages; the client has access, besides the user token, if available.
- `individual`: TODO
- `edge`: TODO

* Workbench variables

These are the environmental variables made available to workbenches
(as above):

- `global_token`: TODO
- `global_model_id`: TODO
- `global_individual_id`: TODO 
- `global_source_id`: TODO
- `global_target_id`: TODO
- `global_relation_id`: TODO
- TODO

* Workbench file scan

On startup, Noctua will scan the listed directories for workbench
definition files.

* Workbench definition file

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

* Workbench directory layout

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

* Workbench template file variables

TODO: pup-tent injection pattern.

* Workbench development

TODO
