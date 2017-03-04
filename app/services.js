var key = 'cee9fcf3-1295-48dd-a3c2-0a6212780b16';
angular.module('myApp.services', [])
.factory('data', function($http) {
  return {
    getHolidayInfo: function(country, year, month, callback) {
      $http({
          method: 'GET',
          url: 'https://holidayapi.com/v1/holidays?country=' + country + '&year=' + year + '&month=' + month + '&key=' + key
      }).then(function successCallback(response) {
          response.success = true;
          callback(response);
      }, function errorCallback(response) {
          callback(response);
      });
    }
  };
});