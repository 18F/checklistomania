var app = angular.module("app", ['ngMaterial', 'ngCookies']);

app.controller("todoCtrl", function($scope, $http, $sce, $mdToast, 
	$mdDialog, $mdMedia, $cookies) {
	var getTrafficLight = function(daysLeft) {
		if(daysLeft <= 0) return "redLight";
		if(daysLeft <=2) return "yellowLight";
		return "greenLight";
	}

	var formatItem = function(item) {
		item.dueDate = new Date(item.dueDate);
		item.daysUntilDue = Math.round((item.dueDate.getTime() - new Date().getTime())/(24*60*60*1000));
		item.descriptionHtml = $sce.trustAsHtml(item.description);
		item.trafficLight = getTrafficLight(item.daysUntilDue);		
		return item;
	}

	$http.get('/api/get-checklists').then(function(response) {
		$scope.checklists = [];
		response.data.checklists.forEach(function(checklist) {
			checklist.dayZeroDate = null;
			$scope.checklists.push(checklist);
		})
	});

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
				$scope.users.push(user);
			});
		});		
	}

	var getItems = function() {
		$http.get('/api/get-items').then(function(response) {
			$scope.items = [];
			response.data.items.forEach(function(item) {
				$scope.items.push(formatItem(item));
			});
	})}

	var assignToMe = function(checklist) {
		checklist.dayZeroDate = checklist.dayZeroDate || new Date();
		$http.get('/api/assign-checklist', 
			{params: {checklistName: checklist.checklistName, dayZeroDate: checklist.dayZeroDate.valueOf(), 
				notes: checklist.notes}})
			.then(function(response) {
				getItems();
				getUsers();
				$mdDialog.hide()
				showSimpleToast(checklist.checklistName + ' added to your TODOs!');
			});
	};

	$scope.selectedTabIndex = parseInt($cookies.get('selectedTabIndex')) || 0;
	$scope.viewTable = ($cookies.get('viewTable') == 'true');

	$scope.setViewTable = function(tableViewOn) {
		$cookies.put('viewTable', tableViewOn);
		$scope.viewTable = tableViewOn;
	}

	$scope.setTabCookie = function(tabIndex) {
		$cookies.put('selectedTabIndex', tabIndex);
	}

	$scope.markDone = function(item) {
		$http.get('/api/complete-item', {params: {itemId: item.itemId, checklistName: item.checklistName, 
			id: item._id, timestamp: item.timestamp}})
			.then(function(response) {
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

	$scope.showAdvanced = function(ev, checklist) {
	    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
	    $mdDialog.show({
	      controller: DialogController,
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

	getItems();
	getUsers();
});

function DialogController($scope, $mdDialog, checklist) {
	$scope.checklist = checklist;

	$scope.cancel = function() {
		$mdDialog.cancel()
	}
	$scope.assign = function() {
	  	$mdDialog.hide(checklist);
	};
}
