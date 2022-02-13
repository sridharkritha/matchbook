// Namespace using Module Pattern 
const UTIL = (function() {
	// Private Members
	const CONNECTIONS = require("./connections");
	return {
		///////////////////////   Public Members ///////////////////////////////////////////////////////////////////////

		randomIntFromInterval: function (min, max) { // min and max included 
			return Math.floor(Math.random() * (max - min + 1) + min);
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// round after 2 decimal places
		roundIt2D: function(value) {
			// return Math.floor(value * 100) / 100;                    // 0.3 - 0.2 = 0.09  (or) 1.256 => 1.25 
			return Math.round((value + Number.EPSILON) * 100) / 100; // 0.3 - 0.2 = 0.1
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		// Check the given object is NULL object or NOT.
		isNullObject: (obj) => {
			for(let i in obj) return false;
			return true;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		formatString : (str, length) => {
			// g_betScanRound.toString().padStart(5, "0"); // 1 ==> 00001
			if(str.length < length) return str.padEnd(length," ");
	
			CONNECTIONS.print("warnings",`Warning: String(${str}) length is larger than format length(${length})`);
			// console.log(`Warning: String(${str}) length is larger than format length(${length})`);
			
			// return str.substring(0, length); // trimmed string
			return str.slice(0, length-4) + "...)"; // trimmed string
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		isSameDate : (dateObjOne, dateObjTwo) => {
			// check same date (Ignore any time difference) or not ?
			return dateObjOne.toISOString().split('T')[0] === dateObjTwo.toISOString().split('T')[0] ? true : false;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// 1760 yards = 1 mile
		// 220 yards  = 1 furlong
		// 8 furlongs = 1 mile
		// mfyString = "3m 4f 200y";   => 6360 yards
		convertMfyToYards : (mfyString) => {
			if(mfyString) {
				const arr = mfyString.split(" ");
				if(arr.length) return arr[0].split("m")[0] * 1760 + arr[1].split("f")[0] * 220 + Number(arr[2].split("y")[0]);
			}

			console.log("0 length Horse Race !!!");
			return 0;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// 265mtrs / 642mtrs <= dog race

		// Horse speed = 30 or 31 miles/hour
		// 1 furlongs  = 15 seconds     or 14.56 seconds  or  15.21 seconds
		// 1 yard      = (15/220) seconds 

		// const str = "0m 5f 0y";   // shortest Length =>             runningTime = 1.25 seconds
		// const str = "2m 0f 167y"; // market closed = 12f = 3rd min; runningTime = 4.189772727272727
		// const str = "2m 0f 204y"; // market closed = 4th min;       runningTime = 4.2318181818181815
		calculateRaceRunningTime : (sports, trackYardsLength) => {
			let raceRunningTimeInSec = 0;
			const horseSpeedPerYardInSeconds = 15 / 220; // 1 furlongs = 15 seconds (or) 30 miles/hour
			switch(sports) {
				case "Horse Racing":
					raceRunningTimeInSec = trackYardsLength * horseSpeedPerYardInSeconds;
				break;
			}

			return raceRunningTimeInSec;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		getDefaultOptions: function()
		{
			return {
				method: 'GET',
				headers: { 
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'user-agent': 'api-doc-test-client'
					//, 'Accept-Encoding': 'gzip' 
					, 'gzip': true
				}
			};
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	};
})();


// exports the variables and functions above so that other modules can use them
module.exports.getDefaultOptions = UTIL.getDefaultOptions;
module.exports.randomIntFromInterval = UTIL.randomIntFromInterval;
module.exports.roundIt2D = UTIL.roundIt2D;
module.exports.isNullObject = UTIL.isNullObject;
module.exports.formatString = UTIL.formatString;
module.exports.isSameDate = UTIL.isSameDate;
module.exports.convertMfyToYards = UTIL.convertMfyToYards;
module.exports.calculateRaceRunningTime = UTIL.calculateRaceRunningTime;














