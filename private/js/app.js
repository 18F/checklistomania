var app = angular.module("app", ['ngMaterial']);

app.controller("todoCtrl", function($scope, $http) {
    $scope.msg = "hello from angular!";

	$http.get('/api/get-checklists').then(function(response) {
		$scope.checkLists = response.data.checkLists;
	});

	var getItems = function() {
		$http.get('/api/get-items').then(function(response) {
			$scope.items= [];
			response.data.items.forEach(function(item) {
				item.dueDate = new Date(item.dueDate);
				$scope.items.push(item);
			});
	})}

	$scope.assignToMe = function(checkListName) {
		$http.get('/api/assign-checklist', 
			{params: {checkListName: checkListName, dayZeroDate: new Date().valueOf()}})
			.then(function(response) {
				alert("You've assigned yourself the todo list " + checkListName);
				getItems();
			});
	};

	$scope.markDone = function(item) {
		$http.get('/api/complete-item', {params: {itemId: item.itemId, checkListName: item.checkListName}})
			.then(function(response) {
				alert("You're finished with " + item.itemId);
				getItems();
			})
	}

	getItems();
});
