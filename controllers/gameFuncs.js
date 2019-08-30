var mongoose = require("mongoose");
var Player = mongoose.model( 'Player' );
var currentScore = 0;
var allPlayers = [];

// Renders home template and places current 
// high score in it.
exports.home = function(req, res) {

	var p;

	Player.find({}, 'name score', { limit: 100, sort: {score: -1} }, 
		function(error, players) {
			allPlayers = players.slice(0, 10);
			if (!error) {
				console.log('players: ', players);
			}
		res.render('home', {
			players: allPlayers
		});
		}
	);

	
	console.log('HOME function');
}

exports.highscore = function(req, res){
	console.log('/highscore route hit!!!');
	// res.locals 
		
	currentScore = req.body.score;

	Player.create({
		name: req.body.name,
		score: req.body.score
	}, function(error, player) {
		if (error) {
			console.log('error: ', error);
			res.redirect('/');
		} else {
			console.log('player name & score saved');
		}
	}

	);

	res.redirect('/highscoreConfirmation');
}

exports.highscoreConfirmation = function(req, res){
	console.log('*** /highscoreConfirmation *** route hit!!!');

	Player.find({}, 'name score', { limit: 100, sort: {score: -1} }, 
		function(error, players) {
			if (!error) {
				console.log('players: ', players);
			}
		res.render('highscoreConfirmation', {
			score: currentScore,
			players: players.slice(0, 10)
		});
		}
	);	
}

exports.getPlayers = function(req, res, next) {
	Player.find({},
		function(error, players) {
			if (!error) { console.log('players: ', players); }
		}
	);

	next();
}





