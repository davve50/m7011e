function Update(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
                if(this.responseText == ""){
                        return;
                }
		console.log(this.responseText);
       		var json = JSON.parse(this.responseText);
		document.getElementById("w").innerHTML = 'Wind speed: '.bold() + json.wind.toFixed(2)+" m/s";
		document.getElementById("p").innerHTML = 'Market price: '.bold() + json.price+" kr";
		document.getElementById("b").innerHTML = 'Battery buffer: '.bold() + json.buffer.toFixed(2)+" kWh";
		document.getElementById("hp").innerHTML = 'Production: '.bold() + json.production.toFixed(2)+" kWh";
		document.getElementById("rb").innerHTML = 'Ratio to buffer:  '.bold() + (json.ratio_buffer*100)+'%';
		document.getElementById("r").innerHTML = 'Production rate:  '.bold() + (json.rate*100)+'%';
		document.getElementById("s").innerHTML = 'Plant status: '.bold() + (json.status?"On":"Off");
		document.getElementById("d").innerHTML = 'Making changes in: '.bold() + json.ban_time+'s';
		document.getElementById("man").innerHTML = 'Amount of managers: '.bold() + json.num_man;
		document.getElementById("pro").innerHTML = 'Amount of prosumers: '.bold() + json.num_pro;
		document.getElementById("con").innerHTML = 'Amount of consumers: '.bold() + json.num_con;
		document.getElementById("tp").innerHTML = 'Total production: '.bold() + json.total_production.toFixed(2)+" kWh";
		document.getElementById("tc").innerHTML = 'Total consumption: '.bold() + json.total_consumption.toFixed(2)+" kWh";

		if(json.ban_time > 0) document.getElementById("d").style.display = "initial";
		else document.getElementById("d").style.display = "none";

		if(json.blackouts > 0) document.getElementById("bo").style.display = "initial";
		else document.getElementById("bo").style.display = "none";

	 };
        xhttp.open("GET", "get_status");
        xhttp.send();
}

setInterval(Update,100);
