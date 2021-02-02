function Update(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
                if(this.responseText == ""){
                        return;
                }
		console.log(this.responseText);
       		var json = JSON.parse(this.responseText);
		document.getElementById("smp").innerHTML = 'Suggested market price (SEK):  ' + (json.smp);

	 };
        xhttp.open("GET", "get_status");
        xhttp.send();
}

setInterval(Update,100);
