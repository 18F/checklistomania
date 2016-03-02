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

      $httpBackend.when('GET', /\/api\/get\-all\-items*/)
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
      expect($rootScope.getTrafficLight({daysUntilDue: 0, dueDate: new Date()})).toEqual('redLight');
      expect($rootScope.getTrafficLight({daysUntilDue: 2, dueDate: new Date()})).toEqual('yellowLight');
      expect($rootScope.getTrafficLight({daysUntilDue: 3, dueDate: new Date()})).toEqual('greenLight');
      expect($rootScope.getTrafficLight({completedDate: new Date()})).toEqual('clearLight');
      expect($rootScope.getTrafficLight({dueDate: null})).toEqual('greyLight');
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

    it('assigns a checklist with default date if none selected', function() {
      var checklist = {dayZeroDate: null, checklistName: 'test', notes: 'testNotes'};
      $mdDialog = {hide: function() {}, show: function(obj) {return {then: function(fn) {fn(checklist)}}}};
      
      var controller = createController($mdDialog);
      $httpBackend.flush();
      var checklist = {checklistName: 'test', dayZeroDate: null, 
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

describe('AssignDialogController', function() {
  beforeEach(module('app'));
  var $controller;

    beforeEach(inject(function($injector) {
       $rootScope = $injector.get('$rootScope');
       var $controller = $injector.get('$controller');

       var $mdDialog = {cancel: function() {}, hide: function(checklist) {}}
       createController = function() {
         return $controller('AssignDialogController', {$scope : $rootScope, $mdDialog: $mdDialog, 
            checklist: 'checklistName'});
       };
     }));

    it('assigns the checklist', function() {
      var controller = createController();  
      expect($rootScope.checklist).toEqual('checklistName');
    });

    it('cancels the dialog', function() {
      var controller = createController();  
      $rootScope.cancel()
    });

    it('assigns checklist', function() {
      var controller = createController();  
      $rootScope.assign()
    });
});

describe('AddUserDialogController', function() {
  beforeEach(module('app'));
  var $controller;

    beforeEach(inject(function($injector) {
       $rootScope = $injector.get('$rootScope');
       var $controller = $injector.get('$controller');

       $httpBackend = $injector.get('$httpBackend');

       var $mdDialog = {hide: function() {}, cancel: function() {}};
       createController = function() {
         return $controller('AddUserDialogController', {$scope : $rootScope, $mdDialog: $mdDialog});
       };
     }));

    it('adds a user', function() {
      var controller = createController();  
      $rootScope.username = 'testUser';
      $httpBackend.when('GET', /\/api\/add\-user*/)
                      .respond({ success: true });
      $rootScope.addUser();
      $httpBackend.flush();
      expect($rootScope.warning).toEqual(null);
    });

    it('provides a warning for invalid username', function() {
      var controller = createController();  
      $rootScope.username = 'testUser';
      $httpBackend.when('GET', /\/api\/add\-user*/)
                      .respond({ success: false });
      $rootScope.addUser();
      $httpBackend.flush();
      expect($rootScope.warning).toEqual("Could not find username on github.");
    });

    it('provides a warning when username is not entered', function() {
      var controller = createController();  
      $rootScope.username = null;
      $rootScope.addUser();
      expect($rootScope.warning).toEqual("You must enter a github username.");
    });

    it('cancels the dialog', function() {
      var controller = createController();  
      $rootScope.cancel()
    });
});