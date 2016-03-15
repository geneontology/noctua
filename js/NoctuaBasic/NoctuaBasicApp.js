var angular = require('angular');
require('bs-table');
require('angular-xeditable');
require('angular-ui-bootstrap');
require('angular-animate'); // https://github.com/Foxandxss/angular-toastr
require('angular-toastr'); // https://github.com/Foxandxss/angular-toastr

var app = angular.module('noctuaBasicApp',
  	[require('angular-route'),
  	 'ui.bootstrap',
  	 require('angular-aria'),
     'ngAnimate', 'toastr',
  	 "bsTable",
  	 'xeditable']);


app.config(['toastrConfig', function(toastrConfig) {
  angular.extend(toastrConfig, {
    allowHtml: false,
    closeButton: true,
    // closeHtml: '<button>&times;</button>',
    extendedTimeOut: 10000,
    iconClasses: {
      error: 'toast-error',
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning'
    },
    messageClass: 'toast-message',
    onHidden: null,
    onShown: null,
    onTap: null,
    progressBar: false,
    tapToDismiss: true,
    templates: {
      toast: 'directives/toast/toast.html',
      progressbar: 'directives/progressbar/progressbar.html'
    },
    timeOut: 10000,
    titleClass: 'toast-title',
    toastClass: 'toast'
  });
}]);

// app.directive('autofocus', function($timeout) {
//   return {
//     restrict: 'AC',
//     link: function(scope, _element) {
//       console.log('autofocus');
//       $timeout(function(){
//           _element[0].focus();
//       }, 0);
//     }
//   };
// });

// Change AngularJS markup's template to avoid clashes with mustache templates
// .config(function($interpolateProvider) {
//   $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
// })
app.run(['editableOptions', function(editableOptions) { // specific to xeditable library
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
  }]);

require('./NoctuaBasicController.js');

