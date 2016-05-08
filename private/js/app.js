var app = angular.module("app", ['ngMaterial']);

app.controller("todoCtrl", function($scope, $http, $sce, $mdToast, 
	$mdDialog, $mdMedia) {
	
	var getDaysUntilDue = function(dueDate) {
		return Math.round((dueDate.getTime() - new Date().getTime())/(24*60*60*1000));
	}

	$scope.getTrafficLight = function(item) {
		if(item.completedDate) return "clearLight";
		if(!item.dueDate) return "greyLight";
		if(item.daysUntilDue <= 0) return "redLight";
		if(item.daysUntilDue <=2) return "yellowLight";
		if(item.daysUntilDue > 2) return "greenLight";
	}

	var formatItem = function(item) {
		if(item.dueDate) {
			item.dueDate = new Date(item.dueDate);	
			item.daysUntilDue = getDaysUntilDue(item.dueDate);
		} else {
			item.dueDate = null;
			item.daysUntilDue = null;
		}
		item.descriptionHtml = $sce.trustAsHtml(item.description);
		item.trafficLight = $scope.getTrafficLight(item);		
		return item;
	}

	$http.get('/api/get-checklists').then(function(response) {
		$scope.checklists = [];
		response.data.checklists.forEach(function(checklist) {
			checklist.dayZeroDate = new Date();
			$scope.checklists.push(checklist);
		})
	});

	var compileChecklist = function(checklist) {
		var dayZeroDate = checklist.dayZeroDate;
		checklist = JSON.parse(JSON.stringify(checklist));
		checklist.dayZeroDate = dayZeroDate;
	    compiledItems = {};
	    Object.keys(checklist.items).forEach(function(itemId) {
	      var item = checklist.items[itemId];
	      if(!item.prompt) {
	        compiledItems[itemId] = item;
	      }

	      if(item.prompt && item.displayType=='radio' && item.selected) {
	      	var response = item.possibleResponses.filter(function(response) {
	      		return response.text == item.selected;})[0];
	      	Object.keys(response.items).forEach(function(responseItemId) {
	      		compiledItems[responseItemId] = response.items[responseItemId];	
	      	});
	      }

	      if(item.prompt && item.displayType=='checkbox') {
	      	item.possibleResponses.forEach(function(response) {
	      		console.log(response.selected);
	      		if(response.selected) {
	      			Object.keys(response.items).forEach(function(responseItemId) {
	      				compiledItems[responseItemId] = response.items[responseItemId];	
	      		});
	      		}
	      	})
	      }
	    })

	    checklist.items = compiledItems;
	    return checklist;
  	}

	var showSimpleToast = function(msg) {
	    $mdToast.show(
	      $mdToast.simple()
	        .textContent(msg)
	        .position("top right")
	        .hideDelay(2000)
	    );
	  };

	var getUsers = function() {
		$http.get('/api/get-users').then(function(response) {
			$scope.users = [];
			response.data.users.forEach(function(user) {
				user.earliestDueDate = new Date(user.earliestDueDate);
				user.trafficLight = $scope.getTrafficLight({daysUntilDue: getDaysUntilDue(user.earliestDueDate), 
					dueDate: user.earliestDueDate});
				$scope.users.push(user);
			});
		});		
	}

	var getItems = function(setDefaultTab) {
		$http.get('/api/get-items').then(function(response) {
			$scope.items = [];
			response.data.items.forEach(function(item) {
				$scope.items.push(formatItem(item));
			});

			if(setDefaultTab) {
				$scope.tabDefaultIndex = function() {
					if($scope.items.length == 0) return 1;
					return 0;
				}();
			}
	})}

	var assignToMe = function(checklist) {
		checklist.dayZeroDate = checklist.dayZeroDate || new Date();
		checklist = compileChecklist(checklist);
		$http.post('/api/assign-checklist', 
			{checklistName: checklist.checklistName, dayZeroDate: checklist.dayZeroDate.valueOf(), 
				notes: checklist.notes, checklist: checklist})
			.then(function(response) {
				getItems();
				getUsers();
				$mdDialog.hide()
				showSimpleToast(checklist.checklistName + ' added to your Tasks!');
			});
	};

	$scope.alert = function(msg) {alert(msg);}

	$scope.markDone = function(item) {
		$scope.items.splice($scope.items.indexOf(item), 1);
		$http.get('/api/complete-item', {params: {itemId: item.itemId, checklistName: item.checklistName, 
			id: item._id, timestamp: item.timestamp}})
			.then(function(response) {
				getItems();
				getUsers();
			})
	}

	$scope.clearDone = function() {
		$http.get('/api/clear-done').then(function(response) {
			getItems();
			getUsers();
		})
	}

	$scope.getUserDetails = function(user) {
		$http.get('/api/get-items', {params: {username: user.username}}).then(function(response) {
					user.expanded = true;
					user.items = [];
					response.data.items.forEach(function(item) {	
						user.items.push(formatItem(item));
					});})
	}

	$scope.showAssignToMeDialog = function(ev, checklist) {
	    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
	    $mdDialog.show({
	      controller: "AssignDialogController",
	      templateUrl: 'tmpl/assign-dialog.tmpl.html',
	      parent: angular.element(document.body),
	      targetEvent: ev,
	      clickOutsideToClose:true,
	      fullscreen: useFullScreen,
	      locals: {checklist: checklist}
	    })
	    .then(function(checklist) {
	      assignToMe(checklist);
	    });
	    
	    $scope.$watch(function() {
	      return $mdMedia('xs') || $mdMedia('sm');
	    }, function(wantsFullScreen) {
	      $scope.customFullscreen = (wantsFullScreen === true);
	    });
  };

  $scope.showAddUserDialog = function(ev) {
	    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
	    $mdDialog.show({
	      controller: "AddUserDialogController",
	      templateUrl: 'tmpl/add-user.tmpl.html',
	      parent: angular.element(document.body),
	      targetEvent: ev,
	      clickOutsideToClose:true,
	      fullscreen: useFullScreen
	    })
	    .then(function(username) {
	      	showSimpleToast('Added user "' + username + '"!');
			getUsers();
	    });
	    
	    $scope.$watch(function() {
	      return $mdMedia('xs') || $mdMedia('sm');
	    }, function(wantsFullScreen) {
	      $scope.customFullscreen = (wantsFullScreen === true);
	    });
  };
  
  //BEGIN new create checklist dialog
  $scope.showCreateChecklistDialog = function(ev) {
	    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
	    $mdDialog.show({
	      controller: "CreateChecklistDialogController", //new controller
	      templateUrl: 'tmpl/create-checklist.tmpl.html', //new template
	      parent: angular.element(document.body),
	      targetEvent: ev,
	      clickOutsideToClose:true,
	      fullscreen: useFullScreen
	    })
	    .then(function(checklist) {
			$http.get('/api/get-checklists').then(function(response) {
			$scope.checklists = [];
			response.data.checklists.forEach(function(checklist) {
			checklist.dayZeroDate = new Date();
			$scope.checklists.push(checklist);
		})
	});

	      	showSimpleToast('New checklist ' + checklist.checklistName + ' successfully created!'); //new
	    });
	    
	    $scope.$watch(function() {
	      return $mdMedia('xs') || $mdMedia('sm');
	    }, function(wantsFullScreen) {
	      $scope.customFullscreen = (wantsFullScreen === true);
	    });
  };
  //END create checklist dialog
  
	getItems(true);
	getUsers();
});

app.controller("AssignDialogController", function ($scope, $mdDialog, checklist) {
	$scope.checklist = checklist;

	$scope.cancel = function() {
		$mdDialog.cancel()
	}
	$scope.assign = function() {
	  	$mdDialog.hide(checklist);
	};
});

app.controller("AddUserDialogController", function ($scope, $mdDialog, $http) {
	$scope.cancel = function() {
		$mdDialog.cancel()
	}
	$scope.addUser = function() {
		$scope.warning = null;

		if($scope.username) {
	  		$http.get('/api/add-user', {params: {username: $scope.username}})
		      .then(function(response) {
				if(response.data.success) {
					$mdDialog.hide($scope.username);
				} else {
					$scope.warning = "Could not find username on github.";
			}});			
		} else {
			$scope.warning = "You must enter a github username."; 
		}
	};
});

//BEGIN new controller to create checklist
app.controller("CreateChecklistDialogController", function ($scope, $mdDialog, $http) {
	$scope.cancel = function() {
		$mdDialog.cancel()
	}
	//here is the item container for tasks
	$scope.items = {};
	//create an array for on-demand task adding
	$scope.checklistModels = {
		task : []
	}; 

	//allows click of 'add task' button to dynamically add next task to new checklist
	$scope.addTask = function() {
		var newItemNo = $scope.checklistModels.task.length+1;
		$scope.checklistModels.task.push(['task'+newItemNo]);
	};
    
	//allows removal of last task in new checklist
	$scope.removeTask = function() {
		var lastItem = $scope.checklistModels.task.length-1;
		$scope.checklistModels.task.splice(lastItem);
	};
	
	//makes api call to node to create checklist
	$scope.createChecklist = function() {
		$scope.warning = null;
		
		//api call posting all formdata to node
	  	$http.post('/api/create-checklist', $scope.checklistModels)
	      .then(function(response) {
			if(response.data.success) {
				$mdDialog.hide($scope.checklistModels);
				getItems();
			} else {
				$scope.warning = "Sorry! Please try again";
		}});			

	};
});
//END new controller to create checklist