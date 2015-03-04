'use strict';
/* jshint undef: true, unused: true */
/* global angular */

/**
 * @ngdoc service
 * @name chilecompraApp.MyDataService
 * @requires $q
 * @requires d3
 * @requires _
 * @requires $http
 *
 * @description
 * Demo
 *
 */
angular.module('tideApp')
.service('DataService',['$q', 'd3', '_', '$http',function($q, d3,_, $http) {
  var myself = this;

  var similarytyIndexWidth = 0.05;


  myself.dataHdi = null;



  this.getDataHDI = function() {
    var defer = $q.defer();

    if (myself.dataHdi) {
      defer.resolve(myself.dataHdi);
    } else {
      d3.tsv("./data/data-hdi.txt", function(data) {
        if (data) {
          myself.dataHdi = data;
          defer.resolve(myself.dataHdi);
        } else {
          defer.reject();
        }
      })
    }

    return defer.promise;
  }

  this.getDataIHDI = function() {
    var defer = $q.defer();

    if (myself.data) {
      defer.resolve(myself.data);
    } else {
      d3.tsv("./data/data-ihdi.txt", function(data) {
        if (data) {
          myself.data = data;
          defer.resolve(myself.data);
        } else {
          defer.reject();
        }
      })
    }

    return defer.promise;
  }

  this.getDataHDIYear = function(year) {
    var defer = $q.defer();

    this.getDataHDI()
    .then(function(data) {
      var result = _.filter(data, function(d) {
        return d.year == year;
      })
      defer.resolve(result);
    })

    return defer.promise;
  }

  this.selectRegion = function(data, regiones) {
    var defer = $q.defer();

    _.each(data, function(d) {
      d.visible = regiones.indexOf(d.Region) > -1
    })

    defer.resolve(data);

    return defer.promise;
  }


  this.getRegions = function() {
    var defer = $q.defer();

    myself.getDataHDI()
    .then(function(data) {
      var result = _.groupBy(data, function(d) {
        return d['Region'];
      })
      defer.resolve(_.keys(result));
    })

    return defer.promise;
  }

  this.getCountries = function() {
    var defer = $q.defer();

    myself.getDataHDI()
    .then(function(data) {
      var countries = [];
      var groups = _.groupBy(data, function(d) {
        return d['iso3'];
      })

      _.each(_.keys(groups), function(d) {
        countries.push({
          countryCode:d, 
          countryName:groups[d][0].Country,
          region:groups[d][0].Region,
          subregion:groups[d][0].Subregion
        }) 
      })


      defer.resolve(countries);
    })

    return defer.promise;
  }


  this.similarTo = function(data, countryCode, indicator) {
    var defer = $q.defer();

    var target = _.find(data, function(d) {
      return d.iso3 == countryCode;
    })

    _.each(data, function(d) {
      switch(indicator) {
          case 'MYS':
              d.visible = similarMYS(target,d) || similarHDI(target,d);
              break;
          case 'EYS':
              d.visible = similarEYS(target,d) || similarHDI(target,d);
              break;
          case 'GNI':
              d.visible = similarGni(target,d) || similarHDI(target,d);
              break;
          case 'LE':
              d.visible = similarLifeExp(target,d) || similarHDI(target,d);
              break;
          default:
              d.visible = similarGni(target,d) || similarHDI(target,d);
      }
      //d.visible = Math.abs(d.EYS - target.EYS) < 1;
    })

    var bands = similarityBands(target);

    defer.resolve({"data":data,"bands":bands, "target": target});

    return defer.promise;
  }

  // Gets LE index given a LE
  var idxle = function(le) {
      return (le-20)/(85-20);
  }

  // Gets GNI index given a gni value
  var idxgni = function(y) {
    return (Math.log(y)-Math.log(100))/(Math.log(75000)-Math.log(100));
  }

  // Gets EYS index given a EYS value
  var idxeys = function(y) {
    return (y-0)/(18-0);
  }

  // Gets MYS index given a MYS value
  var idxmys = function(y) {
    return (y-0)/(15-0);
  }

  // Gets life expectancy associated to a LE index
  var inverseIdxle = function(idxle) {
      return idxle*(85-20)+20;
  }

  // Gets life expectancy associated to a gni index
  var inverseIdxgni = function(idxgni) {
      return Math.pow( Math.E, idxgni*(Math.log(75000)-Math.log(100))+Math.log(100));
  }

  // Gets EYS value give an EYS index
  var inverseIdxeys = function(idxeys) {
      return idxeys*(18-0)+0;
  }

  // Gets MYS value give an MYS index
  var inverseIdxmys = function(idxmys) {
      return idxmys*(15-0)+0;
  }


  var similarLifeExp = function(a,b) {
    return Math.abs(idxle(a.LE)-idxle(b.LE))<(similarytyIndexWidth/2);
  }

  var similarGni = function(a,b) {
    return Math.abs(idxgni(a.GNI)-idxgni(b.GNI))<(similarytyIndexWidth/2);
  }

  var similarEYS = function(a,b) {
    return Math.abs(idxeys(a.EYS)-idxeys(b.EYS))<(similarytyIndexWidth/2);
  }

  var similarMYS = function(a,b) {
    return Math.abs(idxmys(a.MYS)-idxmys(b.MYS))<(similarytyIndexWidth/2);
  }

  var similarHDI = function(a,b) {
    return Math.abs(a.HDI-b.HDI)<(similarytyIndexWidth/2);
  }

  var similarityBands = function(a) {
    var bands = {};

    bands["HDI"] = [a.HDI-similarytyIndexWidth/2, +a.HDI+similarytyIndexWidth/2]
    bands["LE"] = [inverseIdxle(idxle(a.LE)-similarytyIndexWidth/2), inverseIdxle(+idxle(a.LE)+similarytyIndexWidth/2)]
    bands["GNI"] = [inverseIdxgni(idxgni(a.GNI)-similarytyIndexWidth/2), inverseIdxgni(+idxgni(a.GNI)+similarytyIndexWidth/2)]
    bands["MYS"] = [inverseIdxmys(idxmys(a.MYS)-similarytyIndexWidth/2), inverseIdxmys(+idxmys(a.MYS)+similarytyIndexWidth/2)]
    bands["EYS"] = [inverseIdxeys(idxeys(a.EYS)-similarytyIndexWidth/2), inverseIdxeys(+idxeys(a.EYS)+similarytyIndexWidth/2)]
    return bands;
  }


}])




