'use strict';

angular.module('myApp.view1', ['ngRoute'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/view1', {
      templateUrl: 'view1/view1.html',
      controller: 'View1Ctrl'
    });
  }])

  .controller('View1Ctrl', ['$scope', function ($scope) {

    $scope.random = function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var margin = {
      top: 100,
      right: 240,
      bottom: 150,
      left: 240
    };
    var width = 780 - margin.left - margin.right;
    var height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

    $scope.getData = function (n) {
      var items = [];
      function getItem() {
        var item = [{
            "title": "Удачный дриблинг",
            "percent": $scope.random(0, 100),
            "change": $scope.random(-100, 100),
            "key": "dribblingAll",
            "_id": "5a97c640415e337bc6b23f43"
          },
          {
            "title": "Удачный Вброс/Выброс",
            "percent": $scope.random(0, 100),
            "change": 0,
            "key": "injectReleaseAll",
            "_id": "5a97c4e3415e337bc6b23f40"
          },
          {
            "title": "Игра на пятаке",
            "percent": $scope.random(0, 100),
            "change": $scope.random(-100, 100),
            "key": "playAtGateAll",
            "_id": "5a97c376415e337bc6b23f3d"
          },
          {
            "title": "Выигранные вбрасывания",
            "percent": $scope.random(0, 100),
            "change": $scope.random(-100, 100),
            "key": "faceOffsAll",
            "_id": "5a1e9848d4d54628bc0ed643"
          },
          {
            "title": "Блокированные броски",
            "percent": $scope.random(0, 100),
            "change": 0,
            "key": "shotsBlockedAll",
            "_id": "5a1e97fad4d54628bc0ed641"
          },
          {
            "title": "Выигранная борьба",
            "percent": $scope.random(0, 100),
            "change": $scope.random(-100, 100),
            "key": "contactGameAll",
            "_id": "5a1e95abd4d54628bc0ed639"
          },
          {
            "title": "Точность передач",
            "percent": $scope.random(0, 100),
            "change": 0,
            "key": "passAll",
            "_id": "5a1e945fd4d54628bc0ed631"
          },
          {
            "title": "Реализованные буллиты",
            "percent": $scope.random(0, 100),
            "change": $scope.random(-100, 100),
            "key": "bulletsAll",
            "_id": "5a1e938ed4d54628bc0ed630"
          },
          {
            "title": "Точность бросков",
            "percent": $scope.random(0, 100),
            "change": $scope.random(-100, 100),
            "key": "shotsAll",
            "_id": "5a1e9197d4d54628bc0ed628"
          }
        ]
        return item;
      }
      for (var i = 0; i <= n; i++) {
        items.push(getItem());
      }
      return items;
    };

    $scope.radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: 100,
      levels: 5,
      labelFactor: 1.4,
      tension: 0.9,
      labelIndicatorWidth: 80,
      domain: 100,
      average: true,
      arrows: true,
      compare: false,
      colors: ["#8EED27", "#374882"]
    };

    $scope.update = function () {
      $scope.radarData = $scope.getData($scope.random(0, 0));
      $scope.average = $scope.random(10, 1000);
    }

    $scope.update();

  }]);