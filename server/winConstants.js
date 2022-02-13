// Win Constants with respect to sports
const WC = (function() {
	// Private Members
	// const sportsWinningConstants = {
	// 	"allSports": {
	// 		"g_BetStakeValue"           : 0.2,  // ( 0.1 = 1p, 1 = £1) your REAL MONEY !!!!
	// 		"g_betMinutesOffset"        : 600,  // (600 = 10hrs before). 1 => place bet: +1 min before the start time, -5 min after the start time	
	// 		"g_minWinConfidencePercentage" : 80,   // 80 => comparison with nearest competitor ex: 100  (100% or more)
	// 		"g_minProfitOdd"            : 0.8,  // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
	// 		"g_maxRunnersCount"         : 25
	// 	},

	// 	"Horse Racing": {
	// 		"autoBetAtBestWinningTime"  : true, // ignore "g_betMinutesOffset"
	// 		// "g_betMinutesOffset"     : 3,    // place bet: +1 min before the start time, -5 min after the start time
	// 		"g_minWinConfidencePercentage" : 80,   // ex: 80 => (80% or more)
	// 		"g_minProfitOdd"            : 0.7   // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
	// 	},

	// 	"Tennis": {
	// 		// "betAfterEventStarted": true, // "in-running-flag"
	// 		// g_betMinutesOffset = -1; // place bet: +1 min before the start time, -5 min after the start time
	// 		"g_betMinutesOffset": 3,         // g_betMinutesOffset

	// 		"g_minWinConfidencePercentage": 80, // ex: 80 => (80% or more)

	// 		"g_minProfitOdd": 0.7 // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
	// 	},
	// };

	return {

		// Public Members

		sportsWinningConstants : Object.freeze({
			"allSports": {
				// Time
				"autoBetAtBestWinningTime"     : false, // true => ignores "g_betMinutesOffset"
				"g_betMinutesOffset"           : 600,  // (600 = 10hrs before). 1 => place bet: +1 min before the start time, -5 min after the start time	
				"ignore_realStartTime"         : false,
				// Money
				"g_BetStakeValue"              : 0.2,  // ( 0.1 = 1p, 1 = £1) your REAL MONEY !!!!
				"g_minProfitOdd"               : 0.8,  // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
				// Win
				"g_minWinConfidencePercentage" : 80,   // 80  => comparison with nearest competitor ex: 100  (100% or more)
				"g_maxWinConfidencePercentage" : 150,  // 150 => comparison with nearest competitor ex: 100  (100% or more)
				// Counts
				"g_maxRunnersCount"            : 100
			},

			"Test Constants": {
				// "g_betMinutesOffset"              : 600, // (600 = 10hrs before). 1 => place bet: +1 min before the start time, -5 min after the start time	
				// "g_minProfitOdd"                  : 0.01, // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
				// "g_minWinConfidencePercentage"    : 0,  // 80  => comparison with nearest competitor ex: 100  (100% or more)
				// "g_maxRunnersCount"               : 25,

				// // "g_whichDayEvent"              : '2021-12-26'; // 'today' or 'tomorrow' or "2019-12-24" (ISO specific date)
				// // Counts

			},
	
			"Horse Racing": {
				// // Time
				// "autoBetAtBestWinningTime"     : true, // ignores "g_betMinutesOffset"
				// "g_betMinutesOffset"           : -1,    // place bet: +1 min before the start time, -5 min after the start time
				// // Money
				// "g_minProfitOdd"               : 0.7,   // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
				// // Win
				"g_minWinConfidencePercentage"    : 120,   // 100, ex: 80 => (80% or more)
				// Counts
				"g_maxRunnersCount"               : 18
			},

			"Greyhound Racing": {
				// Time
				// "g_betMinutesOffset"           : -1,   // -1 => 1 minute after event start time
				// "ignore_realStartTime"         : true
				// Win
				"g_minWinConfidencePercentage"    : 120,   // 80  => comparison with nearest competitor ex: 100  (100% or more)
			},

			"Soccer": {
				// Win
				"g_minWinConfidencePercentage"    : 120,   // 80  => comparison with nearest competitor ex: 100  (100% or more)
			},
	
			"Tennis": {
				// "betAfterEventStarted": true, // "in-running-flag"
				// g_betMinutesOffset = -1; // place bet: +1 min before the start time, -5 min after the start time


				// "g_betMinutesOffset"           : 3,         // g_betMinutesOffset
	
				// // Win
				"g_minWinConfidencePercentage"    : 100,   // ex: 80 => (80% or more)
	
				// "g_minProfitOdd"               : 0.7 // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
			},
		}),

		getSportsWinningConstants: (sportsName, isLockedForBetting) => { 
			let mergedWinningConsts = WC.sportsWinningConstants["allSports"];
			if(WC.sportsWinningConstants[sportsName])
			{
				// merge the objects properties
				mergedWinningConsts = { ...WC.sportsWinningConstants["allSports"], ...WC.sportsWinningConstants[sportsName] };

				// Fake / Test bet
				if(isLockedForBetting) {
					mergedWinningConsts = { ...mergedWinningConsts, ...WC.sportsWinningConstants["Test Constants"] };
				}

				if(mergedWinningConsts.autoBetAtBestWinningTime) delete mergedWinningConsts.g_betMinutesOffset;
			}

			return mergedWinningConsts;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	};
})();


// exports the variables and functions above so that other modules can use them
module.exports.getSportsWinningConstants = WC.getSportsWinningConstants;





