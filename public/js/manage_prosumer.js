function Update(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
                if(this.responseText == ""){
                        return;
                }
		console.log(this.responseText);
       		var json = JSON.parse(this.responseText);
		document.getElementById("w").innerHTML = 'Wind speed: '.bold() + json.wind.toFixed(2) +" m/s";
		document.getElementById("p").innerHTML = 'Market price: '.bold() + json.price+" kr";
		document.getElementById("b").innerHTML = 'Battery buffer: '.bold() + json.buffer.toFixed(2)+" kWh";
		document.getElementById("hc").innerHTML = 'Consumption: '.bold() + json.consumption.toFixed(2)+" kWh";
		document.getElementById("hp").innerHTML = 'Production: '.bold() + json.production.toFixed(2)+" kWh";
		document.getElementById("net").innerHTML = 'Net production: '.bold() + (json.production-json.consumption).toFixed(2)+" kWh";
		document.getElementById("rb").innerHTML = 'Ratio to buffer:  '.bold() + (json.ratio_buffer*100)+'%';
		document.getElementById("ban").innerHTML = 'You have been banned, time remaining:  '.bold() + (json.ban_time)+'s';
		if(json.ban_time > 0) document.getElementById("ban").style.display = 'initial';
		else document.getElementById("ban").style.display = 'none';
		console.log(json.ban_time);

	 };
        xhttp.open("GET", "get_status");
        xhttp.send();
}

setInterval(Update,100);
