var angular = require('angular');
require('bs-table');
require('angular-xeditable');

angular
  .module('noctuaBasicApp', [require('angular-route'), require('angular-material'), require('angular-animate'), require('angular-aria'), "bsTable", 'xeditable'])
  // Change AngularJS markup's template to avoid clashes with mustache templates
  .config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
  })
  .run(function(editableOptions) { // specific to xeditable library
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
  });
