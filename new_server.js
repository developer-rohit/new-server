var fs = require("fs");
var dateFormat = require('dateformat');
var express = require("express"),
	app = express(),
	http = require("http").Server(app).listen(2019),
	upload = require("express-fileupload");
app.use(upload());
console.log("Server Started!");
var query_string = require('querystring');

const mongodb = require('mongodb').MongoClient;
const assert = require('assert');

// constants global
var supportedfiletypes = ['jpg','jpeg','png'];
var activeUsers = [];
// Connection URL
const url = 'mongodb+srv://admin:admin@cluster0-jd2q4.mongodb.net/test?retryWrites=true&w=majority'; 
// Database Name
const dbName = 'ahb_database';
const userCollection = 'users';
 



//ROUTERS
app.get("/login", function(req,res){
	res.sendFile(__dirname+"/login.html");
});

app.post("/auth", function(req,res){
	console.log(req.headers["content-type"]);
	var req_body = '';
	req.on('data', function (data) {
		req_body += data;

		// If the POST data is too much then destroy the connection to avoid attack.
		// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
		if (req_body.length > 1e6)
			req.connection.destroy();
	});

	req.on('end', function () {

	   // Parse post data from request body, return a JSON string contains all post data.
		var post_data = query_string.parse(req_body);
		
		// Get user name from post data.
		var userid = post_data["userid"];

		// Get password from post data.
		var pass = post_data["pass"];
		authenticateUser(userid,pass,res);
	});
});

// handle logout
app.get("/logout/:userid", function(req,res){
	var userid = req.params.userid;
	console.log(userid);
	if(activeUsers.indexOf(userid)< 0)
		res.send("Success");
	else{
		activeUsers.splice(activeUsers.indexOf(userid),1);
		res.send("Success");
	}
});

//get all repors of a farm
app.get("/getAllReports/:userid",function(req,res){
	
	const userid = req.params.userid;
	if(validateAccess(req)){
		getAllReportsOfUser(userid,res,function(err){
			if(err){
				console.log("1111")
				res.send("Error");
			}
			
		});
	}
	else{
		res.send("Logout");
	}
});


function getAllReportsOfUser(userid,res,callback){
	mongodb.connect(url,{useUnifiedTopology: true , useNewUrlParser: true}, function(err, client) {
		if (err) return callback(err);
		console.log("Connected successfully to db server");
		const db = client.db(dbName);
		const report_collection = db.collection('report_collection');
		report_collection.find({userid: userid}).toArray(function(err, docs) {
			if (err) throw err;
			client.close();
			res.send(docs); // <-- TODO
		});
	});
}

app.post("/uploadreport/:userid", function(req,res){
	console.log(req.headers["content-type"]);
	var userid = req.params.userid;
	var req_body = '';
	req.on('data', function (data) {
		req_body += data;

		// If the POST data is too much then destroy the connection to avoid attack.
		// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
		if (req_body.length > 1e8){
			req.connection.destroy();
			res.send("LargePostData");
		}
	});

	req.on('end', function () {

	   // Parse post data from request body, return a JSON string contains all post data.
		var post_data = query_string.parse(req_body);
		
		uploadReport(userid,post_data,function(err, client) {
			assert.equal(err, null);
			res.send("success");
		});
	});
});






function authenticateUser(userid,pass,res){
	console.log(userid+" and "+pass);
	
	// Use connect method to connect to the server
	mongodb.connect(url,{useUnifiedTopology: true , useNewUrlParser: true}, function(err, client) {
		assert.equal(null, err);
		//console.log("Connected successfully to db server");
		const db = client.db(dbName);
		const collection = db.collection(userCollection);
		collection.find({userid: userid, password: pass}).toArray(function(err, docs) {
			assert.equal(err, null);
			client.close();
			if(docs.length > 0){
				activeUsers.push(userid);
				res.send(docs[0]);
				//res.sendFile(__dirname+"/index.html");
			}
			else{
				res.send("Error");
			}
		});
	});
}

function uploadReport(userid,post_data,callback){
	var fullImage = post_data["fullImage"];
	var infectedImage = post_data["infectedImage"];
	var stoolImage = post_data["stoolImage"];
	var animalType = post_data["animalType"];
	var animalAge = post_data["animalAge"];
	var otherSymptoms = post_data["otherSymptoms"];
	var reportName = post_data["reportName"];
	var reportDate=dateFormat(new Date(), "mm-dd-yyyy");
	mongodb.connect(url,{useUnifiedTopology: true , useNewUrlParser: true}, function(err, client) {
		if(err) return callback(err);
		console.log("Connected successfully to db server");
		const db = client.db(dbName);
		const reports_collection = db.collection('report_collection');
		generateReportSequence(userid,db,function(err,reprotid){
			var myobj = {};
			if(err){
				return callback(err);
				client.close();
			}
			else{
				myobj = {reportId : reportid,reportName : reportName,userid : userid,animalType : animalType,animalAge : animalAge, diseaseName : "",medicineRecommended : "",
				mainImagePath : fullImage,infectedImagePath : infectedImage, stoolImagePath : stoolImage,otherSymptoms : otherSymptoms,reportDate : reportDate,status : "PENDING"}
				reports_collection.insertOne(myobj,function(err){
					if(err) return callback(err);
					client.close();
				});
				client.close();
				return callback(err,reportid);
			}
		});
	});
}


function validateAccess(req){
	const userid = req.params.userid;
	if(activeUsers.indexOf(userid)<0){
		return false;
	}
	else
		return true;
}

function generateReportSequence(userid,db,callback){
	var seq_collection = db.collection('gen_sequence_report');
	var reprotid = "-1";
	seq_collection.find({user_id: userid}).toArray(function(err, docs) {
		if (err) return callback(err);
		if(docs.length <= 0){
			reportid = userid+"1";
			myobj = {user_id : userid , seq :  1};
			seq_collection.insertOne(myobj,function(err) {
				if(err) return callback(err);
				console.log("New sequence inserted.");
				return callback(err,reportid);
			});
		}
		else{
			var seq = parseInt(docs[0].seq);
			seq = seq+1;
			var seqs = seq.toString();
			reportid = userid+seqs;
			var myquery = { user_id: userid };
			var newvalues = { $set: {seq: seq} };
			seq_collection.updateOne(myquery, newvalues, function(err, result) {
				if (err) return callback(err);
				console.log("Sequence updated.");
				return callback(err,reportid);
			});
		}
	});
}