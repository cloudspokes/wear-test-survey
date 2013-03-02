var express = require('express');
var app = express();
var constants = require('./conf/constants');
var db = require('./routes/db');
var port    = parseInt(app.settings.env.PORT, 10) || constants.Defaults.port;

 
app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
	app.set('view engine', 'ejs');
	app.use("/css", express.static(__dirname + '/views/css'));
	app.use("/js", express.static(__dirname + '/views/js'));
	app.use("/img", express.static(__dirname + '/views/img'));
	app.use("/partials", express.static(__dirname + '/views/partials'));
});

app.get('/', function(req, res) {
  res.render('index', { 
						title: constants.Defaults.defaultPageTitle,
						appName : constants.Defaults.appName
					  })
});
//app.get('/build', db.create);
app.get('/api/surveys/:id', db.findById);
app.get('/api/answers/:id', db.findAnswerById);
app.post('/listTemplates', db.listAll);
app.post('/saveTemplate', db.saveTemplate);
app.post('/surveys/:id', db.findById);
app.post('/surveys/delete/:id', db.deleteSurvey);
app.post('/submitSurvey', db.submitSurvey);
app.get('/survey/:id/:userid',function(req, res) {
		console.log('Request survey compilation '+req.params.id+' from user '+req.params.userid+'...');
		res.render('survey', { 
				title: constants.Defaults.defaultPageTitle,
				surveyId: req.params.id,
				userId: req.params.userid
			  })
});
 
app.listen(port);
console.log('Listening on port '+port+'...');