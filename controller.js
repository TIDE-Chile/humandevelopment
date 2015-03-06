'use strict';
/* jshint undef: true, unused: true */
/* global angular */




/**
 * @ngdoc controller
 * @name chilecompraApp.controller:CarrerasController
 * @requires $scope
 * @requires chilecompraApp.CarrerasDataService
 *
 * @property {array} colorOptions Array with options for colorAttributes
 * @property {string} colorAttribute Selected color attribute
 * @property {array} data Array with student data for the selected career & semester
 * @property {int} n Number of students in the selected data array
 * @property {int} maxCarreras Maximum number of carreras to be displayed when filtraTopCarreras is true
 * @property {array} semestres Array with the semesters options to be chosen
 * @property {string} selectedSemestre Selected semester for data selection
 * @property {string} psuValido Flag to select only data values with a valid psu score (prom_paa>0)
 * @property {string} loading Flag to show a "loading" message when its value is true
 * @description
 *
 * Controller for Carreras explorer
 *
 */
angular.module('tideApp')
.controller('AppController', ['$scope','$http','_','d3', 'DataService', "$timeout",function ($scope,$http,_,d3, dataService, $timeout) {
	var myself = this;
    this.loading = false;
    this.data = null;
    this.enableInequalityButton = true;
    this.showInequalityBand = false;
    this.targetCountry = "AFG";

    this.dataVersion=0;

    this.ineqTooltip = function() {
        var msg = null;
        if (!(myself.selectedCountry.IHDI > 0)) {
            msg = "Not available for "+myself.selectedCountry.Country+" on "+myself.selectedYear;
        }
        return msg;
    }

    this.indicators=[
        {code: "GNI", label: "Standard of living (Gross national income per capita)", icon:"glyphicon-usd"},
        {code: "LE", label: "Health (Life expectancy)", icon:"glyphicon-heart"},
        {code: "MYS", label: "Education (Mean years of schooling)", icon:"glyphicon-education"},
        {code: "EYS", label: "Education (Expected years of schooling)", icon:"glyphicon-education"}
    ];
    this.years=["2013", "2000", "1995", "1990","1985", "1980"];
    this.selectedIndicator = this.indicators[0].code;
    this.selectedYear = this.years[0];
    this.selectedRegion = null;

    this.limits = {
        "GNI": [100, 100000],
        "LE": [20, 85],
        "MYS": [0, 15],
        "EYS": [0, 20]
    }

    this.onSelected = function(d) {
        myself.targetCountry = d.iso3;
        myself.load();
    }
    
    this.tooltipMessage = function(d) {
        var number = d3.format(",")
        var percentage = d3.format(".1%")

        var msg = "Pais: "+ d.Country+"<br>";
        return msg;
    }

    this.kk = function() {
        myself.targetCountry = myself.selectedCountry.iso3;
        myself.load();
    }

    this.changeSelection = function() {
        myself.load();
    }

    this.changeCountry = function() {
        myself.load();
    }

    this.selectRegion = function() {
        dataService.selectRegion(myself.data, myself.selectedRegion)
        .then(function(data) {
            myself.data = data;
            myself.dataVersion += 1;
        })
    }

    this.changeTarget = function() {
        if (myself.targetCountry.length == 3) {
            myself.load();
        }
    }

    this.changeYear = function() {
        myself.load();
    }

    this.ontype = function(item,model,label) {
        if (item && item.iso3) {
            myself.targetCountry=item.iso3;
            myself.searchedCountry=null
            myself.load();   
        }

    }


    this.changeIndicator = function() { 
        myself.load();
    }

    dataService.getRegions()
    .then(function(data) {
        myself.regions = data;
    })

    dataService.getCountries()
    .then(function(data) {
        myself.countries = data;
    })



    this.load = function() {
        dataService.getDataHDIYear(myself.selectedYear)
        .then(function(data) {
            return dataService.similarTo(data, myself.targetCountry, myself.selectedIndicator);
        }).then(function(result) {
            console.log("loaded")
            myself.selectedCountry = result.target;
            myself.bands = result.bands;
            myself.data = result.data;

            // For some reason the typeahead delays update of data on the directive
            // This is a trick to force update
            $scope.$apply(function() {
               myself.dataVersion += 1; 
            })

            myself.similarCountries = result.similarCountries;
            myself.showInequalityBand = +myself.selectedCountry.IHDI > 0 ? myself.showInequalityBand : false;
    
        })
        
    }

    this.load();

}]);
