function Update(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
                if(this.responseText == ""){
                        return;
                }
		console.log(this.responseText);
       		var json = JSON.parse(this.responseText);
		for(var i = 0; i < Object.keys(json).length; i++){
			document.getElementById("p-"+i).innerHTML = 'Production: '.bold() + json[i].production+" kWh";
			document.getElementById("ban-"+i).innerHTML = 'Ban time: '.bold() + json[i].ban_time + ' s';
			document.getElementById("c-"+i).innerHTML = 'Consumption: '.bold() + json[i].consumption+" kWh";
			document.getElementById("n-"+i).innerHTML = 'Net production: '.bold() + (json[i].production-json[i].consumption)+" kWh";
			document.getElementById("b-"+i).innerHTML = 'Buffer: '.bold() + json[i].buffer+" kWh";
			document.getElementById("r-"+i).innerHTML = 'Ratio to buffer:  '.bold() + (json[i].ratio_buffer*100)+'%';

			if(json[i].ban_time > 0) document.getElementById("ban-"+i).style.display = "initial";
			else document.getElementById("ban-"+i).style.display = "none";
			document.getElementById("a-"+i).innerHTML = 'Status: '.bold() + (json[i].active?"Online":"Offline");

			if(json[i].blackout == 1) document.getElementById("bo-"+i).style.display = "initial";
			else document.getElementById("bo-"+i).style.display = "none";

		}

	};
        xhttp.open("GET", "get_all_status");
        xhttp.send();
}

setInterval(Update,500);
