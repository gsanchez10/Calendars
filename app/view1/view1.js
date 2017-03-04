'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.directive('month', function(){
	return {
		templateUrl: 'view1/month.html'
	};
})

.directive('date', function(){
	return {
		templateUrl: 'view1/date.html'
	}
})

.controller('View1Ctrl', ['$scope', '$q', 'data', function($scope, $q, data) {
	$scope.getCurrent = function(months) {//this function returns and object with the month number, monthname and year based on an array of dates (consideringvalid dates)
		for(var i=0; i<months.length; i++) {
			if(months[i].dayType != 'invalid') {
				return {month: months[i].getMonth()+1, monthName: months[i].getMonthName(), year: months[i].getFullYear()};
			}
		}
	};
	$scope.checkHolidays = function(month) {//this function calls the holidays api using the injected service "data"
		return $q(function(resolve, reject) {
			try {
				if($scope.countryCode == '' || $scope.countryCode == undefined || $scope.countryCode == null) {
					throw 'You did not enter a valid country code. No holidays will be available.'
				}
			}
			catch(err) {
				alert(err);
				return;
			}
			data.getHolidayInfo($scope.countryCode, 2016, month, function(response) {
				if(response.success) {
					for(var i=0; i<response.data.holidays.length; i++) {
						$scope.holidays.push(response.data.holidays[i]);
					}
				}
				resolve();
			});
			
		});
	};
	$scope.compareDates = function(date1,date2) {
		if(date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear()) {
			return true;
		}
		return false;
	};
	$scope.fillRemainingDates = function(date, month, pos) {//function to fill a month from the last date to the end of week with invalid dates
		var prevDate = new Date(date);
		prevDate.setDate(prevDate.getDate()-1);
		if(prevDate.getDay() != 6) {//if the date is not saturday, we need to see if it is necessary to fill the remaining days of week with invalid dates
			for(var i=pos; i<=(pos+(6-prevDate.getDay()-1)); i++) {
				$scope.selectedDates[month][i] = new Date((($scope.selectedDates[month][i-1])?$scope.selectedDates[month][i-1]:date));
				$scope.selectedDates[month][i].setDate($scope.selectedDates[month][i].getDate()+1);

				$scope.selectedDates[month][i].dayType = 'invalid';
			}
		}
	};
	$scope.submit = function() {//user submits form
		var date;
		var finalDate;

		try {
			if($scope.initialDate == null) {
				throw 'Please choose a date';
			}
			date = $scope.initialDate;
			finalDate = new Date(date);
			finalDate.setDate(date.getDate()+$scope.days);
			$scope.selectedDates[0] = [];
		}
		catch(err) {
			alert(err);
			return false;//break submit
		}

		var month = 0;
		var pos = 0;
		while(date<finalDate) {//start creating the array of dates starting with the date that the user entered and finishing after the amount of days that the user entered
			
			if((pos != 0) && (date.getMonth()+1 > $scope.selectedDates[month][pos-1].getMonth()+1 || (date.getFullYear() > $scope.selectedDates[month][pos-1].getFullYear()))) {//reached end of month, (comparing months of past date and current date and also preventing to do it the first time)
				$scope.fillRemainingDates(date, month, pos);//fill remaining dates of month with "invalid" dates
				month++;
				pos = 0;
				$scope.selectedDates[month] = [];
			}
			if(pos == 0) {//fill the previous dates of month with "invalid" dates
				if(date.getDay() != 0) {
					for(var i=date.getDay()-1; i >= 0; i--) {
						$scope.selectedDates[month][i] = new Date((($scope.selectedDates[month][i+1])?$scope.selectedDates[month][i+1]:date));
						$scope.selectedDates[month][i].setDate($scope.selectedDates[month][i].getDate()-1);
						$scope.selectedDates[month][i].dayType = 'invalid';
						
					}
					pos = date.getDay();
				}
			}

			$scope.selectedDates[month][pos] = new Date(date);
			$scope.selectedDates[month][pos].dayType = ($scope.selectedDates[month][pos].getDay() == 6 || $scope.selectedDates[month][pos].getDay() == 0)? 'weekend':'week';
			
			date.setDate(date.getDate()+1);
			pos++;

			var tempDate = new Date(date);
			tempDate.setDate(tempDate.getDate()+1);//creating this temp date to compare it with the final date (to see if we need to fill the remaining dates with invalids)
			if($scope.compareDates(tempDate, finalDate) == true) {
				$scope.fillRemainingDates(tempDate, month, pos+1);
			}
		}

		console.log($scope.selectedDates);

		var promises = [];
		for(var i=0; i < $scope.selectedDates.length; i++) {//fill array of promises, to wait while the query to the api completes for all months
			promises.push($scope.checkHolidays($scope.getCurrent($scope.selectedDates[i]).month));
		}

		$q.all(promises).then(function() {//when the queries complete, then lets mark the corresponding dates as holidays
			for(var i=0; i<$scope.selectedDates.length; i++) {
				for(var j=0; j<$scope.selectedDates[i].length; j++) {
					for(var x=0; x<$scope.holidays.length; x++) {
						var hol = new Date();
						var dateObj = $scope.holidays[x].date.split('-');
						hol.setDate(dateObj[2]);
						hol.setMonth(dateObj[1]-1);
						hol.setFullYear(dateObj[0]);
						
						if($scope.compareDates($scope.selectedDates[i][j], hol)) {
							$scope.selectedDates[i][j].dayType = ($scope.selectedDates[i][j].dayType != 'invalid')?'holiday':'invalid';
							$scope.selectedDates[i][j].holidayName = $scope.holidays[x].name;
						}
					}
				}
			}
		}, function(reason) {
		});
	};

	$scope.countryCode = '';
	$scope.days = 5;
	$scope.initialDate = new Date();
	$scope.selectedDates = [];
	$scope.holidays = [];
}]);