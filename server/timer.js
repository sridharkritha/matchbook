// Namespace using Module Pattern 
const TIMER = (function() {
	// Private Members
	return {
		
		///////////////////////   Public Members ///////////////////////////////
		getTimeFromDateObj: function(dateObj) {
			const today = dateObj || new Date();
			
			const time = (today.getHours().toString().length < 2 ? '0'+ today.getHours() : today.getHours())
								+':'+
						(today.getMinutes().toString().length < 2 ? '0'+ today.getMinutes() : today.getMinutes())
								+':'+
						(today.getSeconds().toString().length < 2 ? '0'+ today.getSeconds() : today.getSeconds());		
			return time;
		},

		getCurrentTimeDate: function() {
			const today = new Date();
			const date = (today.getDate().toString().length < 2 ? '0'+ today.getDate() : today.getDate())
								+'-'+
						((today.getMonth()+1).toString().length < 2 ? '0'+ (today.getMonth()+1) : (today.getMonth()+1))
								+'-'+	today.getFullYear();
			const time = (today.getHours().toString().length < 2 ? '0'+ today.getHours() : today.getHours())
								+':'+
						(today.getMinutes().toString().length < 2 ? '0'+ today.getMinutes() : today.getMinutes())
								+':'+
						(today.getSeconds().toString().length < 2 ? '0'+ today.getSeconds() : today.getSeconds());
		
			const timeDate = `${time}  ${date}`;
		
			return timeDate;
		},

		// Convert milliSeconds to hh:mm:ss format
		milliSecondsToHMS: function(milliSecs) {
			let secs = Math.floor(milliSecs / 1000);
			function z(n){return (n<10?'0':'') + n;}
			var sign = secs < 0? '-':'';
			secs = Math.abs(secs);
			return sign + z(secs/3600 |0) + ':' + z((secs%3600) / 60 |0) + ':' + z(secs%60);
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// Max no.of http requests permitted per minute (enum constants)
		g_maxHttpReqPerMin : Object.freeze({
												ACCOUNT       : 300,
												EVENTS        : 700,
												SECURITY      : 200,
												NAVIGATION    : 100,
												REPORTS       : 40,
												BETTING_WRITE : 3000
											}),

		// Min wait time(milliseconds) before giving a next new http request (enum constants)

		// g_minHttpReqWaitTime : Object.freeze({
		g_minHttpReqWaitTime : () => { return {
												ACCOUNT       : Math.round(1000 * 60 / TIMER.g_maxHttpReqPerMin.ACCOUNT), // milliseconds
												EVENTS        : Math.round(1000 * 60 / TIMER.g_maxHttpReqPerMin.EVENTS),
												// EVENTS        : 0, // test
												SECURITY      : Math.round(1000 * 60 / TIMER.g_maxHttpReqPerMin.SECURITY),
												NAVIGATION    : Math.round(1000 * 60 / TIMER.g_maxHttpReqPerMin.NAVIGATION),
												REPORTS       : Math.round(1000 * 60 / TIMER.g_maxHttpReqPerMin.REPORTS),
												BETTING_WRITE : Math.round(1000 * 60 / TIMER.g_maxHttpReqPerMin.BETTING_WRITE)
											};},

		// Global timer for individual request types
		g_reqTypeTimer : {
							ACCOUNT       : 0,
							EVENTS        : 0,
							SECURITY      : 0,
							NAVIGATION    : 0,
							REPORTS       : 0,
							BETTING_WRITE : 0
		},

		// Request types
		g_reqType : Object.freeze({
									ACCOUNT       : "ACCOUNT",
									EVENTS        : "EVENTS",
									SECURITY      : "SECURITY",
									NAVIGATION    : "NAVIGATION",
									REPORTS       : "REPORTS",
									BETTING_WRITE : "REPORTS"
		}),

		awaitForMaxReqTimeSlot : (type) => {
			// TEST (start) 
			// return new Promise(resolve => setTimeout(() => {
			// 	TIMER.g_reqTypeTimer[type] = new Date();
			// 	resolve(`${type} : ${TIMER.g_minHttpReqWaitTime()[type]} ms`);
			// }, 0));
			// TEST (end)



			let delay = 0;
			if(!TIMER.g_reqType[type]) console.error("Invalid Http request group type");
			const timeElapsed = new Date() - TIMER.g_reqTypeTimer[type];
			if(timeElapsed < TIMER.g_minHttpReqWaitTime()[type]) delay =  TIMER.g_minHttpReqWaitTime()[type] - timeElapsed;
			return new Promise(resolve => setTimeout(() => {
																TIMER.g_reqTypeTimer[type] = new Date();
																resolve(`${type} : ${TIMER.g_minHttpReqWaitTime()[type]} ms`);
															}, delay));
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	};
})();


// exports the variables and functions above so that other modules can use them
module.exports.getCurrentTimeDate = TIMER.getCurrentTimeDate;
module.exports.milliSecondsToHMS = TIMER.milliSecondsToHMS;
module.exports.getTimeFromDateObj = TIMER.getTimeFromDateObj;
module.exports.awaitForMaxReqTimeSlot = TIMER.awaitForMaxReqTimeSlot;














