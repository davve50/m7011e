const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const config = require('./config/database');
const passport = require('passport');

mongoose.connect(config.database);
let db = mongoose.connection;

// check connection
db.once('open', function(){
	console.log('Connected to MongoDB')
});

// check for db errors
db.on('error', function(err){
	console.log(err);
});

// init app
const app = express();

// bring in models
let user = require('./models/user');
let sim = require('./models/sim');

// load view 
app.set('views',path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body parser middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));

// express session middleware
app.use(session({
	secret: 'keyboard cat',
	resave: true,
	saveUninitialized: true
}));

// express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
	res.locals.messages = require('express-messages')(req, res);
	next();
});

// express validator middleware
app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
		var namespace = param.split('.')
		, root = namespace.shift()
		, formParam = root;

		while(namespace.lenght){
			formParam += '[' + namespace.shift() + ']';
		}
		return{
			param : formParam,
			msg : msg,
			value: value
		};
	}
}));

// passport config
require('./config/passport')(passport);

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*',function(req, res, next){
	res.locals.user = req.user || null;
	next();
});

// home route
/*
app.get('/', function(req,res){
  res.render('index');
});
*/
// Router files
let routes = require('./routes/routes');
app.use('/', routes);

let sim2 = require('./sim');
sim2.start_simulation();

app.listen(3000, function(){
	console.log('Server started on port 3000...')
});
