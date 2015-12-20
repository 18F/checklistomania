var app = angular.module("app", ['ngMaterial']);

app.controller("todoCtrl", function($scope, $http, $sce) {

	$http.get('/api/get-checklists').then(function(response) {
		$scope.checklists = [];
		response.data.checklists.forEach(function(checklist) {
			checklist.dayZeroDate = null;
			$scope.checklists.push(checklist);
		})
	});

	var getUsers = function() {
		$http.get('/api/get-users').then(function(response) {
			$scope.users = [];
			for(var user in response.data.users){
				$scope.users.push({username: user, 
					date: new Date(response.data.users[user].earliestDueDate)});
			}
		});		
	}

	var getItems = function() {
		$http.get('/api/get-items').then(function(response) {
			$scope.items= [];
			response.data.items.forEach(function(item) {
				item.dueDate = new Date(item.dueDate);
				item.descriptionHtml = $sce.trustAsHtml(item.description);
				$scope.items.push(item);
			});
	})}

	$scope.assignToMe = function(checklist) {
		checklist.dayZeroDate = checklist.dayZeroDate || new Date();
		$http.get('/api/assign-checklist', 
			{params: {checklistName: checklist.checklistName, dayZeroDate: checklist.dayZeroDate.valueOf()}})
			.then(function(response) {
				getItems();
				getUsers();
			});
	};

	$scope.markDone = function(item) {
		$http.get('/api/complete-item', {params: {itemId: item.itemId, checklistName: item.checklistName}})
			.then(function(response) {
				getItems();
				getUsers();
			})
	}

	getItems();
	getUsers();
});
