let Sim = require('./models/sim');
let Wind = require('./public/js/wind');
let Consumption = require('./public/js/consumption');
let Client = require('./models/client');

var interval_index = 0;
var consumers = [];
var nr_consumers = 5;
var cycle_consumption = 0;

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

	setInterval(wind_cycle,1000);
	interval_index = setInterval(book_consumption,3000);
}

function book_consumption(){
	clearInterval(interval_index);
	console.log('booking consumption');
	// Create code for calculating consumtion of this cycle

	cycle_consumption = 0;

	for(var i = 0; i < nr_consumers; i++){
		cycle_consumption += consumers[i];
	}

	// Calc prosumers
	Client.find({type: 0}, function(err, clients){
		for(var client in clients){
			if(!isNaN(clients[client].consumption)){
				cycle_consumption += clients[client].consumption;
			}
		}
	});


	// update db with new cycle consumtion
	Sim.find({}, function(err, sims){
		if(err) console.log(err);
		sims[0].total_consumption = cycle_consumption;
		Sim.update({_id: sims[0]._id},sims[0],function(err,res){
			if(err) console.log(err);
		});
		//Sim.updateOne({'_id': sims[0]._id},{'total_consumption': cycle_consumption});
	 });

	interval_index = setInterval(produce, 3000);
}

function produce(){
	clearInterval(interval_index);
	console.log('producing');

	// Create code for calculating production
	var cycle_production = 0;
	var cycle_wind = 0;

	Sim.find({}, function(err, sim){
		if(err) return;
		cycle_wind = sim[0].wind;
	});

	var net_prod = 0;

	// Calc prosumers
	Client.find({}, function(err, clients){
		for(var client in clients){
			if(clients[client].type==0){
				clients[client].production = Wind.production(cycle_wind);
				net_prod = (clients[client].production-clients[client].consumption);
				if(net_prod > 0){
					clients[client].buffer = (net_prod * clients[client].ratio_buffer);
					cycle_production += (net_prod*(1-clients[client].ratio_buffer)+clients[client].consumption);
				}else if(net_prod < 0){
					if(clients[client].buffer > 0){
						if(clients[client].buffer >= (-net_prod)){
							clients[client].buffer  += net_prod;
							cycle_production += clients[client].consumption;
						}else {
							cycle_production += clients[client].buffer;
							clients[client].buffer = 0;
						}
					}
				}
			}
			Client.update({_id: clients[client]._id},clients[client],function(err){
				if(err) console.log(err);
			});
			//implement manager here
		}
	});


	// update db with new cycle consumtion
	Sim.find({}, function(err, sims){
		sims[0].total_production = cycle_production;
		Sim.update({_id: sims[0]._id}, sims[0], function(err){
			if(err) console.log(err);
		});
	 });



	/*	Prosumer steps:
		1. get wind from db
		2. View demand and calc production
	*/


	/*	Price model:
			Price limits: 0.5 - 5kr
			Base price: wind_status =>
						0.5 kr - High
						1.5 kr - Average
						 2  kr - Under average
						 3  kr - None/low
			Surcharge price:
				tProd > tCons				0 kr
				tProd < tCons				1 kr
				tProd + one house  (55x1) < tCons	2 kr
				tProd + two houses (55x2) < tCons	3 kr
	*/

	interval_index = setInterval(consume, 3000);
}

function consume(){
	clearInterval(interval_index)
	console.log('consuming');

	// Create code for removing energy and maybe cause blackout

	for(var i = 0; i < nr_consumers; i++){
		consumers[i] = Consumption.change(consumers[i]);
	}

	Client.find({}, function(err, clients){
		for(var client in clients){
			clients[client].consumption = Consumption.change(clients[client].consumption);
			Client.update({_id: clients[client]._id}, clients[client], function(err){
				if(err) console.log(err);
			});
		}
	 });


	interval_index = setInterval(book_consumption, 3000);
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
