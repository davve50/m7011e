const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs')
const passport = require('passport');

// bring in user models
let User = require('../models/user');
let Sim = require('../models/sim');
let Client = require('../models/client');

router.get('/', function(req,res){
	res.render('index');
});

// register form
router.get('/register', function(req,res){
	res.render('register')
});

// register process
router.post('/register', function(req,res){
	const name = req.body.name;
	const email = req.body.email;
	const username = req.body.username;
	const password = req.body.password;
	const password2 = req.body.password2;
	const role = req.body.role;

	req.checkBody('name','Name is required').notEmpty();
	req.checkBody('email','Email is required').notEmpty();
	req.checkBody('email','Email is not valid').isEmail();
	req.checkBody('username','Username is required').notEmpty();
	req.checkBody('password','Password is required').notEmpty();
	req.checkBody('password2','Passwords do not match').equals(req.body.password);
	req.checkBody('role','A role is required').notEmpty();

	let errors = req.validationErrors();

	if(errors) {
		res.render('register', {
			errors:errors
		});
	} else {
		let newClient;
		if(role == 1){
			newClient = new Client({
					type:role,
					buffer: 0,
					consumption: 0,
					production: 0,
					ratio_buffer:0.5,
					rate:0.5,
					status:0,
					active: new Date()
			});
		}else {
			newClient = new Client({
					type:role,
					buffer: 0,
					consumption: 0,
					production: 0,
					ratio_buffer:0.5,
					active: new Date()
			});
		}


		newClient.save(function(err,c) {
			let newUser = new User({
						name:name,
						email:email,
						username:username,
						password:password,
						role:role,
						hid:c.id
					});

			bcrypt.genSalt(10, function(err, salt){
				bcrypt.hash(newUser.password, salt, function(err, hash){
					if(err)
						console.log(err);
					newUser.password = hash;
					newUser.save(function(err){
						if(err){
							console.log(err);
							return;
						} else {
							req.flash('success', 'You are now registered and can log in');
							res.redirect('/login');
						}
					});
				});
			});
		});
	}
});

// login form
router.get('/login', function(req, res){
	res.render('login');
});

// login process
router.post('/login', function(req, res, next){
	passport.authenticate('local', {
		successRedirect:'/manage',
		failureRedirect:'/login',
		failureFlash: true
	})(req, res, next);
});

// logout
router.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'You are logged out');
	res.redirect('/login');
});

router.get('/manage', function(req,res){
	if(req.user == undefined){
		res.redirect('/');
		return;
	}
	update_activity(req);

	Sim.find({}, function(err, sim){
		if(err) return handleError(err);
		User.find({_id:req.user._id}, function(err, user){
			Client.find({_id:req.user.hid}, function(err, client){
				if(err) return;
				if(req.user.role == 1) {
					Client.find({}, function(err, clients){
						if(err){
							console.log(err);
						}else{
							client[0].num_pro = 0;
							client[0].num_man = 0;
							client[0].blackouts = 0;
							for(var i in clients){
								if(clients[i].type) client[0].num_man++;
								else client[0].num_pro++;
								if(clients[i].blackout){
									client[0].blackouts++;
								}
							}
							client[0].delay = client[0].time - new Date();
							res.render('manage_manager', {
								username:req.user.username, simulator:sim[0], client:client[0], user:user[0]
							});
						}
					});

				}else{
					client[0].ban_time = client[0].time - new Date();
					res.render('manage_prosumer', {
						username:req.user.username, simulator:sim[0], client:client[0], user:user[0]
					});
				}
			});
		});
	});
});

router.get('/get_status', function(req, res){
	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	update_activity(req);

	Sim.find({}, function(err, sims){
		Client.find({}, function(err, clients){
			if(err){
				console.log(err);
			}else{
				const merged = {};
				merged["num_man"] = 0;
				merged["num_pro"] = 0;
				merged["total_consumption"] = sims[0].total_consumption;
				merged["total_production"] = sims[0].total_production;
				merged["price"] = sims[0].price;
				merged["wind"] = sims[0].wind;
				merged["num_con"] = sims[0].consumers;
				merged["blackouts"] = 0;
				for(var i in clients){
					if(req.user.hid == clients[i]._id) {
						merged["buffer"] = clients[i].buffer;
						merged["consumption"] = clients[i].consumption;
						merged["production"] = clients[i].production;
						merged["ratio_buffer"] = clients[i].ratio_buffer;
						merged["ban_time"] = parseInt(((clients[i].time - new Date())+"").slice(0,-3));
						merged["rate"] = clients[i].rate;
						merged["status"] = clients[i].status;
					}
					if(clients[i].type) merged["num_man"]++;
					else merged["num_pro"]++;

					if(clients[i].blackout){
						merged["blackouts"]++;
					}

				}
				res.json(merged);
			}
		});
	});
});

router.get('/get_all_status', function(req, res){
	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	update_activity(req);

	Client.find({type: 0}, function(err, clients){
			if(err){
				console.log(err);
			}else{
				const merged = [];
				for(var i in clients){
					merged.push({});
					merged[i]["production"] = clients[i].production;
					merged[i]["ban_time"] = parseInt(((clients[i].time - new Date())+"").slice(0,-3));
					merged[i]["consumption"] = clients[i].consumption;
					merged[i]["buffer"] = clients[i].buffer;
					merged[i]["ratio_buffer"] = clients[i].ratio_buffer;
					merged[i]["active"] = parseInt(clients[i].active - new Date()) > -15000?1:0;
					merged[i]["blackout"] = clients[i].blackout;
				}
				res.json(merged);
			}
	});
});


router.get('/edit', function(req, res){
	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	if(req.user.role == undefined){
		res.redirect('/');
		return;
	}
	update_activity(req);

	if(req.user.role == 1){
		res.render('edit_manager');
	}
	if(req.user.role == 0){
		Client.find({_id:req.user.hid}, function(err, client){
			if(err){
				console.log(err);
			}else{
				res.render('edit_prosumer',{rb:client[0].ratio_buffer});
			}
		})
	}
});

//multer object creation
const multer  = require('multer')

// SET STORAGE
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});

var upload = multer({storage: storage}).single('imageupload')
router.post('/edit', function (req, res) {
	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	update_activity(req);

	upload(req, res, function (err) {
		if (err) {
			req.flash('failure', 'Something went wrong!');
			res.redirect('/edit');
			return;
		} else {
			if(req.file!=undefined){
				console.log(req);
				User.find({username: req.user.username}, function(err, user){
					if(err) return;
					user[0].picture = req.file.filename;
					User.update({_id: user[0]._id}, user[0], function(err){
						if(err) console.log(err);
					});
				});
			} else{
				console.log(req.file);
				console.log(req.files);
				console.log(req.body);
			}
			Client.find({_id: req.user.hid}, function(err, client){
				if(err) return;
				client[0].ratio_buffer = req.body.ratiobuffer/100;
				Client.update({_id: req.user.hid}, client[0], function(err){
					if(err) console.log(err);
				});
			});
			req.flash('success', 'Image was uploaded successfully');
			res.redirect('/manage');
			return;
		}
	});
});

router.get('/administration', function(req,res){
	var info = {};

	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	update_activity(req);

	User.find({role: 0}, function(err, users){
		if(err) console.log(err);
		info.users = users;
		info.clients = [];
		const date = new Date();
		for(var c in users){
			Client.find({_id: users[c].hid}, function(err, client){
				if(err) console.log(err)
				if(client[0].time != undefined) client[0].ban_time = ((client[0].time - date)+"").slice(0,-3);
				else client[0].ban_time = 0;
				info.clients[info.clients.length] = client[0];
				info.clients[info.clients.length - 1].active = parseInt(client[0].active - new Date()) > -15000?1:0;
				if(info.clients.length > c){
					res.render('administration',{info: info});
				}
			});
		}
	});
});

router.get('/edit_user/:id', function(req, res){
	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	update_activity(req);
	if(req.user.role == 1){
		User.find({_id:req.params.id}, function(err, user){
			console.log(user);
			if(err){
				console.log(err);
			}else{
				res.render('edit_user', {u: user[0]});
			}
		})
	}else {
		res.redirect('/');
	}
});

router.post('/edit_user', function(req,res){
	req.checkBody('name','Name is required').notEmpty();
	req.checkBody('email','Email is required').notEmpty();
	req.checkBody('email','Email is not valid').isEmail();
	req.checkBody('username','Username is required').notEmpty();
	req.checkBody('password2','Passwords do not match').equals(req.body.password);

	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	update_activity(req);

	if(req.body.ban != 0){
		req.checkBody('ban', 'Bantime must be between 10s and 100s').isInt({gt: 9, lt: 101});
	}

	let errors = req.validationErrors();

	if(errors) {
		User.find({_id: req.body.hiddenid}, function(err, user){
			if(err) return;
			res.render('edit_user', {
				errors: errors,
				u: user[0]
			});
		});
	} else {
		if(req.body.del != undefined){
			Client.remove({_id: req.body.hiddenhid}, function(err){
				if(err) console.log(err);

				User.remove({_id: req.body.hiddenid}, function(err){
					if(err) console.log(err);
					req.flash('success', 'User deleted successfully');
					res.redirect('/administration');
				});
			});

		}else{
			User.find({_id: req.body.hiddenid},function(err, user){
				if(err) return;
				user[0].name = req.body.name;
				user[0].email = req.body.email;
				user[0].username = req.body.username;

				if(req.body.ban > 0){
					const date = new Date();
					const s = date.getSeconds();

					date.setSeconds(parseInt(req.body.ban) + s);

					Client.find({_id: req.body.hiddenhid}, function(err, client){
						if(err) return;
						client[0].time = date;
						Client.update({_id: req.body.hiddenhid}, client[0], function(err){
							if(err) console.log(err);
						});
					});
				}
				if(req.body.password != undefined && req.body.password.length > 0){
					bcrypt.genSalt(10, function(err, salt){
						bcrypt.hash(req.body.password, salt, function(err, hash){
							if(err) console.log(err);
							user[0].password = hash;
							User.update({_id: req.body.hiddenid}, user[0], function(err){
								if(err)	console.log(err);
								req.flash('success', 'User updated successfully');
								res.redirect('/administration');
							});
						});
					});
				}else {
					User.update({_id: req.body.hiddenid}, user[0], function(err){
						if(err)	console.log(err);
						req.flash('success', 'User updated successfully');
						res.redirect('/administration');
					});
				}
			});
		}
	}
});



router.get('/plant_production', function(req,res){
	if(req.user == undefined){
		res.redirect('/login');
	}
	update_activity(req);
	Client.find({_id:req.user.hid}, function(err, client){
		if(err){
			console.log(err);
		}else{
			Sim.find({}, function(err, sim){
				if(err) console.log(err)
				else {
					res.render('plant_production',{rb:client[0].ratio_buffer, r:client[0].rate, s:client[0].status, p:sim[0].price});
				}
			});
		}
	});
});

router.post('/plant_production', function(req,res){
	if(req.user == undefined){
		res.redirect('/login');
		return;
	}
	update_activity(req);
	Client.find({_id: req.user.hid}, function(err, client){
		const date = new Date();
		const s = date.getSeconds();

		date.setSeconds(30 + s);
		client[0].time = date;

		if(err) return;
		console.log(req.body);
		client[0].ratio_buffer = req.body.ratiobuffer/100;
		client[0].rate_change = req.body.rate/100;
		console.log(req.body);
		if((req.body.status == 'off') && (client[0].status > 0)) client[0].status_change = 0;
		else if((req.body.status == 'on') && (client[0].status == 0)) client[0].status_change = 1;
		else if(req.body.status == undefined && client[0].status > 0) client[0].status_change = 0;
		console.log(client[0]);

		Client.update({_id: req.user.hid}, client[0], function(err){
			if(err) console.log(err);
		});

		console.log(client[0]);
		Sim.find({}, function(err, sim){
			if(err) return;
			sim[0].price = req.body.price;
			Sim.update({}, sim[0], function(err){
				if(err) console.log(err);
			});
		});

		req.flash('success', 'Made changes to plant');
		res.redirect('/manage');

	});
});

function update_activity(req){
	if(req.user != undefined){
		Client.find({_id:req.user.hid}, function(err,client){
			client[0].active = new Date();
			Client.update({_id: req.user.hid}, client[0], function(err){
				if(err) console.log(err);
			});
		});
	}
}

module.exports = router;


