try {
	process.chdir(__dirname);
}
catch(err) {
	console.log("Could not change working directory to app root");
	process.exit(1);
}

const express = require("express");
const bodyParser = require("body-parser");
const teos10 = require("./teos10"); // Compiled from gsw_c_v3.05 with emsdk-1.35.0-portable-64bit


const appPort = 3337;
const localAddr = "127.0.0.1";


const app = express();
app.use(bodyParser.json());


// input (as json in Body): 
// {
//   lat: float 
//   lon: float
//   ctpSeries: [[timestamp, conductivity, temperature, pressure]]
// }
// in-situ conductivity [ mS/cm ]
// in-situ temperature [deg C]
// in-situ pressure [dbar]

// output
// {
//  timestamps : []
//  practicalSalinity : []
//  absoluteSalinity : []
//  potentialTemperature : []
//  conservativeTemperature : []
//  soundSpeed : []
//  potentialDensityAnomaly : []
// }


// function gsw_sp_from_c(c,t,p)
// c      : conductivity                                     [ mS/cm ]
// t      : in-situ temperature [ITS-90]                     [deg C]
// p      : sea pressure                                     [dbar]
//
// sp     : Practical Salinity                               [unitless]


// function gsw_sa_from_sp(sp,p,lon,lat)       
// sp     : Practical Salinity                              [unitless]
// p      : sea pressure                                    [dbar]
// lon	 : longitude                                       [DEG E]     
// lat    : latitude                                        [DEG N]
// 
// gsw_sa_from_sp   : Absolute Salinity                     [g/kg]


// gsw_ct_from_t(double sa, double t, double p)
// sa     : Absolute Salinity                               [g/kg]
// t      : in-situ temperature                             [deg C]
// p      : sea pressure                                    [dbar]
//
// gsw_ct_from_t : Conservative Temperature                 [deg C]



// function gsw_pt_from_ct(sa,ct)  
// sa     : Absolute Salinity                               [g/kg]
// ct     : Conservative Temperature                        [deg C]
// p      : sea pressure                                    [dbar]
//
// gsw_pt_from_ct : potential temperature with              [deg C]
//                  reference pressure of  0 dbar


// function gsw_sound_speed(sa,ct,p)  
// sa     : Absolute Salinity                               [g/kg]
// ct     : Conservative Temperature (ITS-90)               [deg C]
// p      : sea pressure                                    [dbar]
// 
// sound_speed  : speed of sound in seawater                [m/s]



// function gsw_sigma0(sa,ct) 
//  Calculates potential density anomaly with reference pressure of 0 dbar,
//  this being this particular potential density minus 1000 kg/m^3.  This
//  function has inputs of Absolute Salinity and Conservative Temperature.
//  This function uses the computationally-efficient 48-term expression for 
//  density in terms of SA, CT and p (IOC et al., 2010).
//
// sa     : Absolute Salinity                               [g/kg]
// ct     : Conservative Temperature                        [deg C]
// 
// gsw_sigma0  : potential density anomaly with reference pressure of 0



app.post("/conversion", function (req, res) {
	if(!req.body.hasOwnProperty("lat")
	|| typeof req.body["lat"] !== "number"
	|| req.body["lat"] < -90.0
	|| req.body["lat"] > 90.0
	|| !req.body.hasOwnProperty("lon")
	|| typeof req.body["lon"] !== "number"
	|| req.body["lon"] < -180.0
	|| req.body["lon"] > 180.0
	|| !req.body.hasOwnProperty("ctpSeries")
	|| !Array.isArray(req.body["ctpSeries"])) {
		res.status(400).send("Bad Request");
		return;
	}
	
	var resData = {	
		timestamps : [],
		practicalSalinity : [],
		absoluteSalinity : [],
		potentialTemperature : [],
		conservativeTemperature : [],
		soundSpeed : [],
		potentialDensityAnomaly : []
	};
	const lat = req.body["lat"];
	const lon = req.body["lon"];
	req.body["ctpSeries"].forEach(function(d) {
		if(!Array.isArray(d)
		|| d.length < 4
		|| typeof d[0] !== "number"
		|| typeof d[1] !== "number"
		|| typeof d[2] !== "number"
		|| typeof d[3] !== "number") {
			return;
		}
		resData.timestamps.push(d[0]);
		const c = d[1];
		const t = d[2];
		const p = d[3];
		const sp = teos10._gsw_sp_from_c(c, t, p);
		const sa = teos10._gsw_sa_from_sp(sp, p, lon, lat);
		const ct = teos10._gsw_ct_from_t(sa, t, p);
		const pt = teos10._gsw_pt_from_ct(sa, ct);
		const sound_speed = teos10._gsw_sound_speed(sa, ct, p);
		const sigma0 = teos10._gsw_sigma0(sa, ct);
		
		resData.practicalSalinity.push(sp);
		resData.absoluteSalinity.push(sa);
		resData.potentialTemperature.push(pt);
		resData.conservativeTemperature.push(ct);
		resData.soundSpeed.push(sound_speed);
		resData.potentialDensityAnomaly.push(sigma0);
	});
	
	res.json(resData);
});


app.listen(appPort, localAddr, function () {
	console.log("Conversion app listening on port " + appPort);
});
