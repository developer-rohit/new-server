var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(express.static('public'));
app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.get("/",function(req,res){
	res.render('home');
});

app.get('/aboutus',function(req,res){
	res.render('aboutus');
});

app.get('/animalhusbandry',function(req,res){
	res.render('animalhusbandry');
});


app.get('/animalhusbandary2',function(req,res){
	res.render('animalhusbandry2');
});

app.get('/grading',function(req,res){
	res.render('grading');
});
app.get('/aicity',function(req,res){
	res.render('aicity');
});

app.get('/demoreq',function(req,res){
	res.render('demoreq');
});

app.get('/contactUs',function(req,res){
	res.render('contact');
});

app.listen(8080,function(){
	console.log("Listening For genflow at 8080");
});
