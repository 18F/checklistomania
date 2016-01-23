describe('todoCtrl', function() {
  beforeEach(module('app'));

  var $controller;

    beforeEach(inject(function($injector) {
       // Set up the mock http service responses
       $httpBackend = $injector.get('$httpBackend');
       // backend definition common for all tests
       $httpBackend.when('GET', '/api/')
                      .respond({ message: 'hooray! welcome to the api!' });

       $httpBackend.when('GET', '/api/get-checklists')
                      .respond({ checklists: [{}] });

      $httpBackend.when('GET', /\/api\/get\-items*/)
                      .respond({ items: [{dueDate: new Date().toString(), description: 'test'}] });

      $httpBackend.when('GET', '/api/get-users')
                      .respond({ users: [{earliestDueDate: new Date().toString()}] });

      $httpBackend.when('GET', /\/api\/complete\-item*/)
                      .respond({ updatedItemCount: 1 });

      $httpBackend.when('GET', /\/api\/assign\-checklist*/)
                      .respond({checklistName: 'test', dayZero: new Date().toISOString()});

      $httpBackend.when('GET', "tmpl/assign-dialog.tmpl.html")
                      .respond('html here');

       // Get hold of a scope (i.e. the root scope)
       $rootScope = $injector.get('$rootScope');
       // The $controller service is used to create instances of controllers
       var $controller = $injector.get('$controller');

       createController = function($mdDialog) {
         return $controller('todoCtrl', {$scope : $rootScope, $mdDialog: $mdDialog});
       };
     }));

    it('shows trafficLight properly', function() {
      var controller = createController();
      $httpBackend.flush();
      expect($rootScope.getTrafficLight(0)).toEqual('redLight');
      expect($rootScope.getTrafficLight(2)).toEqual('yellowLight');
      expect($rootScope.getTrafficLight(3)).toEqual('greenLight');
    });

    it('marks item complete', function() {
      var controller = createController();
      $httpBackend.flush();
      var item = {itemId: '1', checklistName: 'test', _id: '123', timestamp: 1234};
      $rootScope.markDone(item);
      $httpBackend.flush();
    });
    
    it('assigns a checklist', function() {
      var checklist = {dayZeroDate: new Date(), checklistName: 'test', notes: 'testNotes'};
      $mdDialog = {hide: function() {}, show: function(obj) {return {then: function(fn) {fn(checklist)}}}};
      
      var controller = createController($mdDialog);
      $httpBackend.flush();
      var checklist = {checklistName: 'test', dayZeroDate: new Date().valueOf(), 
        notes: 'forTesting'}
      $rootScope.showAssignToMeDialog(null, checklist);
      $httpBackend.flush();
    })

    it('adds a new user', function() {
      var username = 'testUser';
      $mdDialog = {hide: function() {}, show: function(obj) {return {then: function(fn) {fn(username)}}}};
      
      var controller = createController($mdDialog);
      $httpBackend.flush();

      $rootScope.showAddUserDialog(null);
      $httpBackend.flush();
    })

    it('gets user details', function() {
      var controller = createController();
      $httpBackend.flush();
      $rootScope.getUserDetails({username: 'testUser'});
      $httpBackend.flush();
    })

});