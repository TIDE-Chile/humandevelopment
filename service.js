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
      //d3.tsv("./data/data-hdi.txt", function(data) {
      d3.tsv("./data/data-consolidated-idh.txt", function(data) {
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

    var similarCountries = {
      'HDI':[],
      'IHDI':[],
      'GNI':[],
      'LE':[],
      'MYS':[],
      'EYS':[]
    }
    var countriesSimilarHDI = [];
    var countriesSimilarIHDI = [];
    var countriesSimilarIHDIb = [];
    var countriesSimilarIndicator = [];

    _.each(data, function(d) {
      switch(indicator) {
          case 'MYS':
              d.visible = similarMYS(target,d) || similarHDI(target,d);
              break;
          case 'EYS':
              d.visible = similarEYS(target,d) || similarHDI(target,d);
              break;
          case 'GNI':
              d.visible = similarGNI(target,d) || similarHDI(target,d);
              break;
          case 'LE':
              d.visible = similarLE(target,d) || similarHDI(target,d);
              break;
          default:
              d.visible = similarGNI(target,d) || similarHDI(target,d);
      }

      // Add similar countries to list (excluding target)
      if (target !== d) {
        if (similarHDI(target,d)) {
          similarCountries['HDI'].push(d);
        }
        if (+d.IHDI>0 && similarIHDI(target,d)) {
          similarCountries['IHDI'].push(d);
          // Mark those who are similar by IHDI but not HDI 
          d.inequalityFlag = similarHDI(target,d) ? false : true;
        }
        if (similarGNI(target,d)) {
          similarCountries['GNI'].push(d);
        }
        if (similarLE(target,d)) {
          similarCountries['LE'].push(d);
        }
        if (similarEYS(target,d)) {
          similarCountries['EYS'].push(d);
        }
        if (similarMYS(target,d)) {
          similarCountries['MYS'].push(d);
        }
      } 

/*
      && (similarHDI(target,d) || countriesSimilarIHDIb.push(d))) {
        d.noineq = similarHDI(target,d);
        d.ineq = similarIHDIb(target,d);
        countriesSimilarHDI.push(d);
      }
      if (similarIHDI(target,d)) {
        countriesSimilarIHDI.push(d);
      }
      if (similarIHDIb(target,d)) {
        countriesSimilarIHDIb.push(d);
      }
      */

    })

    var bands = similarityBands(target);

    similarCountries['HDI'] = _.groupBy(similarCountries['HDI'], function(d) {return d.Region});
    similarCountries['IHDI'] = _.groupBy(similarCountries['IHDI'], function(d) {return d.Region});
    similarCountries['GNI'] = _.groupBy(similarCountries['GNI'], function(d) {return d.Region});
    similarCountries['LE'] = _.groupBy(similarCountries['LE'], function(d) {return d.Region});
    similarCountries['EYS'] = _.groupBy(similarCountries['EYS'], function(d) {return d.Region});
    similarCountries['MYS'] = _.groupBy(similarCountries['MYS'], function(d) {return d.Region});


    defer.resolve({
      "data":data,
      "bands":bands, 
      "target": target,
      "similarCountries":similarCountries
      /*
      "similarHDI":_.groupBy(countriesSimilarHDI, function(d) {return d.Region}), 
      "similarIHDI":_.groupBy(countriesSimilarIHDI, function(d) {return d.Region}), 
      "similarIHDIb":_.groupBy(countriesSimilarIHDIb, function(d) {return d.Region}), 
      "similarIndicator": _.groupBy(countriesSimilarIndicator, function(d) {return d.Region})
      */
    });

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


  var similarLE = function(a,b) {
    return Math.abs(idxle(a.LE)-idxle(b.LE))<(similarytyIndexWidth/2);
  }

  var similarGNI = function(a,b) {
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

  var similarIHDI = function(a,b) {
    return Math.abs(a.IHDI-b.IHDI)<(similarytyIndexWidth/2);
  }

  var similarityBands = function(a) {
    var bands = {};

    bands["IHDI"] = [a.IHDI-similarytyIndexWidth/2, +a.IHDI+similarytyIndexWidth/2]
    bands["HDI"] = [a.HDI-similarytyIndexWidth/2, +a.HDI+similarytyIndexWidth/2]
    bands["LE"] = [inverseIdxle(idxle(a.LE)-similarytyIndexWidth/2), inverseIdxle(+idxle(a.LE)+similarytyIndexWidth/2)]
    bands["GNI"] = [inverseIdxgni(idxgni(a.GNI)-similarytyIndexWidth/2), inverseIdxgni(+idxgni(a.GNI)+similarytyIndexWidth/2)]
    bands["MYS"] = [inverseIdxmys(idxmys(a.MYS)-similarytyIndexWidth/2), inverseIdxmys(+idxmys(a.MYS)+similarytyIndexWidth/2)]
    bands["EYS"] = [inverseIdxeys(idxeys(a.EYS)-similarytyIndexWidth/2), inverseIdxeys(+idxeys(a.EYS)+similarytyIndexWidth/2)]
    return bands;
  }


}])




