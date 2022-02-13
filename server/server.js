(function () {
	// https://developers.matchbook.com/reference
	const request = require('request');

	const CONNECTIONS = require("./connections");
	const io = CONNECTIONS.io;
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	const FA    = require('./fileAccess');
	const WC    = require('./winConstants');
	const TIMER = require('./timer');
	const UTIL  = require('./util');
	const DOOR  = require('./door');
	const MISC  = require('./misc');
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	const g_betCycleTime = 8000; // 1000 => 1 sec => Every 1 second scan for any new betting opportunity
	let g_betScanRound = 0;
	const g_scanStartTime = new Date();

	const g_BetStakeValue = 0.2;            // ( 0.1 = 1p, 1 = £1) your REAL MONEY !!!!
	const g_todayTotalBetAmountLimit = 15.0; // 10 => £10 = max Limit for today = SUM of all bet stakes
	let   g_sumOfAlreadyPlacedBetAmount = 0; 
	let   g_userBalance = 0.00;
	let   g_moneyStatus = {};
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	let g_sessionToken = null;
	let g_db = {};
	g_db.sportId = {};
	let g_eventInfoList = {};

	let g_alreadyPlacedBetList = {};			// client report data
	let g_allPredictedWinnerBetList = {};		// client report data
	let g_currentPredictedWinnerBetList = {};	// client report data

	let g_lastCycleElapsedTime = 0;
	let g_betNow = [];
	const g_sessionExpireTimeLimit = 5 * 60 * 60 * 1000; // 6 hours but create a new session every 5 hours
	let g_sessionStartTime = 0;
	let g_sportsList = [];
	const g_sportsIdNameMapping = {};
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	

	let g_whichDayEvent = 'today'; // 'today' or 'tomorrow' or "2019-12-24" (ISO specific date)

	// const g_onlyOne_raceName = "Alex De Minaur vs Jannik Sinner"; // test only one race
	// const g_onlyOne_raceName = "14:35 Huntingdon";
	const g_onlyOne_raceName = null; 

	/*
	const sportsName = ['American Football','Athletics','Australian Rules','Baseball','Basketball','Boxing','Cricket','Cross Sport Special',
	'Cross Sport Specials','Current Events','Cycling','Darts','Gaelic Football','Golf','Greyhound Racing','Horse Racing',
	'Horse Racing (Ante Post)','Horse Racing Beta','Hurling','Ice Hockey'];
	*/
	// ['Horse Racing'];  ['ALL']; ['Cricket']; ['Horse Racing','Greyhound Racing', 'Cricket'];
	let g_sportsInterested = ['ALL'];
	// let g_sportsInterested = [
	// 	'Horse Racing', //.
	// 	// 'Soccer', //.
	// 	// 'Greyhound Racing', //.

	// 	// 'American Football',//.
	// 	// 'Basketball', //.
	// 	// "Boxing", //.
	// 	// "Golf", //.

	// 	// 'Ice Hockey', //.
	// 	// 'Rugby Union', //.
	// 	// 'Enhanced Specials', //.
	// 	// 'Snooker', //.

	// 	// "Baseball", //.
	// 	// "Cricket", //.
	// 	// "Motor Sport", //.
	// 	// "Tennis", //.

	// 	// "Volleyball",
	// 	// "Chess",
	// 	// "Cycling",
	// 	// "Rugby League",
	// 	// "Table Tennis",
	// ];

	//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
	//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
	//$$$$$$$$$$$$$$$// WARNING !!!! ( false => places the real money bet) //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
	
	const g_isLockedForBetting = false; // false => REAL MONEY
	
	//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
	//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

	if(g_isLockedForBetting)
	{
		// g_betMinutesOffset = 600; //(600 = 10hrs before) place bet: +1 min before the start time, -5 min after the start time
		// g_minWinConfidencePercentage = 1; // ex: 100 => (100% or more)
		// g_minProfitOdd = 0.1; // ex: 1 (1/1 = 1 even odd [or] 2.00 in decimal)
		// g_whichDayEvent = '2021-12-26'; // 'today' or 'tomorrow' or "2019-12-24" (ISO specific date)
	}
	/////////////////////////////////////////// socket.io //////////////////////////////////////////////////////////////////

	// Client request for a new connection
	io.on('connection', async (socket) => {
		CONNECTIONS.print("must",'Server: A new client with socket-id: ${socket.id} is connected to me !'); // socket.id => can be used as UNIQUE id for finding the client 

		// when client(browser) closed/disconnect from the server
		socket.on('disconnect', function() {
			CONNECTIONS.print("must",'A Client has closed / disconnected from the Server !');
		});

		// [Client => Server] Receive data from client to server
		socket.on('CLIENT_TO_SERVER_GIVE_ALL_PREDICTION_EVENT', async (data) => {
			const obj = JSON.parse(data);
			CONNECTIONS.print("must",obj); // client msg

			CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_ALL_PREDICTED_WINNERS_EVENT', JSON.stringify(g_allPredictedWinnerBetList)); // notify the client
		});

		// [Client => Server] Receive data from client to server
		socket.on('CLIENT_TO_SERVER_GIVE_CURRENT_PREDICTION_EVENT', async (data) => {
			const obj = JSON.parse(data);
			CONNECTIONS.print("must",obj); // client msg

			CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_CURRENT_PREDICTED_WINNERS_EVENT', JSON.stringify(g_currentPredictedWinnerBetList)); // notify the client
		});

		// [Client => Server] Receive data from client to server
		socket.on('CLIENT_TO_SERVER_GIVE_ALREADY_PLACED_BETS_EVENT', async (data) => {
			const obj = JSON.parse(data);
			CONNECTIONS.print("must",obj); // client msg

			CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_ALREADY_PLACED_BETS_EVENT', JSON.stringify(g_alreadyPlacedBetList)); // notify the client
		});
	});
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	callbackCount = function(currentCount , totalCount) {
		this.currentCount = currentCount || 0;
		this.totalCount = totalCount || 0;
	};

	isAlreadyBetPlacedEvent = function(eventId) {
		// if(g_onlyOne_raceName) return false; // NEVER do it !!! places duplicate bets

		for (let sport in g_allPredictedWinnerBetList) {
			if (g_allPredictedWinnerBetList.hasOwnProperty(sport)) {
				for(let count  = 0; count < g_allPredictedWinnerBetList[sport].length; ++count) {
					if("event-id" in  g_allPredictedWinnerBetList[sport][count]) {
						if(g_allPredictedWinnerBetList[sport][count]["event-id"] === eventId) 
							return true;
					}
				}
			}
		}

		return false;
	};

	isWinningHorse = (sportName, winPercentage, profitOdd, runnersCount) => {
		const wc = WC.getSportsWinningConstants(sportName, g_isLockedForBetting);
		// max
		if((winPercentage > wc.g_maxWinConfidencePercentage) && (profitOdd > wc.g_minProfitOdd))
		{
			return true;
		}
		// min
		// else if((winPercentage > wc.g_minWinConfidencePercentage) && (profitOdd > wc.g_minProfitOdd))
		// {
		// 	return true;
		// }
		else if((winPercentage > wc.g_minWinConfidencePercentage) && (profitOdd > wc.g_minProfitOdd) && runnersCount <= wc.g_maxRunnersCount)
		{
			return true;
		}

		return false;
	};


	isCorrectBetTime = (eventObj) => {
		const currentTime    = new Date();
		const eventStartTime = new Date(eventObj.startTime);
		const realStartTime  = eventObj["realStartTime"];
		const inRunningFlag  = eventObj["in-running-flag"];
		const sportName      = eventObj["sportName"];


		let raceRunningTime = 0;
		// let raceLength = 0;
		// if(sportName === "Horse Racing") {
		// 	raceLength = UTIL.convertMfyToYards(eventObj["race-length"]); // "3m 4f 200y" => 6360 yards
		// 	raceRunningTime = UTIL.calculateRaceRunningTime(sportName, raceLength); // seconds
		// }

		const wc = WC.getSportsWinningConstants(sportName, g_isLockedForBetting);

		// check same date (Ignore any time difference) or not ?
		if(UTIL.isSameDate(currentTime, eventStartTime))
		{
			// Do NOT check the time if the WIN confidence exceeds the max value and the profit expected
			if((eventObj.winPercentage > wc.g_maxWinConfidencePercentage) && (eventObj.profitOdd > wc.g_minProfitOdd))
			{
				return true;
			}
			// Dog race - A very quick race so do NOT wait for the real start time. Go with the event start time
			else if(wc["ignore_realStartTime"] && currentTime > (eventStartTime - (wc.g_betMinutesOffset * 60 * 1000)))
			{
				return true;
			}
			// Horse race - Place bet at a correct time depends up on the race length and horse speed.
			else if(wc.autoBetAtBestWinningTime && inRunningFlag && realStartTime) {
				// if(currentTime > realStartTime + 60 * 1000) {   // 1 min after game start
				if(currentTime > realStartTime + Math.round(raceRunningTime * 50 / 100 * 1000)) {   // At 75% time of total running time
					return true;
				}
			}
			// After the race started
			else if(wc.g_betMinutesOffset <= 0 && inRunningFlag && realStartTime) {
				// wc.g_betMinutesOffset = -5; // place bet: +1 min before the start time, -5 min after the start time
				if(currentTime > (realStartTime - (wc.g_betMinutesOffset * 60 * 1000))) {
					return true;
				}
			}
			// Before the race starts
			else if(wc.g_betMinutesOffset > 0 && currentTime > (eventStartTime - (wc.g_betMinutesOffset * 60 * 1000))) {
				return true; ///////////////
			}
			// wc.g_betMinutesOffset = -2; // place bet: +1 min before the start time, -5 min after the start time
			// else if(currentTime.getTime() > (eventStartTime.getTime() - (wc.g_betMinutesOffset * 60 * 1000)))
			// {
			// 	return true;
			// }

			/*
			// in-running-flag
			wc.g_betMinutesOffset = -2; // place bet: +1 min before the start time, -5 min after the start time
			if(currentTime.getTime() > (eventStartTime.getTime() - (wc.g_betMinutesOffset * 60 * 1000)))
			{
				return true;
			}
			*/
		}

		return false;
	};

	populateEventData = function(jsonFormat, callback, extraArgs) {

		// extraArgs = { obj, destObj, keys, filterDay, closureSave, sports_cbCount }
		
		if (jsonFormat[extraArgs.obj] && Object.keys(jsonFormat[extraArgs.obj]).length) {
			// not empty
			g_db.sportId[extraArgs.closureSave][extraArgs.obj] = {};

			for(let key in jsonFormat[extraArgs.obj])
			{
				if( jsonFormat[extraArgs.obj].hasOwnProperty(key))
				{
					key = Number(key);
					const index = extraArgs.keys.indexOf("start");
					let dateString = jsonFormat[extraArgs.obj][key][extraArgs.keys[index]]; // "start": "2019-03-01T16:10:00.000Z"
					let dateObject = new Date(dateString);
					let currentDate = new Date();

					const indexInRunningFlag = extraArgs.keys.indexOf("in-running-flag");
					if(!UTIL.isSameDate(dateObject, currentDate) && indexInRunningFlag !== -1 && jsonFormat[extraArgs.obj][key][extraArgs.keys[indexInRunningFlag]])
					{
						// sports like "Golf" takes more than one day so fetch the event details as per the "in-running-flag"
						// instead of today's or tomorrow's date
						console.log(`MORE THAN A DAY LONG EVENT. EVENT(${jsonFormat[extraArgs.obj][key].name}) START ON: ${jsonFormat[extraArgs.obj][key][extraArgs.keys[index]]}`);
					}
					else if(index !== -1)
					{
						if(extraArgs.filterDay === 'today')
						{
							// Thu Feb 28 2019 22:04:39 GMT+0000
							currentDate = new Date();
						}
						else if(extraArgs.filterDay === 'tomorrow')
						{
							// Fri Mar 01 2019 00:04:39 GMT+0000
							let today = new Date();
							let tomorrow = new Date();
							currentDate = new Date(tomorrow.setDate(today.getDate()+1)); // next day
						}
						else if(new Date(extraArgs.filterDay).getDate() === new Date(dateString).getDate())
						{
							// some specific date
							currentDate = new Date(extraArgs.filterDay);
						}

						if(!UTIL.isSameDate(dateObject, currentDate))
						{
							// CONNECTIONS.print("ignore",'SKIP: ' + dateObject + ' !== ' + currentDate);
							continue; // skip
						}
					}

					const name = jsonFormat[extraArgs.obj][key][extraArgs.destObj];
					g_db.sportId[extraArgs.closureSave][extraArgs.obj][name] = {};
					let value = null;
					let eventId = jsonFormat[extraArgs.obj][key].id;

					if(!g_eventInfoList[eventId]) {
								g_eventInfoList[eventId] = {
																"event-id"          : eventId,
																"sports-name"       : extraArgs.closureSave,
																"event-name"        : name,
																"event-start-time"  : dateString,
																"realStartTime"     : 0
															};
					}

					for(let i = 0; i < extraArgs.keys.length; ++i)
					{
						value = jsonFormat[extraArgs.obj][key][extraArgs.keys[i]];
						if(value || value == 0) {
							g_db.sportId[extraArgs.closureSave][extraArgs.obj][name][extraArgs.keys[i]] = value;

							// Estimate event real start time
							if(extraArgs.keys[i] === "in-running-flag") {
								if(!value)
									g_db.sportId[extraArgs.closureSave][extraArgs.obj][name]["realStartTime"] = 0;
								else if(value && !g_eventInfoList[eventId]["realStartTime"]) {
									g_eventInfoList[eventId]["realStartTime"] = new Date();
									g_db.sportId[extraArgs.closureSave][extraArgs.obj][name]["realStartTime"] = g_eventInfoList[eventId]["realStartTime"];
								}
								else if(value && g_eventInfoList[eventId]["realStartTime"]) {
									g_db.sportId[extraArgs.closureSave][extraArgs.obj][name]["realStartTime"] = g_eventInfoList[eventId]["realStartTime"];
								}
								// else if(value && !g_db.sportId[extraArgs.closureSave][extraArgs.obj][name]["realStartTime"])
								// 	g_db.sportId[extraArgs.closureSave][extraArgs.obj][name]["realStartTime"] = new Date();
							}
							// if(extraArgs.keys[i] === "in-running-flag" && value && !g_db.sportId[extraArgs.closureSave][extraArgs.obj][name]["realStartTime"]) {
							// 	g_db.sportId[extraArgs.closureSave][extraArgs.obj][name]["realStartTime"] = new Date();
							// }
						}
					}
				}
			}
		}

		return callback(null, extraArgs.sports_cbCount, extraArgs.closureSave);
	};

	requestResponse = async function(options, obj, destObj, keys, filterDay, closureSave, sports_cbCount, callback) {

		/////////////// Wait for before giving a new Http request //////////////////////////////////////////////////////
		const result = await TIMER.awaitForMaxReqTimeSlot("EVENTS");
		CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		request(options, function (error, response, body) {
			if (error) {
				return callback(error, sports_cbCount, null);
			}

			const jsonData = JSON.parse(body);

			morePages(options, jsonData.total, populateEventData, callback, { obj, destObj, keys, filterDay, closureSave, sports_cbCount });

		});
	};

	// Get Sports
	// Get the list of sports supported by Matchbook
	getSports = async function (callback) {
		const options = UTIL.getDefaultOptions();
		options.url = 'https://api.matchbook.com/edge/rest/lookups/sports';
		options.qs = { offset: '0', 'per-page': '20', order: 'name asc', status: 'active' };

		// Cookie data for maintaining the session
		options.headers['session-token'] = g_sessionToken;

		/////////////// Wait for before giving a new Http request //////////////////////////////////////////////////////
		const result = await TIMER.awaitForMaxReqTimeSlot("EVENTS");
		CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		request(options, function (error, response, body) {
			if (error) {
				return callback(error,null);
			}

			const jsonData = JSON.parse(body);

			morePages(options, jsonData.total, populateSportIds, callback);
		});
	};

	populateSportIds = function(jsonData, callback) {
		let sportsName = null;
		g_sportsList = [];

		for(let sport in jsonData['sports'])
		{
			if(jsonData['sports'].hasOwnProperty(sport))
			{
				sport = Number(sport);
				sportsName = jsonData['sports'][sport].name;
				g_sportsList.push(sportsName);
				g_db.sportId[jsonData['sports'][sport].name] = {};

				// Mappings 
				// (sports name => sports id )      "Horse Racing" => 24735152712200
				g_db.sportId[jsonData['sports'][sport].name].id = jsonData['sports'][sport].id;

				// (sports id => sports name )      24735152712200 => "Horse Racing"
				g_sportsIdNameMapping[jsonData['sports'][sport].id] = jsonData['sports'][sport].name;
			}
		}

		FA.writeJsonFile(g_db,'./data/availableSports.json', true);
		return callback(null);
	};

	// Get Sports Name by Sports Id
	getSportsNameBySportsId = function(sportsId) {
		return g_sportsIdNameMapping[sportsId];
	};

	// Get Sports Id by Sports Name
	getSportsIdBySportsName = function(sportsName) {
		return g_db.sportId[sportsName].id;
	};

	// Return Sports Name, Event Start Time, Players List 
	getEventDetailsByEventId = function(sportsId, eventId) {

		const sportsName = getSportsNameBySportsId(sportsId);

		const eventCollection = g_db["sportId"][sportsName]["events"];

		for (let eventObj in eventCollection) {
			if (eventCollection.hasOwnProperty(eventObj) && eventCollection[eventObj].id === eventId) {
				CONNECTIONS.print("must",eventObj);         // key
				CONNECTIONS.print("must",eventCollection[eventObj]); // value
				return eventCollection[eventObj];
			}
		}
	};

	// Get the full data from all pages (default: 20 pages)
	morePages = async function(options, perPage, updateMethod, callback, extraArgs) {

		options.qs['per-page'] = perPage;

		/////////////// Wait for before giving a new Http request //////////////////////////////////////////////////////
		const result = await TIMER.awaitForMaxReqTimeSlot("EVENTS");
		CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		request(options, function (error, response, body) {
			if (error) {
				return callback(error,null);
			}

			const jsonData = JSON.parse(body);

			updateMethod(jsonData, callback, extraArgs);
		});
	};

	// Get Events
	// Get a list of events available on Matchbook ordered by start time.
	getEvents = function (sport, sports_cbCount, callback) {
		const sportId = g_db.sportId[sport];
		const options = UTIL.getDefaultOptions();
		options.url = 'https://api.matchbook.com/edge/rest/events';
		options.qs = {
			'offset': '0',
			'per-page': '20',
			// 'states': 'open,suspended,closed,graded',
			'states': 'open',
			'exchange-type': 'back-lay',
			'odds-type': 'DECIMAL',
			'include-prices': 'false',
			'price-depth': '3',
			'price-mode': 'expanded',
			'minimum-liquidity': '10',
			'include-event-participants': 'false'
		};

		if(sportId)
		{
			//options.qs['sport-ids'] = ids;
			//options.qs['ids'] = ids;
			options.url = 'https://api.matchbook.com/edge/rest/events?sport-ids=' + sportId.id;
		}

		// Cookie data for maintaining the session
		options.headers['session-token'] = g_sessionToken;

		const keysToFetch = ["id", "start", "status", "in-running-flag", "race-length"];

		// closure needed for storing the sport name ????
		requestResponse(options, 'events', 'name', keysToFetch, g_whichDayEvent, sport, sports_cbCount, callback);
	};

	// Get Event
	getEvent = async function (event_id, callback) {
		const options = UTIL.getDefaultOptions();
		options.qs = {
			'exchange-type': 'back-lay',
			'odds-type': 'DECIMAL',
			'include-prices': 'false',
			'price-depth': '3',
			'price-mode': 'expanded',
			'minimum-liquidity': '10',
			'include-event-participants': 'false'
		};

		// event id
		options.url = 'https://api.matchbook.com/edge/rest/events/'+event_id;

		// Cookie data for maintaining the session
		options.headers['session-token'] = g_sessionToken;

		// CONNECTIONS.print("ignore",options);

		/////////////// Wait for before giving a new Http request //////////////////////////////////////////////////////
		const result = await TIMER.awaitForMaxReqTimeSlot("EVENTS");
		CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		request(options, function (error, response, body) {
			if (error) {
				if (error.code === "ECONNRESET") {
					CONNECTIONS.print("must", "Timeout occurred in getEvent() - Trying again !!!");
					return;
				}
				else throw new Error(error);
			}

			const jsonFormat = JSON.parse(body);
			// jsonFormat.in-running-flag: false
			// jsonFormat.race-length: "0m 7f 14y"

			// const runnersObj = {};
			const marketObj = {};

			if(jsonFormat.markets && jsonFormat.markets.length)
			//if(jsonFormat.markets.length && (jsonFormat.markets[0].name === 'WIN' || jsonFormat.markets[0].name === 'Winner'))
			{
				for(market in jsonFormat.markets)
				{
					let runners = jsonFormat.markets[market].runners;
					const runnersObj = {};

					for(let runner in runners)
					{
						if(runners.hasOwnProperty(runner))
						{
							runner = Number(runner);
							
							runnersObj[runners[runner].name] = {};
							// Same HORSE will have different runner-id on different markets. So "Runner-id" is unique.
							// HORSE - "8 Lassue" - Runner-id => 1982738798240051  (WIN market)
							// HORSE - "8 Lassue" - Runner-id => 2082738798510051  (Place(2 market))
							runnersObj[runners[runner].name].runnerId = runners[runner].id;
							runnersObj[runners[runner].name].withdrawn = runners[runner].withdrawn; // true => NON-RUNNER
	
							const back = [];
							const lay = [];
							for(let price in runners[runner]['prices'])
							{
								if(runners[runner]['prices'].hasOwnProperty(price))
								{
									if(runners[runner]['prices'][price]['side'] === "back")
									{
										back.push(Number(runners[runner]['prices'][price].odds));
									}
									else if(runners[runner]['prices'][price]['side'] === "lay")
									{
										lay.push(Number(runners[runner]['prices'][price].odds));
									}
								}
							}
	
							runnersObj[runners[runner].name].back = back.length ? Math.max.apply(null, back): 0;
							runnersObj[runners[runner].name].lay  =  lay.length ? Math.min.apply(null, lay): 0;
						}
					}

					marketObj[jsonFormat.markets[market].name] = {};
					marketObj[jsonFormat.markets[market].name]["market-id"] = jsonFormat.markets[market]["id"]; // Market id
					marketObj[jsonFormat.markets[market].name]["allRunners"] = runnersObj;
					marketObj[jsonFormat.markets[market].name]["number-of-winners"] = jsonFormat.markets[market]["number-of-winners"];
				}
			}

			callback(marketObj); // return the object from the callback function 
		});
	};

	// {
	// 	"id": 24735152712200,
	// 	"events": {
	// 	  "16:30 Wincanton": {
	// 		"5 Tikkapick": {
	// 		  "runnerId": 1052216604020016,
	// 		  "back": 2.42,
	// 		  "lay": 2.44
	// 		},

	luckyMatchFilter = function(sportName, jsonObj, objLevelFilter, callback) {
		let predictedWinners = []; 
		for(let prop in jsonObj) {
			if(jsonObj.hasOwnProperty(prop)) {
				if(prop === objLevelFilter) { // events: { }
					for(let race in jsonObj[prop]) { 
						if(jsonObj[prop].hasOwnProperty(race)) { // 15:05 Sandown
							const raceId = jsonObj[prop][race].id;

							// Check if already a successful bet has been placed on that event
							if(!isAlreadyBetPlacedEvent(raceId))
							{
								const startTime = jsonObj[prop][race].start;
								const raceName = race;

								for(let market in jsonObj[prop][race]["markets"]) 
								{
									const luckyRunner = [];
									let nonRunnerCount = 0;
									let nPlayerHasValidOdd  = 0;

									for(let runner in jsonObj[prop][race]["markets"][market]["allRunners"]) { 
										if(jsonObj[prop][race]["markets"][market]["allRunners"].hasOwnProperty(runner)) {
											if(typeof jsonObj[prop][race]["markets"][market]["allRunners"][runner] === "object") {
												let runnerObj = jsonObj[prop][race]["markets"][market]["allRunners"][runner];
												runnerObj.name = runner;
												runnerObj['event-name'] = raceName;
												runnerObj['market-name'] = market;
												if(runnerObj.withdrawn)  nonRunnerCount += 1;
												let back = jsonObj[prop][race]["markets"][market]["allRunners"][runner].back;
												++nPlayerHasValidOdd;
												if(!back) {
													back = Number.MAX_VALUE;
													--nPlayerHasValidOdd;
												}
												luckyRunner.push([back, runnerObj]);
											}
										}
									}

		
									luckyRunner.sort(function(a, b) { return a[0] - b[0]; });
									if(luckyRunner.length > 1)
									{
										const halfPlayersCount = Math.ceil((luckyRunner.length - nonRunnerCount) / 2);
										// At least half of the players should have some betting before doing win calculation 
										// (or) At least #16 players have some valid odds.
										if(luckyRunner[halfPlayersCount][0] != Number.MAX_VALUE || nPlayerHasValidOdd > 15) {
											// Calculating the win chance by comparing with very next competitor 
											let winPercentage = UTIL.roundIt2D((luckyRunner[1][0] - luckyRunner[0][0]) * 100 / luckyRunner[0][0]);
											luckyRunner[0][1].numberOfRunners = luckyRunner.length;
											// winPercentage = winPercentage + (5 / luckyRunner.length * 6);
											luckyRunner[0][1].winPercentage = winPercentage;
											luckyRunner[0][1].startTime = startTime;
											luckyRunner[0][1].raceId = raceId;
											luckyRunner[0][1].raceName = raceName;
											let profitOdd = luckyRunner[0][1].back - 1;
										
											// jsonObj[prop][race].luckyWinner = luckyRunner[0][1]; // first element from an array
											jsonObj[prop][race]["markets"][market].luckyWinner = luckyRunner[0][1]; // first element from an array
											// if(!jsonObj[prop][race].luckyWinner) jsonObj[prop][race].luckyWinner = {};
											// jsonObj[prop][race].luckyWinner[market] = luckyRunner[0][1]; // first element from an array

											// console.log(`Sports: ${sportName} #### Event: ${raceName} #### Win(%): ${UTIL.roundIt2D(winPercentage)} #### Odd(${luckyRunner[0][1].name} / ${luckyRunner[1][1].name}): ${luckyRunner[0][0]} / ${luckyRunner[1][0]}`);
											console.log(`${UTIL.formatString(`Sports: (${sportName})`, 28)} #### ${UTIL.formatString(`Event: (${raceName})`, 60)}  #### ${UTIL.formatString(`Win(%): ${UTIL.roundIt2D(winPercentage)}`, 18)} #### Odd(${luckyRunner[0][1].name} / ${luckyRunner[1][1].name}): ${luckyRunner[0][0]} / ${luckyRunner[1][0]}`);
				
											// Build the predictedWinner list
											if(isWinningHorse(sportName, winPercentage, profitOdd, luckyRunner.length))
											{
												let obj = luckyRunner[0][1];
												obj.sportName = sportName;
												obj["winPercentage"] = winPercentage;
												obj["profitOdd"] = profitOdd;
												obj["in-running-flag"] = jsonObj[prop][race]["in-running-flag"];
												obj["status"] = jsonObj[prop][race]["status"];
												obj["realStartTime"] = jsonObj[prop][race]["realStartTime"];
												if(sportName === "Horse Racing") obj["race-length"] = jsonObj[prop][race]["race-length"];
			
												predictedWinners.push(obj);
											}
										}
										else {
											console.log(`WAITING....MORE THAN 1/2 OF THE PLAYERS(${nPlayerHasValidOdd} / ${luckyRunner.length}) ODDS ARE ZERO !!!`);
										}
									}
								}
							}
						}
					}
				}
			}
		}

		g_betNow = findHotBets(predictedWinners);
		return callback(null, g_betNow);
	};

	findLuckyMatch = async (sportName, jsonObj, objLevelFilter, callback) => {

		if(UTIL.isNullObject(g_allPredictedWinnerBetList)) {
			if(await FA.isFileExist('./data-Report/alreadyPlacedBetList.json'))
			{
				g_alreadyPlacedBetList = await FA.readJsonFile('./data-Report/alreadyPlacedBetList.json');

				g_allPredictedWinnerBetList = JSON.parse(JSON.stringify(g_alreadyPlacedBetList)); // deep object clone
			}
		}

		luckyMatchFilter(sportName, jsonObj, objLevelFilter, callback);
	};
	

	findHotBets = function(predictedWinners) {
		g_betNow = [];
		const todayDateString = new Date().toDateString();

		for(let i = 0; i < predictedWinners.length; ++i) {
			let obj = predictedWinners[i];
			let startTime = new Date(obj.startTime);

			// if(isCorrectBetTime(startTime, obj["realStartTime"], obj["in-running-flag"], obj.sportName))
			if(isCorrectBetTime(obj))
			{
				let betObj = {};

				let fractionNumber = 0;
				fractionNumber = predictedWinners[i].back;
				let numberBeforeDecimalPoint  = Math.floor(fractionNumber); // 2.13453 => 2
				let numberAfterDecimalPoint = (fractionNumber % 1).toFixed(2); // 2.13453 => 0.13
				let roundToNearestDecimalTen = (Math.ceil((((numberAfterDecimalPoint) * 100)+1)/10)*10)/100; // 0.13 = 0.20
				let roundedOdd = numberBeforeDecimalPoint + roundToNearestDecimalTen; // 2.13453 => 2.20

				// betObj.odds = predictedWinners[i].back;
				betObj.odds = roundedOdd; // for reducing the commission charge

				betObj['runner-id'] = predictedWinners[i].runnerId; // ALWAYS UNIQUE regardless of sports/market within the sports
				betObj['event-start-time'] = predictedWinners[i].startTime;
				betObj['sportName'] = predictedWinners[i].sportName;
				betObj['sport-id'] = g_db.sportId[predictedWinners[i].sportName].id;
				betObj['market-name'] = predictedWinners[i]['market-name'];
				betObj['winPercentage'] = predictedWinners[i].winPercentage;
				betObj.side = 'back';
				betObj.stake = g_BetStakeValue; // your MONEY !!!! (1.0)

				// 'market'

				if(g_isLockedForBetting)
				{
					// mock bet
					betObj['status'] = 'matched';
					betObj['event-id'] = predictedWinners[i].raceId;
					betObj['event-name'] =  predictedWinners[i].raceName;

					betObj['runner-name'] = predictedWinners[i].name;
					betObj['decimal-odds'] = betObj.odds;
					betObj['stake'] = g_BetStakeValue;

					g_betNow.push(betObj);
				}
				else if(g_userBalance >= g_BetStakeValue && UTIL.roundIt2D(g_todayTotalBetAmountLimit - g_sumOfAlreadyPlacedBetAmount) >= g_BetStakeValue) {
					// real bet
					g_betNow.push(betObj);

					g_userBalance = UTIL.roundIt2D(g_userBalance - g_BetStakeValue);
					g_sumOfAlreadyPlacedBetAmount = UTIL.roundIt2D(g_sumOfAlreadyPlacedBetAmount + g_BetStakeValue);

					if(!g_moneyStatus[todayDateString] || g_moneyStatus[todayDateString] && g_moneyStatus[todayDateString].date != todayDateString) {
						g_moneyStatus[todayDateString] = {};
						g_moneyStatus[todayDateString].startingBalance = UTIL.roundIt2D(g_userBalance + g_BetStakeValue);
						g_moneyStatus[todayDateString].todayTotalBetAmountLimit = g_todayTotalBetAmountLimit;
						g_moneyStatus[todayDateString].date = todayDateString;
					}
					g_moneyStatus[todayDateString].currentBalance = g_userBalance;
					g_moneyStatus[todayDateString].sumOfAlreadyPlacedBetAmount = g_sumOfAlreadyPlacedBetAmount;
					g_moneyStatus[todayDateString].totalPlacedBets = Math.round(g_sumOfAlreadyPlacedBetAmount / g_BetStakeValue); 
					g_moneyStatus[todayDateString].profit = UTIL.roundIt2D(g_userBalance - g_moneyStatus[todayDateString].startingBalance);
				}
				else if(g_userBalance < g_BetStakeValue) {
					CONNECTIONS.print("logClient","User Balance is VERY LOW !!!!");
				}
				else if(UTIL.roundIt2D(g_todayTotalBetAmountLimit - g_sumOfAlreadyPlacedBetAmount) < g_BetStakeValue) {
					CONNECTIONS.print("logClient",`Reached your today's bet limit: ${g_sumOfAlreadyPlacedBetAmount} / ${g_todayTotalBetAmountLimit} => No more bets allowed !!!!`);
				}
			}
		}
		return g_betNow;
	};

	// Submit Offers
	// Submit one or more offers i.e. your intention or willingness to have bets with other users.
	submitOffers = async function (callback) {
		// "16:30 Wincanton": {
		// 	"5 Tikkapick": {
		// 	  "runnerId": 1052216604020016,
		// 	  "back": 2.40,
		// 	  "lay": 2.64
		// 	},

		// var luckyBet = {
		// 	"odds-type":"DECIMAL",
		// 	"exchange-type":"back-lay",
		// 	"offers":
		// 	  [{
		// 		  "runner-id":1052216604020016,                  <============== UNIQUE across the whole sportsBook
		// 		  "side":"back",
		// 		  "odds": 2.4,
		// 		  "stake": 0.0
		// 	  }
		//   ]};

		// "{"odds-type":"DECIMAL","exchange-type":"back-lay","offers":[{"runner-id":1076420113760015,"odds":1.34482,"side":"back","stake":1}]}"

		let luckyBet = { "odds-type":"DECIMAL", "exchange-type":"back-lay" };
			luckyBet.offers = g_betNow; // list of bets

		let options = UTIL.getDefaultOptions();
		options.method = 'POST';
		options.url = 'https://api.matchbook.com/edge/rest/v2/offers';
		// Cookie data for maintaining the session
		options.headers['session-token'] = g_sessionToken;
		// options.json = JSON.stringify(luckyBet); // Bet info
		// options.body = JSON.stringify(luckyBet); // Bet info
		options.json = luckyBet; // Bet info

		if(luckyBet.offers.length) {
			if(!g_isLockedForBetting) {
				/////////////// Wait for before giving a new Http request //////////////////////////////////////////////
				const result = await TIMER.awaitForMaxReqTimeSlot("BETTING_WRITE");
				CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
				////////////////////////////////////////////////////////////////////////////////////////////////////////
				request(options, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						//CONNECTIONS.print("ignore",response);
						return callback(null, response);
					}
					else {
						CONNECTIONS.print("must",response.statusCode + " Error in bet placed");

						if(response.body.offers) {
							for(let count = 0; count < response.body.offers.length; ++count) {
								CONNECTIONS.print("must",response.body.offers[count].errors);
							}
						}

						return callback(error,null);
					}
				});
			}
			else
			{
				// mock bet placed
				//CONNECTIONS.print("ignore",response);
				for(let i = 0; i < g_betNow.length; ++i) {
					let lastBetResult = g_betNow[i];
					let obj = populateDataAfterBetSubmit(lastBetResult, false);
					CONNECTIONS.print("must",obj);

					// ??????
					// getEventDetailsByEventId(getSportsIdBySportsName(g_betNow[i].sportName), g_betNow[i]['event-id']);
				}
				CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_ALL_PREDICTED_WINNERS_EVENT', JSON.stringify(g_allPredictedWinnerBetList)); // notify the client
				CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_CURRENT_PREDICTED_WINNERS_EVENT', JSON.stringify(g_currentPredictedWinnerBetList)); // notify the client
				FA.writeJsonFile(g_allPredictedWinnerBetList,'./data-Report/mockSuccessfulBets.json');
			}
		}
	};

	callback_submitOffers = function(err, response) {
		if(err) {
			CONNECTIONS.print("must",err);
		}
		else {
			// CONNECTIONS.print("ignore",response);
			const nSubmittedBets = response.body.offers.length;
			for(let i = 0; i < nSubmittedBets; ++i) {
				let lastBetResult = response.body.offers[i];
				if(lastBetResult.status === 'matched' || lastBetResult.status === 'open') {
					let obj = populateDataAfterBetSubmit(lastBetResult, true);
					CONNECTIONS.print("must",obj);
				}
			}

			FA.writeJsonFile(g_alreadyPlacedBetList,'./data-Report/alreadyPlacedBetList.json');
			FA.writeJsonFile(g_allPredictedWinnerBetList,'./data-Report/mockSuccessfulBets.json');
			FA.writeJsonFile(g_moneyStatus,'./data-Report/money.json');

			CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_ALREADY_PLACED_BETS_EVENT', JSON.stringify(g_alreadyPlacedBetList)); // notify the client
			CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_ALL_PREDICTED_WINNERS_EVENT', JSON.stringify(g_allPredictedWinnerBetList)); // notify the client
			CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_CURRENT_PREDICTED_WINNERS_EVENT', JSON.stringify(g_currentPredictedWinnerBetList)); // notify the client
		}
	};


	populateDataAfterBetSubmit = function(lastBetResult, isRealBet) {
		// if(isRealBet) {
		// 	lastBetResult["runner-id"]
		// }
		// betObj['runner-id'] = predictedWinners[i].runnerId;
		// betObj['winPercentage'] = predictedWinners[i].runnerId;
		// g_db["sportId"][sportName]["events"][eventName]["markets"]["WIN"]
		// g_db["sportId"][getSportsNameBySportsId(lastBetResult['sport-id'])]["events"][lastBetResult['event-name']],
		// g_db["sportId"][getSportsNameBySportsId(lastBetResult['sport-id'])]["events"][lastBetResult['event-name']]["metaData"],


		const sportName   = getSportsNameBySportsId(lastBetResult['sport-id'])
		const eventName   = lastBetResult['event-name'];
		const market      = lastBetResult['market-name'];
		const runnerId    = lastBetResult['runner-id'];
		const luckyWinner = g_db["sportId"][sportName]["events"][eventName]["markets"][market].luckyWinner;

		if(runnerId === luckyWinner.runnerId) {
			lastBetResult['winPercentage'] = luckyWinner.winPercentage;
			lastBetResult['profitOdd'] = luckyWinner.profitOdd;
			if(!luckyWinner["race-length"]) lastBetResult['race-length'] = luckyWinner['race-length'];
		}


		let obj = 	{
			// DIRECT: data available DIRECTLY from the AFTER bet submission response
			"status":lastBetResult['status'],
			"sport-id":lastBetResult['sport-id'],
			"sport-name": sportName,
			"event-id":lastBetResult['event-id'],
			"event-name":eventName,
			"market":lastBetResult['market-name'],
			"runner-name":lastBetResult['runner-name'],
			"decimal-odds":lastBetResult['decimal-odds'],
			"stake": lastBetResult['stake'],
			"runner-id": lastBetResult['runner-id'],



			// INDIRECT: Get the data from global object w.r.t unique "runner-id" from the AFTER bet submission response

			"winPercentage":lastBetResult['winPercentage'],

			// g_db["sportId"][sportsName]["events"][eventName]
			"event-full-details": g_db["sportId"][sportName]["events"][eventName],
			// "metaData": lastBetResult['metaData'], // g_db["sportId"]["metaData"],
			"metaData": g_db["sportId"][sportName]["events"][eventName]["metaData"],
			// "event-start-time": new Date(lastBetResult['event-start-time']).toLocaleString('en-GB', { timeZone: 'Europe/London' }),
			"event-start-time": new Date(g_db["sportId"][sportName]["events"][eventName]["start"]).toLocaleString('en-GB', { timeZone: 'Europe/London' }),
			
			"bet-placed-time": TIMER.getCurrentTimeDate() 
		};

		if(isRealBet)
		{
			if(!g_alreadyPlacedBetList[obj["sport-name"]]) g_alreadyPlacedBetList[obj["sport-name"]] = [];
			g_alreadyPlacedBetList[obj["sport-name"]].push(obj); // Update "already bet placed" global object
		}
		else
		{
			if(!g_currentPredictedWinnerBetList[obj["sport-name"]]) g_currentPredictedWinnerBetList[obj["sport-name"]] = [];
			g_currentPredictedWinnerBetList[obj["sport-name"]].push(obj); // Update "already bet placed" global object
		}

		if(!g_allPredictedWinnerBetList[obj["sport-name"]]) g_allPredictedWinnerBetList[obj["sport-name"]] = [];
		g_allPredictedWinnerBetList[obj["sport-name"]].push(obj); // Update "already bet placed" global object

		return obj;
	};

	// Get meta data for each event
	getEventMetaData = (sportName, eventInfoObj) => {
		const wc = WC.getSportsWinningConstants(sportName, g_isLockedForBetting);
		// meta data
		const metaData = {
			"stakeValue"                   : wc.g_BetStakeValue,
			"minWinConfidencePercentage"   : wc.g_minWinConfidencePercentage,
			"maxWinConfidencePercentage"   : wc.g_maxWinConfidencePercentage,
			"minProfitOdd"                 : wc.g_minProfitOdd,

			"todayTotalBetAmountLimit"     : g_todayTotalBetAmountLimit,
			"sumOfAlreadyPlacedBetAmount"  : g_sumOfAlreadyPlacedBetAmount,
			"currentBalance"               : g_userBalance,
			"eventInfoObj"                 : eventInfoObj
		};

		return metaData;
	};


	getEventInfo = function(sportName, event, eventInfoObj, sports_cbCount, events_cbCount, callback) {
		getEvent(eventInfoObj.id, function(marketObj) {
			// CONNECTIONS.print("ignore",marketObj);

			const eventInfoObjClone = { ...eventInfoObj }; // 1 level shallow clone. Note: "eventInfoObj" will be modified on next line.
			// g_db.sportId[sportName].events[event].metaData = getEventMetaData(sportName, eventInfoObj); // TypeError: Converting circular structure to JSON 
			g_db.sportId[sportName].events[event].metaData = getEventMetaData(sportName, eventInfoObjClone);

			// g_db.sportId[sportName].events[event].allRunners = marketObj;  // "eventInfoObj" modified here
			g_db.sportId[sportName].events[event].markets = marketObj;        // "eventInfoObj" modified here
			g_db.sportId[sportName].events[event].id = eventInfoObj.id;       // event id
			g_db.sportId[sportName].events[event].start = eventInfoObj.start; // event start time


			++events_cbCount.currentCount;
			if(events_cbCount.currentCount === events_cbCount.totalCount)
			{
				// FA.writeJsonFile(g_db.sportId[sportName], `./data/availableEventList_${sportName}.json`);
				FA.writeJsonFile(g_db.sportId[sportName], `./data/availableEventList_ALL_Sports.json`);

				findLuckyMatch(sportName, g_db.sportId[sportName], "events", function(err, data) {
						if(err){
							CONNECTIONS.print("must",err);
							throw new Error(err);
						}
						else{
							if(data) {
								return callback(null, sportName, sports_cbCount, event, events_cbCount, true);
							}
						}
					});
			}
			return callback(null, sportName, sports_cbCount, event, events_cbCount, false);
		});
	};


	callback_getEvents = async function(err, sports_cbCount, sport) {
		if(err) {
			CONNECTIONS.print("must",err);
			CONNECTIONS.print("must","ERROR: TRYING AGAIN BY A NEW REQUEST");

			// run();
			throw new Error(err);
		}
		else {
			if('events' in g_db.sportId[sport]) {
				// 14:00 Newbury, 14:10 Fontwell, 14:20 Ayr, 14:35 Newbury, 14:40 Fairview...... etc
				let races = Object.keys(g_db.sportId[sport].events);
				let events_cbCount = new callbackCount(0, races.length);
				let isOnlyOneRaceExist = false;

				if(races.length) {
					for (const race of races) {
						// input  - event id
						// output - id (player)
						// https://api.matchbook.com/edge/rest/events/1033210398700016

						/////////////// Wait for before giving a new Http request //////////////////////////////////////////////////////
						const result = await TIMER.awaitForMaxReqTimeSlot("EVENTS");
						CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
						////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						// g_onlyOne_raceName === "14:00 Southwell"
						if(!g_onlyOne_raceName || race === g_onlyOne_raceName) {
							if(race === g_onlyOne_raceName) {
								events_cbCount.totalCount = 1; // Taking only one race event for testing
								isOnlyOneRaceExist = true;
							}

							let logMsg = `Sports: ${sport} ############## Event Name: ${race}`;
							// CONNECTIONS.print("logClient", logMsg); // detailed sports and event list
							CONNECTIONS.print("extra", logMsg);

							// getEventInfo(sport, race, g_db.sportId[sport].events[race].id, g_db.sportId[sport].events[race].start, 
							// 	sports_cbCount, events_cbCount, callback_getEventInfo);
							getEventInfo(sport, race, g_db.sportId[sport].events[race],	sports_cbCount, events_cbCount, callback_getEventInfo);
						}
					}

					if(g_onlyOne_raceName && !isOnlyOneRaceExist) {
						console.log(`${g_onlyOne_raceName} is NOT exist anymore !!!.`);
						goToNextSports(sport, sports_cbCount, "NOTHING", new callbackCount(0, 0), true);
					}

				}
				else {
					goToNextSports(sport, sports_cbCount, "NOTHING", events_cbCount, true);
				}
			}
			else {
				console.log(`There is NO events available inside the sport (${sport}) !!!.`);
				goToNextSports(sport, sports_cbCount, "NOTHING", new callbackCount(0, 0), true);
			}
		}
	};

	callback_getEventInfo = function(err, sportsName, sports_cbCount, eventName, events_cbCount, isReadyForBetting) {
		if(err) {
			CONNECTIONS.print("must",err);
			throw new Error(err);
		}

		if(isReadyForBetting) {
			submitOffers(callback_submitOffers); // sports wise bet submission not as submitting all sports bet in one go.

			goToNextSports(sportsName, sports_cbCount, eventName, events_cbCount, false);
		}
	};

	goToNextSports = (sportsName, sports_cbCount, eventName, events_cbCount, isEmptyEvent) => {
		++sports_cbCount.currentCount;

		console.log(`${UTIL.formatString(`Events(${eventName})`, 30)} : ${events_cbCount.currentCount.toString().padStart(3, "0")} / ${events_cbCount.totalCount.toString().padStart(3, "0")} #######  ${UTIL.formatString(`Sports(${sportsName})`, 30)}: ${sports_cbCount.currentCount.toString().padStart(2, "0")} / ${sports_cbCount.totalCount.toString().padStart(2, "0")}`);


		if((isEmptyEvent || events_cbCount.totalCount) && events_cbCount.currentCount === events_cbCount.totalCount &&
			sports_cbCount.totalCount && sports_cbCount.currentCount === sports_cbCount.totalCount)
		{
			events_cbCount.currentCount = events_cbCount.totalCount = 0;
			sports_cbCount.currentCount = sports_cbCount.totalCount = 0;

			let currentTime = new Date().getTime();
			remainingTime = currentTime - g_lastCycleElapsedTime;
			remainingTime = (g_betCycleTime - remainingTime) > 0 ? g_betCycleTime - remainingTime : 0;

			setTimeout(function() {
				// Check for session expire timeout
				if(currentTime - new Date(g_sessionStartTime).getTime() > g_sessionExpireTimeLimit) {
					getNewSession();
				}
				else {
					run(); // LOOPS
				}
			}.bind(this), remainingTime);
		}
		else {
			console.log(`${UTIL.formatString(`Events(${eventName})`, 30)} : ${events_cbCount.currentCount.toString().padStart(3, "0")} / ${events_cbCount.totalCount.toString().padStart(3, "0")} #######  ${UTIL.formatString(`Sports(${sportsName})`, 30)}: ${sports_cbCount.currentCount.toString().padStart(2, "0")} / ${sports_cbCount.totalCount.toString().padStart(2, "0")}`);
		}
	};

	// Get Sports Wallet Balance
	// Get the new sports balance for the user currently logged in.
	// This API requires authentication and will return a 401 in case the session expired or no session token is provided.
	getUserBalance = async function () {
		const options = UTIL.getDefaultOptions();
		options.url = 'https://api.matchbook.com/edge/rest/account/balance';
		// Cookie data for maintaining the session
		options.headers['session-token'] = g_sessionToken;

		/////////////// Wait for before giving a new Http request //////////////////////////////////////////////////////
		const result = await TIMER.awaitForMaxReqTimeSlot("ACCOUNT");
		CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		request(options, function (error, response, body) {
			if (error) throw new Error(error);

			const jsonFormat = JSON.parse(body);
			// CONNECTIONS.print("ignore",jsonFormat); // jsonFormat.balance

			// balance: 7.76815
			// exposure: 0.59999
			// free-funds: 7.16816
			// commission-reserve: 0

			// g_userBalance = Math.floor(jsonFormat.balance * 100) / 100;
			g_userBalance = Math.floor(jsonFormat["free-funds"] * 100) / 100;
		});
	};

	// Local record of money transactions
	getMoneyStatusRecord = async () => {
		if(UTIL.isNullObject(g_moneyStatus)) {
			if(await FA.isFileExist('./data-Report/money.json'))
			{
				g_moneyStatus = await FA.readJsonFile('./data-Report/money.json');
	
				const todayDateString = new Date().toDateString();
				if(g_moneyStatus[todayDateString] && g_moneyStatus[todayDateString].date === todayDateString)
				{
					g_sumOfAlreadyPlacedBetAmount = g_moneyStatus[todayDateString].sumOfAlreadyPlacedBetAmount;
				}
			}
		}
	};

	callback_getSports = async function(err, data) {
		if(err) {
			CONNECTIONS.print("must",err);
			throw new Error(err);
		}
		else {
			if(g_sportsInterested.length === 1 && g_sportsInterested[0].toLowerCase() === 'all') {
				g_sportsInterested = g_sportsList;
			}

			let sports_cbCount = new callbackCount(0, g_sportsInterested.length);

			// Calling callback functions inside a loop
			for (const sport of g_sportsInterested) {
				// input  - sports id
				// output - event id
				// https://api.matchbook.com/edge/rest/events?sport-ids=24735152712200
				// getEvents('24735152712200'); // sportsid
				// getEvents(g_db.sportId['Horse Racing'], function(err, data) {

				/////////////// Wait for before giving a new Http request //////////////////////////////////////////////////////
				const result = await TIMER.awaitForMaxReqTimeSlot("EVENTS");
				CONNECTIONS.print("ignore",`${result} of min wait time is finished, ready for giving a next Http request - ${new Date().getTime()}`);
				////////////////////////////////////////////////////////////////////////////////////////////////////////////////

				getEvents(sport, sports_cbCount, callback_getEvents);
			}
		}
	};

	findSportsIds = function() {
		// input  - null
		// output - sports id - {"name":"Horse Racing","id":24735152712200,"type":"SPORT"}
		// https://api.matchbook.com/edge/rest/lookups/sports
		getSports(callback_getSports);
	};

	run = function()
	{
		++g_betScanRound;

		let scanCurrentTime = new Date();

		let elapsedTime = scanCurrentTime - g_lastCycleElapsedTime;
		
		g_lastCycleElapsedTime = scanCurrentTime.getTime();

		let runningTime = TIMER.milliSecondsToHMS(scanCurrentTime - g_scanStartTime);

		// g_betScanRound.toString().padStart(5, "0"); // 1 ==> 00001
		let logMsg = `BetScanRound: ${g_betScanRound.toString().padStart(5, "0")} ## RunningTime: ${runningTime} ## ScanCurrentTime: ${TIMER.getTimeFromDateObj(scanCurrentTime)} ## ScanStartTime: ${TIMER.getTimeFromDateObj(g_scanStartTime)} ## ElapsedTime: ${elapsedTime.toString().padStart(5, "0")}ms (${TIMER.milliSecondsToHMS(elapsedTime)}) ## Date: ${scanCurrentTime.toDateString()}`;
		CONNECTIONS.print("logClient", logMsg);
		if(g_onlyOne_raceName) 	console.log(`############## warning: ONLY ONE RACE EVENT MODE IS ACTIVE: ${g_onlyOne_raceName} ##################`);

		findSportsIds();
	};

	loginCallback = function(err, sessionToken, sessionStartTime) {
		if(err) {
			g_sessionToken = null;
			g_sessionStartTime = 0;
			CONNECTIONS.print("must",err);
		}
		else {
			g_sessionToken = sessionToken;
			g_sessionStartTime = sessionStartTime;

			// findSportsIds(); // execute once because sports id's are constant
			getUserBalance();

			getMoneyStatusRecord();

			run();
		}
	};

	getNewSession = function() {
		DOOR.getLastSession(loginCallback);
	};


	// Entry Function
	(function () {

		if(!g_isLockedForBetting)
		{
			console.log(`
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$            $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ REAL MONEY $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$            $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$			
			`);
		}

		getNewSession();

	})(); // IIF - Main entry (login)

}()); // namespace

/*
	////////////////////////////////////////////////////////////////////////
	// correct
	// (async () => {
	// 	await myTest("one");
	// 	await myTest("two");
	// 	await myTest("three");
	// 	await myTest("four");
	// 	await myTest("five");
	// })();



	// Wrong
	// myTestWrapper("one");
	// myTestWrapper("two");
	// myTestWrapper("three");
	// myTestWrapper("four");
	// myTestWrapper("five");

	// myTest("one").then(myTest("two")).then(myTest("three")).then(myTest("four")).then(myTest("five"));

	////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////
	myTest = async (value) => {
		const result = await TIMER.awaitForMaxReqTimeSlot("EVENTS");
		CONNECTIONS.print("ignore",`sri-after: ${new Date().getTime()}    ${result}`);
	};

	myTestWrapper = async (value) => {
		let result = await myTest(value);
		result = result;
	}

	///////////////////////////////////////////////////////////////////////
*/



/*

Note: 'Sport id' is NOT EQUAL to 'Event id'
	  Sport id is constant(HorseRace = 24735152712200) but Event id changes every day(24thDec Kempton HorseRace = 1942888205470016)
	




mb_get_sports
mb_get_events
mb_get_markets

https://github.com/xanadunf/matchbook


C# Project: https://www.dropbox.com/s/nm32ispvu8jr7hp/BpapiConsoleProject.zip?dl=0

Submit offers:
https://developers.matchbook.com/discuss/5af4eef233a27b0003957a07

Get Events

You can use the Live Betting category or navigation entry to help you with this.
Examples: 
https://www.matchbook.com/edge/rest/events?sport-ids=1&tag-url-names=live-betting&price-depth=0
https://api.matchbook.com/edge/rest/events?sport-ids=8&category-ids=410468520880009
https://api.matchbook.com/edge/rest/events?sport-ids=8&tag-url-names=live-betting
You can get all sport_ids and competitions :
https://api.matchbook.com/edge/rest/navigation


// browserify
npm install -g browserify --save

// Local web server
http-server  -p 8059 -c-1

*/