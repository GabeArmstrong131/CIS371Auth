#!/usr/bin/env node

const crypto = require('crypto');
const mongoose = require('mongoose');
const passport = require('passport');
const Strategy = require('passport-http').BasicStrategy;
const pbkdf2 = require('pbkdf2');
const { Schema } = mongoose;
const express = require('express');
const note = require('./note');

// Create the app instance
const app = express();
const port = 8080;

// Export any data we will need in other files
module.exports = { app, mongoose };

// Tell express to use the json body parser middleware
app.use(express.json());

// Connect to the database
const uri = 'mongodb+srv://mrwoodring:toomanysecrets@cluster0.gzokr.mongodb.net/myFirstDatabase'
try {
	mongoose.connect(uri);
} catch (err){
	console.log(err);
}

const userSchema = new Schema({
	username: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	salt: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		default: Date.now
	}
});

let clearText = "toomanysecrets";
let salt = crypto.randomBytes(32).toString('hex');
let password = pbkdf2.pbkdf2Sync(clearText, salt, 1, 32, 'sha512').toString('hex');

const User = mongoose.model('User', userSchema);
let add = new User({
	username: 'Ferg',
	password: password,
	salt: salt
});

passport.use(new Strategy(
    function(username, password, done) {
        User.findOne({ username: username}, function(err, user) {
            if(err) {
                return done(err);
            }
            if (!user) {
                console.log('No user found');
                return done(null, false);
            }
            if (!validpassword(password, user.salt, user.password)) {
                console.log("Wrong password");
                return done(null, false);
            }
            return done(null, user);
        });
    }
));

const validPassword = function(password, salt, hash) {
    let key = pbkdf2.pbkdf2Sync(password, salt, 1, 32, 'sha512');

    if(key.toString('hex') != hash) {
        return false;
    }
    return true;
}

// Tell express to use the json body parser middleware
app.use(express.json());

app.post('/user', async function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    user.save();
    res.sendstatus(200);
})

const checkAuth = passport.authenticate('basic', { session : false});

// Routes
app.get('/', function(req, res){
	res.send(`Simple note-taking app. Version ${VERSION}.`);
});

app.get('/notes', checkAuth, note.getAll);

app.get('/notes/:searchTerm', checkAuth, note.getOne);

app.post('/notes', checkAuth, note.postOne);

// Start
app.listen(port, () => {
	console.log(`Up and running on port ${port}.`);
});

add.save();