
// Using a Mongoose Database

var mongoose = require("mongoose");

var dbURI = 'mongodb://localhost/defender_database';

mongoose.connect(dbURI, {
    useNewUrlParser: true
});

mongoose.connection.on('connected', function () {
    console.log('Mongoose connected to ' + dbURI);
});
mongoose.connection.on('error',function (err) {
    console.log('Mongoose connection error: ' + err);
});
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose disconnected');
});
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose disconnected through app termination');
    process.exit(0);
  });
});

/* ********************************************
     PLAYER SCHEMA
  ******************************************** */
   var playerSchema = new mongoose.Schema({
        name: {type: String},
        score: {type: Number, required: true},
        // email: {type: String, unique:true, required: true},
        // createdOn: { type: Date, default: Date.now },
        gameTime: { type: Date, default: Date.now },
        // modifiedOn: Date
});


//    // Build the Player model
mongoose.model( 'Player', playerSchema );







