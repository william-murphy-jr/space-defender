var mongoose = require("mongoose");
var Player = mongoose.model( 'Player' );

// Renders home template and places current 
// high score in it.
exports.home = function(req, res) {

	var allPlayers = Player.find({}, 'score');
	res.render('home',{
		score: 34344
	});
	console.log('HOME function');}

exports.highscore = function(req, res){
	console.log('req.body: ', req.body);
	console.log('/highscore route hit!!!');
	res.redirect('/highscoreConfirmation');
	// res.render('highscoreConfirmation', {});
}

exports.highscoreConfirmation = function(req, res){
	console.log('*** /highscoreConfirmation *** route hit!!!');
	res.render('highscoreConfirmation', {
		score: 99999
	});
}