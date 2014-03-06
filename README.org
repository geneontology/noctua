* GO MME Editor
  Prototype editor frontend for the Molecular Modal Environment for
  the Gene Ontology.

  It is based on BBOP JS (using the AmiGO 2 environment) and
  jsPlumb. The backend is the OWLTools Molecular Model Manager.
  
  While the editor is generally developed with Firefox, the experience
  using Chrome/Chromium is quite a bit smoother.

  A test instance is available at: http://go-genkisugi.rhcloud.com/

** How to use demo

*** Generating/selecting a model

    - Models that are currently known (either in memory or file) are
      found under [Current State] > select "Usable" > [Jump]
    - To create a new model from a class and a DB, use [Wizard] >
      (fill out first sections) > [Generate]; this operation could
      take tens of minutes depending on the complexity
    - To create a new model from just a DB, use [Wizard] > (fill out
      second section) > [Generate]; this operation may take minutes
      depending on the size of the GAF to be loaded
    - Directly loading by copy-and-paste is not currently tested

*** Instances and edges

   - A new instance can be created by filling in the form on the left
     side of the display
   - Double clicking edges and instances allows the editing of
     evidence and comments
   - Clicking on the green box upper-left of an instance allows you
     to view and edit the instance type information
   - By dragging the blue circle in the upper-right of an instance to
     anywhere on a different instance will allow you to create a
     relation between the two
   - A complex expression can be added by opening the instance type
     editor and
    - Selecting: enabled_by
    - Entering an expression of the form: "GO:0043234 and ('has part'
      some UniProtKB:P0002) and ('has part' some UniProtKB:P0003)"
   
*** Models

    - Model meta information can be edited by selecting [Model] >
      [Edit annotations] from the top menu
    - [Model] > [Soft refresh] gets a fully updated model from the
      server; this is what you'll use for the time being when another
      user makes a change to the model
    - [Model] > [Reset] complete reloads everything from the server
      from scratch
    - To export to a text file (Manchester syntax), use
      [Export]
    - To save your current model, select [Model] > [Save]; your model
      should now be available from the landing page

*** General navigation

    - Dragging on the background of the model allows you to pan around
      without using the scrollbars
    - Under [Views], there are various zooming options
    - To reduce clutter, the "part of" relation can be hidden by
      selecting [View] > [Show/hide "part of"]

** Known Issues

   The bulk of major issues and feature requests is handled by the
   tracker (https://github.com/kltm/go-mme/issues). If something is
   not mentioned here or in the tracker, please contact Seth or Chris.

   - There is no way to erase nested expressions (short of erasing the
     instance)
   - Complex expression delete button has a serious offset
   - When starting a new model, or editing a current one, there is an
     invisible boundary around the instances that you cannot leave; to
     increase the bounds, refresh the model
   - Sometimes, when moving instance or relations near a boundary, the
     relations will fall out of sync; either move nearby instances or
     refresh the model
   - Sometimes, when editing an instance, the relations will fall out
     of sync; either move nearby instances or refresh the model
   - The endpoint scheme is reversed between creation and instantiation
   - TODO, etc.

** Deployment
   This should be deployable in most JS environments. The following
   instructions assume that an MMM server is available.
*** Local testing
    make start-app
    make start-messenger
*** Local testing with BBOP JS
    make start-app-dev
    make start-messenger-dev
*** OpenShift (server.js only)
    git push openshift master
    (currently at: http://go-genkisugi.rhcloud.com/)
*** Heroku (server.js only)
    TODO
