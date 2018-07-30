'use strict';

//Setting up route
angular.module('insight').config(function($routeProvider) {
  $routeProvider.
    when('/block/:blockHash', {
      templateUrl: 'views/block.html',
      title: 'Bitcoinfile Block '
    }).
    when('/block-index/:blockHeight', {
      controller: 'BlocksController',
      templateUrl: 'views/redirect.html'
    }).
    when('/tx/send', {
      templateUrl: 'views/transaction_sendraw.html',
      title: 'Broadcast Raw Transaction'
    }).
    when('/tx/:txId/:v_type?/:v_index?', {
      templateUrl: 'views/transaction.html',
      title: 'Bitcoinfile Transaction '
    }).
    when('/', {
      templateUrl: 'views/index.html',
      title: 'Home'
    }).
    when('/blocks', {
      templateUrl: 'views/block_list.html',
      title: 'Bitcoinfile Blocks solved Today'
    }).
    when('/blocks-date/:blockDate/:startTimestamp?', {
      templateUrl: 'views/block_list.html',
      title: 'Bitcoinfile Blocks solved '
    }).
    when('/address/:addrStr', {
      templateUrl: 'views/address.html',
      title: 'Bitcoinfile Address '
    }).
    when('/status', {
      templateUrl: 'views/status.html',
      title: 'Status'
    }).
    when('/messages/verify', {
      templateUrl: 'views/messages_verify.html',
      title: 'Verify Message'
    })
    .otherwise({
      templateUrl: 'views/404.html',
      title: 'Error'
    });
});

//Setting HTML5 Location Mode
angular.module('insight')
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  })
  .run(function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, gettextCatalog, amMoment) {
    gettextCatalog.currentLanguage = defaultLanguage;
    amMoment.changeLocale(defaultLanguage);
    $rootScope.$on('$routeChangeStart', function() {
      // ngProgress.start();
    });

    $rootScope.$on('$routeChangeSuccess', function() {
      // ngProgress.complete();

      //Change page title, based on Route information
      $rootScope.titleDetail = '';
      $rootScope.title = $route.current.title;
      $rootScope.isCollapsed = true;
      $rootScope.currentAddr = null;

      $location.hash($routeParams.scrollTo);
      $anchorScroll();
    });

    $rootScope.accDiv = function(arg1,arg2){//除
        var t1=0,t2=0,r1,r2; 
        try{t1=arg1.toString().split(".")[1].length}catch(e){} 
        try{t2=arg2.toString().split(".")[1].length}catch(e){} 
        with(Math){ 
            r1=Number(arg1.toString().replace(".","")) 
            r2=Number(arg2.toString().replace(".","")) 
            return (r1/r2)*pow(10,t2-t1); 
        }
    };

    /**
     * 计算总的奖励
     * @param block_height 最新块的高度
     */
    $rootScope.computeRewardSum = function(block_height){
      //实际上分叉是从 501226 开始的，为了计算方便从 420000 开始计算，最后需要减掉两个的差值
      var base = 420000;
      var start_block_height = 501226;
      var interval = 210000;
      var reward_perblock = 10000;//每 210000 个块之后收益减半
      var remain_reward = (start_block_height - base) * reward_perblock;
      var sum = 0;
      var loop_num = 0;
      if(block_height < start_block_height){
        return 0;
      }
      for(;block_height >= base + interval*(loop_num)/*区间范围的小值，包含*/; ){
        if(block_height < base + interval*(loop_num + 1)/*区间范围的大值，不包含*/){
          sum += (block_height - (base + interval*(loop_num)) + 1) * reward_perblock;
        }else{
          sum += interval * reward_perblock;
        }
        loop_num ++;
        reward_perblock = $rootScope.accDiv(reward_perblock, 2);//防止丢精度
      }
      sum -= remain_reward;
      return sum;
    }
  });
