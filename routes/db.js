var mongo = require('mongodb');
var constants = require('../conf/constants');
 
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
 
//var server = new Server('localhost', 27017, {auto_reconnect: true});
// mongodb://<dbuser>:<dbpassword>@ds029837.mongolab.com:29837/meshtest1
//var server = new Server('kyle:4pp1r10@ds029837.mongolab.com', 29837, {auto_reconnect: true});
var server = new Server(constants.MongoLab.host, constants.MongoLab.port, {auto_reconnect: true});

//db = new Db('surveydb', server);
db = new Db(constants.MongoLab.db, server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to "+constants.MongoLab.db +" database");
        /*
        db.collection('surveys', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'suerveys' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
        */
        
      // now do authticate
    	db.authenticate(constants.MongoLab.user,constants.MongoLab.password, function(err, collection) {
    	if (err) {
    	 console.log('ERROR AUTHENTICATING');
    	 console.log(err);
    	 process.exit(1);
    	}
    	

    	if (!err) {
    	console.log('Authenticated Sucessfully to '+constants.MongoLab.host+' user: '+constants.MongoLab.user);
    	}
    });
    	  

    }	  // if not error top loop
});




exports.listAll = function(req, res) {
	db.collection('surveys', function(err, collection) {
        collection.find().toArray(function(err, items) {
			console.log(items);
            res.send(items);
        });
    });
};
 
exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving survey: ' + id);
    db.collection('surveys', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};

exports.findAnswerById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving answer: ' + id);
    db.collection('surveys_submitted', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};

exports.saveTemplate = function(req, res)
{
	var survey = req.body;
    console.log('Saving survey: ' + JSON.stringify(survey));
    
	db.collection('surveys', function(err, collection) {
		if(!survey._id)
		{
			//INSERT
			collection.insert(survey, {safe:true}, function(err, result) {
				if (err) {
					//res.send({'error':'An error has occurred'});
					throw err;
				} else {
					console.log('Success: ' + JSON.stringify(result[0]));
					survey = result[0];
					survey._id = result[0]._id;

					res.send(survey);
				}
			});
		}
		else
		{
			//UPDATE
			survey._id = new BSON.ObjectID(survey._id);
			collection.update({'_id':survey._id}, survey, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating survey: ' + err);
                //res.send({'error':'An error has occurred'});
				throw err;
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(survey);
            }
        });
		}
    });
}

exports.deleteSurvey = function(req, res)
{
	var id = req.params.id;
    console.log('Deleting survey: ' + id);
    
	db.collection('surveys', function(err, collection) {
		
		id = new BSON.ObjectID(id);
		collection.remove({'_id':id}, {safe:true}, function(err, result) {
			if (err) {
				console.log('Error deleting survey: ' + err);
				//res.send({'error':'An error has occurred'});
				//res.send(createError('E001',,err));
				throw err;
			} else {
				console.log('' + result + ' document(s) deleted');
				res.send('suervey deleted successfully');
			}

		});
	});
}

exports.submitSurvey = function(req, res)
{
	var survey = req.body;
    console.log('Submitting survey: ' + JSON.stringify(survey));
    
	db.collection('surveys_submitted', function(err, collection) {
		
			//INSERT
			collection.insert(survey, {safe:true}, function(err, result) {
				if (err) {
					//res.send({'error':'An error has occurred'});
					throw err;
				} else {
					console.log('Success: ' + JSON.stringify(result[0]));
					survey = result[0];
					survey._id = result[0]._id;
					res.send(survey);
				}
			});		
    });
}
