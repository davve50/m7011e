let Sim = require('./models/sim');
let Wind = require('./public/js/wind');
let Consumption = require('./public/js/consumption');
let Client = require('./models/client');

var consumers = [];
var plants = [];
var nr_consumers = 5;
var cycle_consumption = 0;
var cycle_time = 1000;

function start_simulation(){
	// Initialize consumers consumtion
	for(var i = 0; i < nr_consumers; i++){
		consumers[i] = Consumption.init(); // Math.random() * 85
	}

	// Initialize wind speed

	let newSim = new Sim({
		total_consumption:0,
		total_production:0,
		price:1.5,
		sprice:1.5,
		consumers:nr_consumers,
		wind:Wind.init()
	});

	newSim.save(function(err){
          	if(err){
            		console.log(err);
            		return;
          	}
	});

	console.log("[Sim] Started simulation with values: ");
	console.log(newSim);

	setInterval(wind_cycle, cycle_time/2);
	setTimeout(book_consumption, cycle_time);
}

function book_consumption(){
	console.log('Booking consumption...');
	// Create code for calculating consumtion of this cycle

	cycle_consumption = 0;

	for(var i = 0; i < nr_consumers; i++){
		cycle_consumption += consumers[i];
	}

	// Calc prosumers
	Client.find({type: 0}, function(err, clients){
		for(let i in clients){
			if(!isNaN(clients[i].consumption) && clients[i].type == 0){
				cycle_consumption += clients[i].consumption;
			}
		}
		// update db with new cycle consumtion
		Sim.find({}, function(err, sims){
			if(err) console.log(err);
			sims[0].total_consumption = cycle_consumption;
			Sim.update({_id: sims[0]._id},sims[0],function(err,res){
				if(err) console.log(err);
			});
			setTimeout(produce, cycle_time);
		 });
	});
}

function produce(){
	console.log('Producing...');

	// Create code for calculating production
	var cycle_production = 0;
	var cycle_consumption = 0;
	var cycle_wind = 0;
	var net_prod = 0;

	Sim.find({}, function(err, sims){
		if(err) return;
		cycle_wind = sims[0].wind;
		cycle_consumption = sims[0].total_consumption;

		// Calc prosumers
		Client.find({}, function(err, clients){
			// loop though prosumers
			for(let i in clients){
				if(clients[i].type == 0){
					clients[i].production = Wind.production(cycle_wind);
					net_prod = (clients[i].production-clients[i].consumption);
					if(net_prod > 0){
						if((clients[i].time - new Date()) > 0){
							clients[i].buffer = (net_prod);
							cycle_production += clients[i].consumption;
						}else {
							clients[i].buffer = (net_prod * clients[i].ratio_buffer);
							cycle_production += (net_prod*(1-clients[i].ratio_buffer)+clients[i].consumption);
						}
					}else if(net_prod < 0){
						if(clients[i].buffer > 0){
							if(clients[i].buffer >= (-net_prod)){
								clients[i].buffer  += net_prod;
								cycle_production += clients[i].consumption;
							}else {
								cycle_production += clients[i].buffer;
								clients[i].buffer = 0;
							}
						}
					}
					Client.update({_id: clients[i]._id},clients[i],function(err){
						if(err) console.log(err);
					});
				}
			}
			// loop through manager production
			for(let j in clients){
				if(clients[j].type == 1){
					// power plant is on
					if(clients[j].status != 0){
						// no active delay, rate is changing
						if((clients[j].time - new Date()) < 0 && clients[j].rate_change != clients[j].rate){
							clients[j].rate = clients[j].rate_change;
						}
						// no active delay, status is  changing
						if((clients[j].time - new Date()) < 0 && clients[j].status_change != clients[j].status){
							clients[j].status = clients[j].status_change;
						}

						clients[j].production = clients[j].rate * 1000;
						clients[j].buffer += clients[j].production * clients[j].ratio_buffer;
						cycle_production += (1 - clients[j].ratio_buffer)*clients[j].production;
					}
					// power plant is off
					else{
						if(clients[j].production > 0){
							clients[j].production = 0;
						}
						if((clients[j].time - new Date()) < 0 && clients[j].status_change != clients[j].status){
							clients[j].status = clients[j].status_change;
						}
					}
					Client.update({_id: clients[j]._id},clients[j],function(err){
						if(err) console.log(err);
					});
				}
			}
			net_prod = cycle_production - cycle_consumption;

			// check if demands are not met, take from manager buffer
			if(net_prod < 0){
				for(var i  in clients){
					if(clients[i].type == 1){
						if(net_prod + clients[i].buffer > 0){
							clients[i].buffer += net_prod;
							cycle_production -= net_prod;
						}else{
							cycle_production += clients[i].buffer;
							clients[i].buffer = 0;
						}
					}
					Client.update({_id: clients[i]._id},clients[i],function(err){
						if(err) console.log(err);
					});
				}
			}

			// update db with new cycle consumtion
			sims[0].total_production = cycle_production;
			Sim.update({_id: sims[0]._id}, sims[0], function(err){
				if(err) console.log(err);
			});
			setTimeout(consume, cycle_time);
		});
	});
}

function consume(){
	console.log('Consuming...');
	var cycle_production;

	Sim.find({}, function(err, sim){
		if(err) return;
		cycle_production = sim[0].total_production;
		for(var i = 0; i < nr_consumers; i++){
			cycle_production -= consumers[i];
		}

		Client.find({}, function(err, clients){
			var nr_blackouts = 0;
			for(let i in clients){
				if(clients[i].type == 0){
					cycle_production -= clients[i].consumption;
					if(cycle_production < -1){
						clients[i].blackout = 1;
						console.log("Prosumer "+i+" currently has a blackout");
						nr_blackouts += 1;
					}else{
						clients[i].blackout = 0;
					}
				}
				Client.update({_id: clients[i]._id}, clients[i], function(err){
					if(err) console.log(err);
				});
			}
			for(var i = 0; i < nr_consumers; i++){
				consumers[i] = Consumption.change(consumers[i]);
			}
			for(var client in clients){
				clients[client].consumption = Consumption.change(clients[client].consumption);
				Client.update({_id: clients[client]._id}, clients[client], function(err){
					if(err) console.log(err);
				});
			}

			var price = 0.0;

			// Add base price based on current wind
			switch(Wind.status(sim[0].wind)){
				case 0:
					price += 3;
					break;
				case 1:
					price += 2;
					break;
				case 3:
					price += 1.5;
					break;
				case 4:
					price += 0.5;
					break;
			}

			// Add surcharge price based on current electricity demands
			if (cycle_production > 0){
				price += 0;
			}else if (cycle_production < 0){
				price += nr_blackouts;
			}

			sim[0].sprice = price;
			Sim.update({_id: sim[0]._id}, sim[0], function(err){
				if(err) console.log(err);
			});

			setTimeout(book_consumption, cycle_time);
		});


	});
}

function wind_cycle(){
	Sim.find({}, function(err, sim){
		if(err) return;

		sim[0].wind = Wind.change(sim[0].wind);
		console.log("[Sim] Wind = "+sim[0].wind);

		Sim.update({}, sim[0], function(err){
			if(err) console.log("Error db, wind_cycle");
		});
	});
}

exports.start_simulation = start_simulation;
