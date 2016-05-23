try {
	process.chdir(__dirname);
}
catch(err) {
	console.log("Could not change working directory to app root");
	process.exit(1);
}

const express = require("express");
const crypto = require("./teos10");


const appPort = 3337;
const localAddr = "127.0.0.1";


const app = express();

app.get("/absolute_salinity", function (req, res) {
	res.status(404).send("TODO");
});

app.get("/conservative_temperature", function (req, res) {
	res.status(404).send("TODO");
});


app.listen(appPort, localAddr, function () {
	console.log("Conversion app listening on port " + appPort);
});
