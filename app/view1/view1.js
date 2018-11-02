'use strict';

angular.module('myApp.view1', ['ngRoute'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/view1', {
      templateUrl: 'view1/view1.html',
      controller: 'View1Ctrl'
    });
  }])

  .controller('View1Ctrl', ['$scope', function ($scope) {

    var margin = { top: 100, right: 240, bottom: 150, left: 240 };
    var width = 780 - margin.left - margin.right;
    var height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

    var colors = ["#8EED27"];

    $scope.radarData = [[{"title":"Удачный дриблинг","percent":77.77777777777777,"change":0,"key":"dribblingAll","_id":"5a97c640415e337bc6b23f43"},{"title":"Удачный Вброс/Выброс","percent":50,"change":-50,"key":"injectReleaseAll","_id":"5a97c4e3415e337bc6b23f40"},{"title":"Игра на пятаке","percent":0,"change":0,"key":"playAtGateAll","_id":"5a97c376415e337bc6b23f3d"},{"title":"Выигранные вбрасывания","percent":0,"change":0,"key":"faceOffsAll","_id":"5a1e9848d4d54628bc0ed643"},{"title":"Блокированные броски","percent":100,"change":0,"key":"shotsBlockedAll","_id":"5a1e97fad4d54628bc0ed641"},{"title":"Выигранная борьба","percent":52.35294117647059,"change":3.823529411764703,"key":"contactGameAll","_id":"5a1e95abd4d54628bc0ed639"},{"title":"Точность передач","percent":81.19658119658119,"change":9.401709401709397,"key":"passAll","_id":"5a1e945fd4d54628bc0ed631"},{"title":"Реализованные буллиты","percent":0,"change":0,"key":"bulletsAll","_id":"5a1e938ed4d54628bc0ed630"},{"title":"Точность бросков","percent":84.12698412698413,"change":-8.730158730158735,"key":"shotsAll","_id":"5a1e9197d4d54628bc0ed628"}]];
    $scope.colors = ["#8EED27", "#374882"];
    $scope.radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: 100,
      levels: 5,
      labelFactor: 1.4,
      roundStrokes: true,
      tension: 0.9,
      labelIndicatorWidth: 80,
      domain: 100,
      average: true,
      arrows: true,
      compare: true
    };

    

  }]);