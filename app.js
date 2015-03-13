'use strict';
/**
* @ngdoc object
* @name ngAnimate
* @description
*/
angular
  .module('tideApp', [
    'tide-angular',
    'underscore',
    'd3service',
    'ui.bootstrap',
    'vr.directives.slider',
    'angulartics', 
    'angulartics.google.analytics'
  ])
  .config(function ($analyticsProvider) {
    $analyticsProvider.firstPageview(true); /* Records pages that don't use $state or $route */
    $analyticsProvider.withAutoBase(true);  /* Records full path */
  });
