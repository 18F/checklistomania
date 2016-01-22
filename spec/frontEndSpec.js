describe('todoCtrl', function() {
  beforeEach(module('app'));

  var $controller;

  //beforeEach(inject(function(_$controller_){
  //  $controller = _$controller_;
  //}));

    beforeEach(inject(function($injector) {
       // Set up the mock http service responses
       $httpBackend = $injector.get('$httpBackend');
       // backend definition common for all tests
       $httpBackend.when('GET', '/api/')
                      .respond({ message: 'hooray! welcome to the api!' });

       $httpBackend.when('GET', '/api/get-checklists')
                      .respond({ checklists: [{}] });

      $httpBackend.when('GET', '/api/get-items')
                      .respond({ items: [{dueDate: new Date().toString(), description: 'test'}] });

      $httpBackend.when('GET', '/api/get-users')
                      .respond({ users: [{earliestDueDate: new Date().toString()}] });
       // Get hold of a scope (i.e. the root scope)
       $rootScope = $injector.get('$rootScope');
       // The $controller service is used to create instances of controllers
       var $controller = $injector.get('$controller');

       createController = function() {
         return $controller('todoCtrl', {'$scope' : $rootScope });
       };
     }));

    it('testTrafficLight', function() {
      var controller = createController();
      $httpBackend.flush();
      expect($rootScope.getTrafficLight(0)).toEqual('redLight');
      expect($rootScope.getTrafficLight(2)).toEqual('yellowLight');
      expect($rootScope.getTrafficLight(3)).toEqual('greenLight');
    });
});