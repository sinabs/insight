'use strict';

var TRANSACTION_DISPLAYED = 10;
var BLOCKS_DISPLAYED = 5;

angular.module('insight.system').controller('IndexController',
  function($scope, Global, getSocket, Blocks, TransactionsByBlock) {
    console.log('ljp');
    var blocks_copy;//副本
    $scope.global = Global;
    //页面需要显示最近的几笔交易
    //同时交易需要块hash或者地址才能查询出来
    //通过页面首次获取的block上的数据来循环获取交易信息，一旦达到最大值或者已经全部循环完毕，逻辑终止
    //此逻辑和后续socket.io获取交易数据相互独立，可能会存在实际上最新的交易没有排到第一位的情况
    $scope.block_index_cur = 0;
    var _getBlocks = function() {
      Blocks.get({
        limit: BLOCKS_DISPLAYED
      }, function(res) {
        $scope.blocks = res.blocks;
        $scope.blocksLength = res.length;
        blocks_copy = res.blocks.slice(0);//blocks不停的在更新，创建副本
        if(blocks_copy.length){//有block的情况才会根据block来获取交易
          async.doUntil(function(callback){
            var blockHash = blocks_copy[$scope.block_index_cur].hash;//取出块的hash
            console.log('callback index', $scope.block_index_cur, blockHash);
            _getTransactions(blockHash, callback);
            $scope.block_index_cur ++;
          }, function(value){
            console.log('value', value, $scope.txs.length, $scope.block_index_cur, blocks_copy.length);
            return _checkTransactionFull() || $scope.block_index_cur >= blocks_copy.length;
          }, function(error, results){
            //complete callback
            console.log('complete', error, results);
          });
        }
      });
    };
    var _getTransactions = function(blockHash, callback){
      TransactionsByBlock.get({
        block: blockHash
      }, function(res){
        console.log('_getTransactions success', res);
        _transactionHandle(res.tx);
        callback(null, res);
      }, function(){
        //此处不关心数据本身是否能够成功请求，优先保证循环掉所有的block
        console.log('_getTransactions error');
        callback(null, null);
      });
    };

    var _transactionHandle = function(){
        console.log('_transactionHandle', arguments);
        //一个块里面可能会包含多个交易
        $scope.txs.unshift.call(this, arguments);
        if (_checkTransactionFull()) {
          $scope.txs = $scope.txs.splice(0, TRANSACTION_DISPLAYED);
        }
    };

    var _checkTransactionFull = function(){
      return parseInt($scope.txs.length, 10) >= parseInt(TRANSACTION_DISPLAYED, 10);
    };

    var socket = getSocket($scope);

    var _startSocket = function() { 
      socket.emit('subscribe', 'inv');
      socket.on('tx', function(tx) {
        _transactionHandle(tx);
      });

      socket.on('block', function(b) {
        _getBlocks();
      });
    };

    socket.on('connect', function() {
      _startSocket();
    });

    $scope.humanSince = function(time) {
      var m = moment.unix(time);
      return m.max().fromNow();
    };

    $scope.index = function() {
      _getBlocks();
      _startSocket();
    };

    $scope.txs = [];
    $scope.blocks = [];
  });
