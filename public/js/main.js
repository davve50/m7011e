function Update(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
                if(this.responseText == ""){
                        return;
                }
		console.log(this.responseText);
       		var json = JSON.parse(this.responseText);
		document.getElementById("w").innerText = 'Wind speed: ' + json.wind;
		document.getElementById("p").innerText = 'Market price: ' + json.price;
		document.getElementById("b").innerText = 'Battery buffer: ' + json.buffer;
		document.getElementById("hc").innerText = 'Consumption: ' + json.consumption;
		document.getElementById("hp").innerText = 'Production: ' + json.production;
		document.getElementById("net").innerText = 'Net production: ' + (json.production-json.consumption);
		document.getElementById("rb").innerText = 'Ratio to buffer:  ' + (json.ratio_buffer*100)+'%';

	 };
        xhttp.open("GET", "get_status");
        xhttp.send();
}

setInterval(Update,100);
