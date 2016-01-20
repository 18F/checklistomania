describe('todoCtrl', function() {
  beforeEach(module('app'));

  var $controller;

  beforeEach(inject(function(_$controller_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
  }));

  describe('$scope.grade', function() {
    it('testTrafficLight', function() {
      var $scope = {};
      var controller = $controller('todoCtrl', { $scope: $scope });
      expect($scope.getTrafficLight(0)).toEqual('redLight');
      expect($scope.getTrafficLight(2)).toEqual('yellowLight');
      expect($scope.getTrafficLight(3)).toEqual('greenLight');
    });
  });
});