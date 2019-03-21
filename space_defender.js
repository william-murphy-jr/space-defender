// space_defender.js
// TODO Fix Audio Play Error 
// See https://developers.google.com/web/updates/2017/06/play-request-was-interrupted

var express = require("express");
var app = express();
require('dotenv').config();
var router = express.Router();
var path = __dirname + '/views/';
var bodyParser = require('body-parser');
// var multer = require('multer');
var morgan = require('morgan');

var db = require('./model/db');


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var handlebars = require('express3-handlebars')
		.create({defaultLayout:'main'});
// var body = require('body-parser');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars')

app.set('port', process.env.PORT || 9009);

var fortune = require('./lib/fortune.js');
var game = require('./controllers/gameFuncs');

app.use(function(req, res, next) {
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});

app.use(express.static(__dirname + '/public'));

app.use(game.getPlayers);

// Routes:
app.get('/', game.home);
app.post('/highscore', game.highscore);
app.get('/highscoreConfirmation', game.highscoreConfirmation);


// custom 404 page
app.use(function(req, res, next) {
	res.status(404);
	res.render('404');
});

// custom 500 page
app.use(function(err, req, res, next) {
	console.log(err.stack);
	res.status(500);
	res.render('500');
});


// Start the server
app.listen(app.get('port'), function(){
  console.log("Live at Port " + app.get('port') 
  	+ " \nPress Control-C to terminate node server");
});




