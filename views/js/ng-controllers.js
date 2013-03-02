j$ = jQuery.noConflict();

var EVENT = {LOCATIONCHANGE:"LocationChange"}

function MainController($scope, $http,$route,$location)
{
	
	$scope.copyright = Constants.copyRight;
	$scope.appName = Constants.appName;
	
	//intercept page event change
	$scope.isHomePage = $location.$$path === Constants.homeURL;
	$scope.isAboutPage = $location.$$path === Constants.aboutURL;
	$scope.isBuildPage = $location.$$path === Constants.buildURL;
	$scope.isTestPage = $location.$$path === Constants.testURL;
	$scope.isCompilePage = $location.$$path === Constants.compileURL;
	
	$scope.$on(EVENT.LOCATIONCHANGE,function(){
		$scope.isHomePage = $location.$$path === Constants.homeURL;
		$scope.isAboutPage = $location.$$path === Constants.aboutURL;
		$scope.isBuildPage = $location.$$path === Constants.buildURL;
		$scope.isTestPage = $location.$$path === Constants.testURL;
		$scope.isCompilePage = $location.$$path === Constants.compileURL;
	});
	
	console.log('MainController loaded');
}

function BuildSurveyController($scope, $http,$route,$location)
{

	//reload page header event
	$scope.$emit(EVENT.LOCATIONCHANGE,{});
	$scope.value = '';
	console.log('BuildSurveyController loaded');
}

function CompileSingleSurveyController($scope, $http,$route,$location)
{
	$scope.copyright = Constants.copyRight;
	$scope.appName = Constants.appName;

	//reload page header event
	//$scope.$emit(EVENT.LOCATIONCHANGE,{});
	
	console.log('CompileSurveyController loaded');
}

function CompileSurveyController($scope, $http,$route,$location)
{
	
	$scope.surveyTemplates = [];
	$scope.isLoading = true;
	
	//reload page header event
	$scope.$emit(EVENT.LOCATIONCHANGE,{});
	
	//load all templates from server (promise)
	var promise = $http.post(Constants.RestURLs.templatesListURL);
	promise.then(function(response) {
		$scope.surveyTemplates = response.data;
		for(i = 0; i < $scope.surveyTemplates.length; i++)
		{
			var survey = $scope.surveyTemplates[i];

			for(j = 0; j < Constants.surveyTypes.length; j++)
			{
				var type = Constants.surveyTypes[j];
				if(survey.type == 'Profile' && survey.ref.userId == type._id)
				{
					survey.typeName = type.name;
					break;
				}
				else if(survey.type == 'Activity'&& survey.ref.activityId == type._id)
				{
					survey.typeName = type.name;
					break;
				}
				else if(survey.type == 'Wear Test Survey'&& survey.ref.wearTestId == type._id)
				{
					survey.typeName = type.name;
					break;
				}
				else if(survey.type == 'Design Project Scoring'&& survey.ref.designProjectId == type._id)
				{
					survey.typeName = type.name;
					break;
				}
			}
		}
		$scope.isLoading = false;
	  },
	  function(reason) {
		console.log(reason.data);
		$scope.isLoading = false;
		handleError('Something went wrong! Reload page or see log.');
	  });
			  
	console.log('CompileSurveyController loaded');
}

function AboutController($scope, $http,$route,$location)
{
	//reload page header event
	$scope.$emit(EVENT.LOCATIONCHANGE,{});
	
	console.log('AboutController loaded');
}

function HomeController($scope, $http,$route,$location)
{
	//reload page header event
	$scope.$emit(EVENT.LOCATIONCHANGE,{});
	
	console.log('HomeController loaded');
}
/*

MainController.$inject = ['$scope','$http','$route','$location'];

ProfileController.$inject = ['$scope','$http','$route','$location'];
*/