function init_wind(){
	return Math.random() * 8.6;
}

function change_wind(wind){
	var prob;
	var mean = 3.6625;
	var qL = 1.3;
	var qU = 6.5;

	if(wind > mean){
		if(wind > qU){
			prob = 9; // 10%
		}else{
			prob = 5; // 50%
		}
	}else{
		if(wind < qL){
			prob = (10-8); // 80%
		}else{
			prob = (10-6); // 60%
		}
	}

	if((Math.floor(Math.random()*10)+1) > prob){
		w = wind + Math.random() * 0.7;
	}else{
		w = wind - Math.random() * 0.7;
	}


	if(w < 0){
		w = 0;
	}

	if(w > 8.6){
		w = 8.5 + Math.random() * 0.1;
	}

	return w;
}

function wind_status(wind){
	/*	Status integer with corresponding interpretation of values:
			0 - No/low wind 	(0% production)
			1 - Below average 	(50% production)
			2 - Average 		(130% prodcution)
			3 - High		(170% production)
	*/
	var mean = 3.6625;
	var qL = 1.3;
	var qU = 6.5;

	if(wind > mean){
                if(wind > qU){
                        return 3;
                }else{
                        return 2;
                }
        }else{
                if(wind > qL){
                        return 1;
                }else{
                        return 0;
                }
        }
}

function wind_production(wind){
	var status = wind_status(wind);
	switch(status){
		case 0:
			return 0;
		case 1:
			return (200*0.5);
		case 2:
			return (200*1.3);
		case 3:
			return (200*1.7);
	}
}

exports.init = init_wind;
exports.change = change_wind;
exports.status = wind_status;
exports.production = wind_production;

/*
	ONLY FOR STYLE

var below_ok = "\x1b[33m";
var ok = "\x1b[32m";
var high = "\x1b[31m";
var low = "\x1b[35m";
var exit_color = "\x1b[0m";

	REMOVE LATER
*/
/*
var color;
for(var i = 0; i < 100; i++) {
	wind_speed = change_wind(wind_speed, mean, qL, qU);
	if(wind_speed > mean){
		if(wind_speed > qU)
			color = high;
		else
			color = ok;
	}else{
		if(wind_speed < qL)
			color = low;
		else
			color = below_ok;
	}
	console.log(color+"Epoch "+(i+1)+": "+wind_speed+""+exit_color);
}
*/
