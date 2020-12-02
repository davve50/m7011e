
function init_consumer(){
	return Math.random() * 85 + 25;
}

function change_consumtion(consumtion){
	var prob;
	var mean = 55;
	var qL = 40;
	var qU = 70;

	if(consumtion > mean){
		if(consumtion > qU){
			prob = 8;
		}else{
			prob = 7;
		}
	}else{
		if(consumtion < qL){
			prob = (10-8);
		}else{
			prob = (10-7);
		}
	}

	if((Math.floor(Math.random()*10)+1) > prob){
		c = consumtion + Math.random() * 8;
	}else{
		c = consumtion - Math.random() * 8;
	}


	if(c < 25){
		c = 25 + Math.random() * 0.1;
	}

	if(c > 85){
		c = 84.9 + Math.random() * 0.1;
	}

	return c;
}

exports.init = init_consumer;
exports.change = change_consumtion;

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
	consumtion = change_consumtion(consumtion, mean, qL, qU);
	if(consumtion > mean){
		if(consumtion > qU)
			color = high;
		else
			color = ok;
	}else{
		if(consumtion < qL)
			color = low;
		else
			color = below_ok;
	}
	console.log(color+"Epoch "+(i+1)+": "+consumtion+""+exit_color);
}
*/
