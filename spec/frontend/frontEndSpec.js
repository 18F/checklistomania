/* global describe it expect beforeEach inject $injector */

var $httpBackend;
var $rootScope;
var checklist;
var createController;

describe('todoCtrl', function () {
  beforeEach(module('app'));

  beforeEach(inject(function ($injector) {
    checklist = {
      checklistName: 'Complex Test',
      checklistDescription: 'A complex test with many dependencies.',
      items: {
        dayZero: {
          displayName: 'Start Date',
          description: 'First day on the job',
          daysToComplete: 0,
          dependsOn: []
        },
        signUp: {
          displayName: 'Sign Up',
          description: 'signing up',
          daysToComplete: 5,
          dependsOn: ['dayZero']
        },
        course1: {
          displayName: 'Course One',
          description: 'the first course',
          daysToComplete: 10,
          dependsOn: ['signUp']
        },
        course2: {
          displayName: 'Course Two',
          description: 'the second course',
          daysToComplete: 30,
          dependsOn: ['signUp']
        },
        course3: {
          prompt: 'Is it hosted on cloud.gov?',
          displayType: 'radio',
          possibleResponses: [{
            text: 'Yes, it is.',
            items: {
              loadIntoCloud: {
                displayName: 'Load into cloud.gov',
                daysToComplete: 2,
                dependsOn: ['dayZero']
              },
              mapDomain: {
                displayName: 'Map the domain name.',
                daysToComplete: 2,
                dependsOn: ['loadIntoCloud']
              }
            }
          }, {
            text: 'Nope!',
            items: {
              installOnServer: {
                displayName: 'Install on a physical server',
                daysToComplete: 2,
                dependsOn: ['dayZero']
              }
            }
          }]
        },
        finale: {
          displayName: 'The Finale',
          description: 'last thing',
          daysToComplete: 2,
          dependsOn: ['course1', 'course2']
        }
      }
    };

    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');
    // backend definition common for all tests
    $httpBackend.when('GET', '/api/')
                .respond({ message: 'hooray! welcome to the api!' });

    $httpBackend.when('GET', '/api/get-checklists')
                .respond({ checklists: [{}] });

    $httpBackend.when('GET', /\/api\/get\-items*/)
                .respond({
                  items: [
                    { dueDate: new Date().toString(), description: 'test' },
                    { dueDate: null, description: 'test unactionable items' }
                  ]
                });

    $httpBackend.when('GET', /\/clear-done*/)
                .respond({ success: true });

    $httpBackend.when('GET', '/api/get-users')
                .respond({
                  users: [
                    { earliestDueDate: new Date().toString() }
                  ]
                });

    $httpBackend.when('GET', /\/api\/complete\-item*/)
                .respond({ updatedItemCount: 1 });

    $httpBackend.when('POST', /\/api\/assign\-checklist*/)
                .respond({
                  checklistName: 'test',
                  dayZero: new Date().toISOString(),
                  checklist: checklist
                });

    $httpBackend.when('GET', 'tmpl/assign-dialog.tmpl.html')
                .respond('html here');

    // Get hold of a scope (i.e. the root scope)
    $rootScope = $injector.get('$rootScope');

    createController = function ($mdDialog) {
      // The $controller service is used to create instances of controllers
      var $controller = $injector.get('$controller');
      return $controller('todoCtrl', {
        $scope: $rootScope,
        $mdDialog: $mdDialog
      });
    };
  }));

  it('shows trafficLight properly', function () {
    createController();
    $httpBackend.flush();
    expect($rootScope.getTrafficLight({ daysUntilDue: 0, dueDate: new Date() }))
      .toEqual('redLight');
    expect($rootScope.getTrafficLight({ daysUntilDue: 2, dueDate: new Date() }))
      .toEqual('yellowLight');
    expect($rootScope.getTrafficLight({ daysUntilDue: 3, dueDate: new Date() }))
      .toEqual('greenLight');
    expect($rootScope.getTrafficLight({ completedDate: new Date() }))
      .toEqual('clearLight');
    expect($rootScope.getTrafficLight({ dueDate: null }))
      .toEqual('greyLight');
  });

  it('marks item complete', function () {
    var item = {
      itemId: '1',
      checklistName: 'test',
      _id: '123',
      timestamp: 1234
    };
    createController();
    $httpBackend.flush();
    $rootScope.markDone(item);
    $httpBackend.flush();
  });

  it('assigns a checklist', function () {
    var $mdDialog = {
      hide: function () {},
      show: function () {
        return {
          then: function (fn) {
            fn(checklist);
          }
        };
      }
    };

    createController($mdDialog);
    $httpBackend.flush();
    $rootScope.showAssignToMeDialog(null, checklist);
    $httpBackend.flush();
  });

  it('assigns a checklist with default date if none selected', function () {
    var $mdDialog = {
      hide: function () {},
      show: function () {
        return {
          then: function (fn) {
            fn(checklist);
          }
        };
      }
    };

    createController($mdDialog);
    $httpBackend.flush();
    $rootScope.showAssignToMeDialog(null, checklist);
    $httpBackend.flush();
  });

  it('adds a new user', function () {
    var username = 'testUser';
    var $mdDialog = {
      hide: function () {},
      show: function () {
        return {
          then: function (fn) {
            fn(username);
          }
        };
      }
    };

    createController($mdDialog);
    $httpBackend.flush();

    $rootScope.showAddUserDialog(null);
    $httpBackend.flush();
  });

  it('gets user details', function () {
    createController();
    $httpBackend.flush();
    $rootScope.getUserDetails({ username: 'testUser' });
    $httpBackend.flush();
  });

  it('clears finished tasks', function () {
    createController();
    $httpBackend.flush();
    $rootScope.clearDone();
    $httpBackend.flush();
  });

  it('alerts user when feature is not available', function () {
    createController();
    $httpBackend.flush();
    $rootScope.alert('msg here');
  });
});

describe('AssignDialogController', function () {
  beforeEach(module('app'));

  beforeEach(inject(function ($injector) {
    var $controller = $injector.get('$controller');

    var $mdDialog = {
      cancel: function () {},
      hide: function () {}
    };

    $rootScope = $injector.get('$rootScope');

    createController = function () {
      return $controller('AssignDialogController', {
        $scope: $rootScope,
        $mdDialog: $mdDialog,
        checklist: 'checklistName'
      });
    };
  }));

  it('assigns the checklist', function () {
    createController();
    expect($rootScope.checklist).toEqual('checklistName');
  });

  it('cancels the dialog', function () {
    createController();
    $rootScope.cancel();
  });

  it('assigns checklist', function () {
    createController();
    $rootScope.assign();
  });
});

describe('AddUserDialogController', function () {
  beforeEach(module('app'));

  beforeEach(inject(function ($injector) {
    var $controller = $injector.get('$controller');
    var $mdDialog = {
      hide: function () {},
      cancel: function () {}
    };

    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');

    createController = function () {
      return $controller('AddUserDialogController', {
        $scope: $rootScope,
        $mdDialog: $mdDialog
      });
    };
  }));

  it('adds a user', function () {
    createController();
    $rootScope.username = 'testUser';
    $httpBackend.when('GET', /\/api\/add\-user*/)
                .respond({ success: true });
    $rootScope.addUser();
    $httpBackend.flush();
    expect($rootScope.warning).toEqual(null);
  });

  it('provides a warning for invalid username', function () {
    createController();
    $rootScope.username = 'testUser';
    $httpBackend.when('GET', /\/api\/add\-user*/)
                .respond({ success: false });
    $rootScope.addUser();
    $httpBackend.flush();
    expect($rootScope.warning).toEqual('Could not find username on github.');
  });

  it('provides a warning when username is not entered', function () {
    createController();
    $rootScope.username = null;
    $rootScope.addUser();
    expect($rootScope.warning).toEqual('You must enter a github username.');
  });

  it('cancels the dialog', function () {
    createController();
    $rootScope.cancel();
  });
});
