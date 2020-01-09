const mongodb = require('mongodb').MongoClient;
const assert = require('assert');
const moment = require('moment')

// Connection URL
const url = 'mongodb+srv://admin:admin@cluster0-jd2q4.mongodb.net/test?retryWrites=true&w=majority'; 
// Database Name
const dbName = 'ahb_database';
const userCollection = 'users';
const doctorCollection = 'doctors';
const errorMessageKey = "Error";
const sucessMessageKey = "Success";
const reportLimit = 5;
const statusPending = 'PENDING';
const statusOnline = 'Online';



function getReportImage(reportid,res,callback){
	mongodb.connect(url,{useUnifiedTopology: true , useNewUrlParser: true}, function(err, client) {
		if (err) return callback(err);
		//console.log("Connected successfully to db server");
		const db = client.db(dbName);
		const report_collection = db.collection('report_collection');
		report_collection.find({reportId: reportid}, { projection: { mainImagePath: 1, infectedImagePath: 1, stoolImagePath: 1 } }).toArray(function(err, docs) {
			if (err) throw err;
			client.close();
			res.send(docs); // <-- TODO
		});
	});
}

function unassignReports(currtime){
	mongodb.connect(url,{useUnifiedTopology: true , useNewUrlParser: true}, function(err, client) {
		if (err) return callback(err);
		console.log("Connected successfully to db server");
		const db = client.db(dbName);
		const report_collection = db.collection('report_collection');
		report_collection.find({status:statusPending,isAssigned:"true",lock:"false"}, { projection: {"reportId" :1,"assignTime":1,"assignedDoctorId":1} }).toArray(function(err, allAssignReports) {
			if (err) throw err;
			for(x in allAssignReports){
					assignTime = x["assignTime"];
					diffinmin = round(((currtime-assignTime).seconds)/60);
					if(diffinmin > 30){
						doctorId = x["assignedDoctorId"];
						//To Do Update
					}
			}
		});
	});
}

function distributeReports(){
	var totalVaccancy = 0;
	var ratio = 0;
	var totalReports = 0;
	var i=0;
	var doctorDetails = [];
	
	var currtime = moment();
	
	
	mongodb.connect(url,{useUnifiedTopology: true , useNewUrlParser: true}, function(err, client) {
		if (err) return callback(err);
		console.log("Connected successfully to db server");
		const db = client.db(dbName);
		const report_collection = db.collection('report_collection');
		const doctor_collection = db.collection(doctorCollection);
		
		report_collection.find({status: statusPending,isAssigned: "false"}, { projection: {reportId : 1} }).toArray(function(err, docs) {
			if (err) throw err;
			doctor_collection.find({assignedReports: {$lt: reportLimit},onlineStatus: statusOnline}, { projection: {doctorId:1,assignedReports:1} }).toArray(function(err, availableDoctors) {
				if (err) throw err;
				
				for(x in availableDoctors){
					var templist = [x["doctorId"],reportLimit-int(x["assignedReports"])];
					doctorDetails.append(templist);
					totalVaccancy = totalVaccancy+doctorDetails[i][1];
					i = i+1;
				}
				if(totalVaccancy != 0)
					ratio = round(totalReports/totalVaccancy,5);
				
				if(ratio != 0){
					if(totalReports >= totalVaccancy)
						assignOneToEach(availableDoctors,availableReports,totalReports,doctorDetails,currtime);
					else
						assignAccordingToProbablity(availableDoctors,availableReports,totalReports,doctorDetails,ratio,currtime);
				}
				client.close();
			});
		});
	});
}

function assignOneToEach(availableDoctors,availableReports,totalReports,doctorDetails,currtime){
	var i=0
	var j=0
	var doctorCount = availableDoctors.count();
	# iterates over reports and assign it to doctors

	for (report in availableReports){
		var breakwhilelopp = false;
		while(!breakwhilelopp){
		
			if(j>= doctorCount)
				break;
				
			if doctorDetails[j][1] > 0{
				assignReport(report["reportId"],doctorDetails[j][0],currtime);
				breakwhilelopp = true;
				doctorDetails[j][1] = doctorDetails[j][1]-1;
			}
			else
				j=j+1;
		}
		if(j>= doctorCount)
			break;
	}
}

function assignAccordingToProbablity(availableDoctors,availableReports,totalReports,doctorDetails,ratio,currtime){
	var i=0
	var doctorCount = availableDoctors.count()
	
	# claculates how many reports a doctor can get based upon its prob. 
	while(i < doctorCount){
		doctorDetails[i][1] = round(doctorDetails[i][1]*ratio*doctorCount)
		i=i+1
	}
	
	var i=0
	var j=0
	var doctorCount = availableDoctors.count();
	# iterates over reports and assign it to doctors

	for (report in availableReports){
		var breakwhilelopp = false;
		while(!breakwhilelopp){
		
			if(j>= doctorCount)
				break;
				
			if doctorDetails[j][1] > 0{
				assignReport(report["reportId"],doctorDetails[j][0],currtime);
				breakwhilelopp = true;
				doctorDetails[j][1] = doctorDetails[j][1]-1;
			}
			else
				j=j+1;
		}
		if(j>= doctorCount)
			break;
	}
}

function assignReport(reportId,doctorId,currtime){
	mongodb.connect(url,{useUnifiedTopology: true , useNewUrlParser: true}, function(err, client) {
		if (err) return callback(err);
		console.log("Connected successfully to db server");
		const db = client.db(dbName);
		const report_collection = db.collection('report_collection');
		const doctor_collection = db.collection(doctorCollection);
		
		doctor_collection.updateOne({"doctorId":doctorId},{$set: {onlineStatus:""},$inc : {assignedReports: -x}},function(err,result){
			if (err) return callback(err);
			client.close();
			res.send(sucessMessageKey);
		});
		
		//To Do Update
	
	});
}