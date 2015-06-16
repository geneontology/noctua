angular
  .module('noctuaBasicApp', ['ngRoute', 'ngMaterial', 'ui.grid', 'ui.grid.resizeColumns'])
  // Change AngularJS markup's template to avoid clashes with mustache templates
  .config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
  });
