angular
  .module('noctuaBasicApp', ['ngRoute'])
  // Change AngularJS markup's template to avoid clashes with mustache templates
  .config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
  });
