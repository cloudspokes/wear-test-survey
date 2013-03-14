j$ = jQuery.noConflict();

var Constants = 
{
	homeURL : "/home",
	aboutURL : "/about",
	buildURL : "/build",
	compileURL : "/compile",
	appName : "Survey Builder",
	copyRight : "Enreeco 2013",
	surveyTypes : [{_id: 1, group:'Profile', name: 'User Profile'},
					{_id:2, group: 'Activity', name: 'Golf'},
					{_id:3, group: 'Activity', name: 'Basketball'},
					{_id:4, group: 'Activity', name: 'Running'},
					{_id:5, group: 'Wear Test Survey', name: 'Test Survey 1'},
					{_id:6, group: 'Design Project Scoring', name: 'Design Project Scoring 1'}],
	RestURLs : {
					templatesListURL : "/listTemplates",
					templatesSaveURL : "/saveTemplate",
					templatesLoadURL : "/surveys",
					templatesDeleteURL : "/surveys/delete",
					surveyCompileURL : "/submitSurvey"
				}
};

var module = angular.module('SurveyBuilder',[]).
	config(['$routeProvider', function($routeProvider) {
	  $routeProvider.when(Constants.homeURL, {templateUrl: '/partials/home.html', controller: HomeController});
	  $routeProvider.when(Constants.aboutURL, {templateUrl: '/partials/about.html', controller: AboutController});
	  $routeProvider.when(Constants.buildURL, {templateUrl: '/partials/build.html', controller: BuildSurveyController});
	  $routeProvider.when(Constants.compileURL, {templateUrl: '/partials/compile.html', controller: CompileSurveyController});
	  $routeProvider.otherwise({redirectTo: '/home'});
	}]);

/************************************************************************************************
 ************************************************************************************************
 ************************************************************************************************
											SURVEY BUILDER DIRECTIVE
 ************************************************************************************************
 ************************************************************************************************
 ************************************************************************************************/
module.directive('surveyBuilder', function($http){
  return {
    templateUrl: '/partials/builder_directive.html',
    restrict: 'EAC',
    link: function (scope,element,attr) {
    	
		scope.init = function()
		{
			//types of survey
			scope.surveyTypes = Constants.surveyTypes;
			//selected type
			scope.surveyType = {};
			//selected template
			scope.surveyTemplateId = '';
			//available templates (loaded with promise)
			scope.surveyTemplates = [];
			//current survey (selected/new) after loadig
			scope.currentSurvey = {};
			//show the editing (hide the type selection)
			scope.showSurvey = false;
			//show the loading image/text
			scope.isLoading = false;
			//index to know where to insert the position (-1 means last)
			scope.insertQuestionAtIndex = -1;
			//errors on saving
			scope.questionErrors = [];
			scope.surveyErrors = [];
		
			//load all templates from server (promise)
			var promise = $http.post(Constants.RestURLs.templatesListURL);
			promise.then(function(response) {
				scope.surveyTemplates = response.data;
			  },
			  function(reason) {
				console.log(reason.data);
				handleError('Something went wrong! Retry or see log.');
			  });
		}
		
		scope.init();
		
		//used before the "new question modal" is called
		scope.setInsertQuestionAtIndex = function(value)
		{
			scope.insertQuestionAtIndex = value;
		}
		
		//load a selected template
		scope.loadTemplate = function()
		{
			console.log('Load '+scope.surveyTemplateId);
			scope.isLoading = true;
			
			//load template from server (promise)
			var promise = $http.post(Constants.RestURLs.templatesLoadURL+'/'+scope.surveyTemplateId);
			promise.then(function(response) {
					scope.currentSurvey = response.data;
					scope.isLoading = false;
					scope.showSurvey = true;
				  },
				  function(reason) {
					console.log(reason.data);
					scope.isLoading = false;
					scope.currentSurvey = {};
					handleError('Something went wrong! Retry or see log.');
			  	});
			console.log(scope.currentSurvey);
		};
		
		//load a new template from scratch
		scope.newTemplate = function()
		{
			scope.currentSurvey = {name:'New '+scope.surveyType.name+' survey', 
									type:scope.surveyType.group,
									description: '',
									ref: {},
									questions:[]
									};
			if(scope.surveyType.group == 'Profile')
				scope.currentSurvey.ref.userId = scope.surveyType._id;
			else if(scope.surveyType.group == 'Activity')
				scope.currentSurvey.ref.activityId = scope.surveyType._id;
			else if(scope.surveyType.group == 'Wear Test Survey')
				scope.currentSurvey.ref.wearTestId = scope.surveyType._id;
			else if(scope.surveyType.group == 'Design Project Scoring')
				scope.currentSurvey.ref.designProjectId = scope.surveyType._id;
			
			scope.showSurvey = true;
		};
		
		//on type selection, if no type selected, disabled the "load template" section
		scope.selectedType = function()
		{
			if(!scope.surveyType) scope.surveyTemplateId = '';
		};
		
		//adds a new section
		scope.addNewSection = function(index)
		{
			scope.setInsertQuestionAtIndex(index);
			scope.selectQuestionType('Section');
		}
		
		//select a question type
		scope.selectQuestionType = function(t)
		{
			if(!t) return;
			var q = {type:t,options:{}};
			
			//sets the position of the new question/section
			if(scope.insertQuestionAtIndex==null || scope.insertQuestionAtIndex === undefined 
				|| scope.insertQuestionAtIndex < 0)
				scope.currentSurvey.questions.push(q);
			else
				scope.currentSurvey.questions.splice(scope.insertQuestionAtIndex,0,q);
			
			q.options.isRequired = false;
			/*
			if('Range' == t)
			{
				q.options.fromLabel = 'I play football from';
				q.options.toLabel = 'to';
				q.options.endLabel = 'days a week.';				
			}
			else */if('Rating' == t)
			{
				q.options.defaultValue = 5;
				q.options.minValue = 0;
				q.options.maxValue = 10;
				q.options.maxValueLabel = 'Max';
				q.options.minValueLabel = 'Min';				
			}
			else if(/*'Horizontal List' == t ||*/ 'Single Selection' == t || 'Multiple Selection' == t)
			{
				q.options.values = [];	
				scope.newKeyValue(q,0);
				//q.options.displayIndex = true;			
				/*
				q.options._tempValue = 'value1,value2,value3'
				scope.newTextValue(q);
				*/
			}
			else if('Free form text' == t)
			{
				q.options.isSingleLine = true;
				q.options.isNumeric = false;
			}
			q.helpText = '';
			//generate a unique id for each question
			q.unique_identifier = t.replace(/\s+/g,'')+'_'+guid();
		}
		
		//onChange values list
		/*
		scope.newTextValue = function(question)
		{
			question.options.values = [];
			if(!(question.options._tempValue === null || question.options._tempValue.trim() === ''))
			{
				var split = question.options._tempValue.split(',');
				for(var i = 0; i < split.length; i ++)
				{
					var v = split[i].trim();
					if(v.length>0) question.options.values.push(v);
				}
			}
			//scope.$apply();
		}
		*/
		
		//adds a new key/value pair to the select list (or mutiple) @ index
		scope.newKeyValue = function(question,index)
		{
			question.options.values.splice(index,0,{key:'',value:'',_editing:true});
		};
		
		//removes a key/value pair @ index
		scope.removeKeyValue = function(question,index)
		{
			question.options.values.splice(index,1);
		};
		
		//move question key/value pair to index position
		scope.moveKeyValue = function(question, from, to)
		{
			question.options.values.move(from, to);
		};
		
		//deletes a question
		scope.removeQuestion = function(question)
		{
			
			for(var qi = 0; qi < scope.currentSurvey.questions.length; qi++)
			{
				if(question === scope.currentSurvey.questions[qi])
				{
					scope.currentSurvey.questions.splice(qi,1);
					return;
				}
			}
		}
		
		//move a question by +/-offset
		scope.moveQuestion = function(index, offset)
		{
			if(index+offset < 0 || index+offset >= scope.currentSurvey.questions.length) return;
			var movingQuestion = scope.currentSurvey.questions[index];
			var otherQuestion = scope.currentSurvey.questions[index+offset];
			scope.currentSurvey.questions.move(index,index+offset);
		}
		
		//saves template

		scope.saveTemplate = function()
		{
			
			scope.surveyErrors = [];
			scope.questionErrors = [];
			if(scope.currentSurvey.name == null || scope.currentSurvey.name.length==0)
				scope.surveyErrors.push('Set a valid survey name');
				
			//check for all questions
			var foundError = scope.surveyErrors.length>0;
			for(var iq = 0; iq < scope.currentSurvey.questions.length; iq++)
			{
				//check values
				var question = scope.currentSurvey.questions[iq];
				var qe = [];
				//if(question.keywords == null || question.keywords == undefined || question.keywords.length==0)qe.push('Set the keywords');
				//if(question.unique_identifier == null || question.unique_identifier == undefined || question.unique_identifier.length==0)qe.push('Set a valid unique name');
				if(question.question == null || question.question == undefined || question.question.length==0)qe.push('Set a valid question');
				if(question.type == 'Rating')
				{				
					if(question.options.minValue === null || question.options.minValue === undefined || question.options.minValue.length==0)
						qe.push('Set a valid "min" value');
					else if(question.options.minValue.toString().match(/^-?[0-9]+$/)==null)
						qe.push('"min" value must be numeric ');
					
					if(question.options.maxValue === null || question.options.maxValue === undefined || question.options.maxValue.length==0)
						qe.push('Set a valid "max" value');
					else if(question.options.maxValue.toString().match(/^-?[0-9]+$/)==null)
						qe.push('"max" value must be numeric');
						
					if(question.options.defaultValue === null || question.options.defaultValue === undefined || question.options.defaultValue.length==0)
						qe.push('Set a valid "default" value');
					else if(question.options.defaultValue.toString().match(/^-?[0-9]+$/)==null)
						qe.push('"default" value must be numeric');
					
					try
					{
						var min = parseInt(question.options.minValue);
						var max = parseInt(question.options.maxValue);
						var def = parseInt(question.options.defaultValue);
						if( min>=max || def<min || def > max)
							qe.push('"max" value must be greater than "min" value and "default" value must be between.');
					}catch(e){}
						
				}
				
				if(/*question.type == 'Horizontal List' ||*/ question.type == 'Single Selection' || question.type == 'Multiple Selection' )
				{
					if(!question.options.values || question.options.values.length==0)
						qe.push('Must set at least one value.');
					else
					{
						for(var iv =0; iv < question.options.values.length; iv++)
						{
							delete question.options.values[iv]._editing;	//removes the helper "_editing" variable, that should not be stored in the db
						}
					}
				}
				
				foundError |= qe.length>0;
				scope.questionErrors[iq] = qe;
			}
			
			if(foundError) 
			{
				console.log(scope.surveyErrors);
				console.log(scope.questionErrors);
				handleError('Invalid data on survey. Close to see details.');
				return;
			}
			
			scope.isLoading = true;
			
			//save template from server (promise)
			var promise = $http.post(Constants.RestURLs.templatesSaveURL, scope.currentSurvey);
			promise.then(function(response) {
					scope.currentSurvey = response.data;
					handleSuccess('Survey successfully saved.');
					scope.isLoading = false;
				  },
				  function(reason) {
					console.log(reason.data);
					scope.isLoading = false;
					handleError('Something went wrong! Retry or see log.');
			  	});
			console.log(scope.currentSurvey);
		}
		
		//saves template
		scope.deleteTemplate = function()
		{
			scope.isLoading = true;
			
			//save template from server (promise)
			var promise = $http.post(Constants.RestURLs.templatesDeleteURL+'/'+scope.currentSurvey._id);
			promise.then(function(response) {
					scope.currentSurvey = response.data;
					handleSuccess('Survey successfully deleted.');
					scope.isLoading = false;
					scope.showSurvey = false;
					scope.init();
				  },
				  function(reason) {
					console.log(reason.data);
					scope.isLoading = false;
					handleError('Something went wrong! Retry or see log.');
			  	});
			console.log(scope.currentSurvey);
		}
		
    }
  } 
});

/************************************************************************************************
 ************************************************************************************************
 ************************************************************************************************
											SURVEY VIEWER DIRECTIVE
 ************************************************************************************************
 ************************************************************************************************
 ************************************************************************************************/
module.directive('surveyViewer', function($http){
  return {
    templateUrl: '/partials/viewer_directive.html',
    restrict: 'EAC',
    link: function (scope,element,attr) {
    	console.log(attr);
		scope.init = function()
		{
			//types of survey
			scope.surveyTypes = Constants.surveyTypes;
			//selected type
			scope.surveyType = {};
			//selected template
			scope.surveyTemplateId = '';
			//current survey (selected/new) after loadig
			scope.currentSurvey = {};
			//show the loading image/text
			scope.isLoading = false;
			//errors on saving
			scope.questionErrors = [];
			//submitted survey
			scope.submittedSurvey = null;

		
			//load template from server (promise)
			var promise = $http.post(Constants.RestURLs.templatesLoadURL+'/'+attr.survey);
			promise.then(function(response) {
					console.log(response.data);
					scope.currentSurvey = response.data;
					scope.isLoading = false;
					scope.showSurvey = true;
					initSurvey(scope.currentSurvey);
				  },
				  function(reason) {
					console.log(reason.data);
					scope.isLoading = false;
					scope.currentSurvey = {};
					handleError('Something went wrong! Reload or see log.');
			  	});
		}
		
		scope.init();
		
		//helper function to init survey after load
		function initSurvey(survey)
		{
			var questionCounter = 0;
			var sectionCounter = 0;
			for(i = 0; i < survey.questions.length; i++)
			{
				var question = survey.questions[i];
				question.answer = {};
				if(question.type !== 'Section')
				{
					question.answer.id = ++questionCounter;
					if(question.type === 'Multiple Selection')
					{
						question.answer.values = [];
					}
					else if(question.type === 'Rating')
					{
						question.answer.value = question.options.defaultValue;
					}
					else if(question.type !== 'Range')
					{
						question.answer.value = '';
					}
					/*
					else
					{
						question.answer.valueMin = '';
						question.answer.valueMax = '';
					}*/
				}
			}
		}

		//saves template

		scope.submitSurvey = function()
		{
			
			scope.questionErrors = [];

			//check for all questions
			var foundError = false;
			for(var iq = 0; iq < scope.currentSurvey.questions.length; iq++)
			{
				//check values
				var question = scope.currentSurvey.questions[iq];
				var qe = [];
				
					if(question.type == 'Multiple Selection')
					{
						if(question.options.isRequired && (!question.answer.values || question.answer.values.length==0))
							qe.push('Value required.');
					}
					else /*if(question.type != 'Range')*/
					{
						if((question.answer.value == undefined || question.answer.value == null ||
							question.answer.value.toString().trim().length == 0))
							{
								if(question.options.isRequired) qe.push('Value required.');
							}
						else if((question.options.isNumeric || question.type === 'Numeric') && question.answer.value.toString().match(/^-?[0-9]+$/)==null)
							qe.push('Value must be numeric ');
					}
					/*
					else
					{
						if(question.answer.valueMin == undefined || question.answer.valueMin == null ||
							question.answer.valueMin.toString().trim().length == 0 || question.answer.valueMax == undefined || question.answer.valueMax == null ||
							question.answer.valueMax.toString().trim().length == 0)
							{
								if(question.options.isRequired)qe.push('Value required.');
							}
						else if(question.answer.valueMin.toString().match(/^-?[0-9]+$/)==null 
								|| question.answer.valueMax.toString().match(/^-?[0-9]+$/)==null)
							qe.push('Values must be numeric ');
					}*/
					
				
				foundError |= qe.length>0;
				scope.questionErrors[iq] = qe;
			}
			
			if(foundError) 
			{
				console.log(scope.questionErrors);
				handleError('Invalid data on survey. Close to see details.');
				return;
			}
			
			scope.isLoading = true;
			
			var survey = {
				surveyId: attr.survey,
				userId: attr.user,
				answers:[]
			};
			for(var iq = 0; iq < scope.currentSurvey.questions.length; iq++)
			{
				survey.answers.push(scope.currentSurvey.questions[iq].answer);
			}
			
			//save template from server (promise)
			var promise = $http.post(Constants.RestURLs.surveyCompileURL, survey);
			promise.then(function(response) {
					scope.submittedSurvey = response.data;
					handleSuccess('Survey successfully saved.');
					scope.isLoading = false;
				  },
				  function(reason) {
					console.log(reason.data);
					scope.isLoading = false;
					handleError('Something went wrong! Retry or see log.');
			  	});
			console.log(scope.currentSurvey);
			
		}
		
		
    }
  } 
});


/************************************************************************************************
 ************************************************************************************************
 ************************************************************************************************
											SLIDER DIRECTIVE
 ************************************************************************************************
 ************************************************************************************************
 ************************************************************************************************/
//Directive for slider
module.directive('slider', function() {
    return {
        restrict: 'E',          // must be an element
        transclude: false,      // don't preserve content
        scope: {
            value: '=',
            min:'=',
            max:'='
        },
        controller: function($scope,$element) {
            $scope.$watch('value', function(newVal, oldVal) {
            	if(newVal === oldVal) return;
               // if($scope.value === null || $scope.value === '') $scope.value = 0;
                j$($element).slider({value :parseInt($scope.value)});
                
            });
            $scope.$watch('min', function(newVal, oldVal) {
            	if(newVal === oldVal) return;
                //if($scope.min === null || $scope.min === '') $scope.min = 0;
                j$($element).slider({min: parseInt($scope.min)});
                
            });
            $scope.$watch('max', function(newVal, oldVal) {
            	if(newVal === oldVal) return;
                //if($scope.max === null || $scope.max === '') $scope.max = 0;
                j$($element).slider({max: parseInt($scope.max)});
            });
        },
        link: function postLink($scope, $element, attr) {
            $element.slider({
                range: false,
                min: $scope.min,
                max: $scope.max,
                value: $scope.value,
                slide: function(event, ui) {
                    $scope.value = ui.value;
                    $scope.$apply();
                },
                change: function(event, ui) {
                	if (event.originalEvent) {
            			//manual change
            			$scope.value = ui.value;
	                    $scope.$apply();
        			}
                    
                }
            });
        },
        template:
            '<div></div>',
        replace: true
    }
});



/*
 * Get the current scope
 */
function getScope()
{
	return angular.element(j$("#__theBody")).scope();
}

function handleError(error)
{
	console.log(error);
	//alert(error);
	j$('#errorSavingSurveyModal #message').html(error);
	j$('#errorSavingSurveyModal').modal('show');
}

function handleSuccess(message)
{

	j$('#infoSurveyModal #message').html(message);
	j$('#infoSurveyModal').modal('show');
}

Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

/*
	Generate a unique GUID
*/
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}
