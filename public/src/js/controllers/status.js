'use strict';

angular.module('insight.status').controller('StatusController',
  function($scope, $rootScope, $routeParams, $location, Global, Status, Sync, getSocket) {
    $scope.global = Global;
    $scope.totalRewards = 0;

    $scope.getStatus = function(q) {
      Status.get({
          q: 'get' + q
        },
        function(d) {
          $scope.loaded = 1;
          angular.extend($scope, d);
          if(q == 'Info'){
            $scope.totalRewards = $rootScope.computeRewardSum(d.info.blocks);
          }
        },
        function(e) {
          $scope.error = 'API ERROR: ' + e.data;
        });
    };

    $scope.humanSince = function(time) {
      var m = moment.unix(time / 1000);
      return m.max().fromNow();
    };

    var _onSyncUpdate = function(sync) {
      $scope.sync = sync;
    };

    var _startSocket = function () {
      socket.emit('subscribe', 'sync');
      socket.on('status', function(sync) {
        _onSyncUpdate(sync);
      });
    };
    
    var socket = getSocket($scope);
    socket.on('connect', function() {
      _startSocket();
    });


    $scope.getSync = function() {
      _startSocket();
      Sync.get({},
        function(sync) {
          _onSyncUpdate(sync);
        },
        function(e) {
          var err = 'Could not get sync information' + e.toString();
          $scope.sync = {
            error: err
          };
        });
    };
  });
