
window.addEventListener('load', function() {

	let g_runnersStr  = "";
	let g_logMessages = "";
	let g_logMessagesBuffer = ""; 
	const g_logMessageMaxBufferLength = 4000; // string length <= 10,000 

	// enum - constants
	const g_SYMBOL_CONSTANTS = Object.freeze({
		"ALL_PREDICTION_LIST"     :  "ALL_PREDICTION_LIST",
		"CURRENT_PREDICTION_LIST" :  "CURRENT_PREDICTION_LIST",
		"PLACED_BET_LIST"         :  "PLACED_BET_LIST",
		"LOG_MESSAGES"            :  "LOG_MESSAGES"
	});

	printRunner = function(runnerName, odd, cssClass) {
		cssClass = cssClass || '';
		g_runnersStr += `<div class="gridColumnLayout gridColumnLayout_2">
					<!-- Runner Name -->
					<div class="commonClass colOne  ${cssClass}"> ${runnerName} </div>
					<!-- Stake -->
					<div class="commonClass colTwo  ${cssClass}"> ${odd} </div>
					</div>`;
	};

	fillMainHTMLContent = function(statsMsg, content) {
		document.querySelector('#statistics').innerHTML = statsMsg;
		document.querySelector('#predictionList').innerHTML = content;
	};

	showLogMessages = function() {
		const htmlContent = `<div class="sportsName"><div class ="commonClass"><b>${g_logMessages}</b></div></div>`;
		fillMainHTMLContent("", htmlContent);
	};

	renderLogMessages = function(msg) {
		g_logMessages       += msg + "<br/>";
		g_logMessagesBuffer += msg + "<br/>";
		if(g_logMessagesBuffer.length > g_logMessageMaxBufferLength)
		{
			g_logMessages = g_logMessagesBuffer;
			g_logMessagesBuffer = "";
		}
	};

	clearLogMessages = () => { 
		g_logMessages = "";
		g_logMessagesBuffer = "";
		fillMainHTMLContent("", "");
	};

	createPredictedWinnersTable = function(predictedWinnerList) {
		let eventCounter = 0;
		g_runnersStr = "";
		let metaData = "";
		let statsMsg = "";

		for (let sport in predictedWinnerList) {
			if (predictedWinnerList.hasOwnProperty(sport)) {
				// Sport Name
				g_runnersStr +=  `  <br/>
									<div class="sportsName">
									<!-- Sports Name(Horse Racing) -->
									<div class ="commonClass"><b>${sport.toUpperCase()}</b> (# ${predictedWinnerList[sport].length})</div>
									</div>`;

				const n = predictedWinnerList[sport].length;
				if(n) predictedWinnerList[sport].sort((a, b) => b.winPercentage - a.winPercentage); // sort - descending order

				for(let eventNo = 0; eventNo < n; ++eventNo) {
					// Event Name
					const eventName = predictedWinnerList[sport][eventNo]['event-name'];
					const eventFullDetails = predictedWinnerList[sport][eventNo]['event-full-details'];
					metaData = predictedWinnerList[sport][eventNo]['metaData'];

					let raceCourseLength = '';
					if(metaData.eventInfoObj['race-length']) raceCourseLength = ` / Length: ${metaData.eventInfoObj['race-length']}`;

					let market = predictedWinnerList[sport][eventNo].market;
					g_runnersStr += ` <br/>
								<div class="eventName">
									<!-- Event Name(3.30 Kempton) -->
									<div class ="commonClass">(${++eventCounter})   <b>${eventName}</b>   (${sport.toUpperCase()}) / Date: ${predictedWinnerList[sport][eventNo]['event-start-time']} / Market: ${market}  ${raceCourseLength}</div>
								
									Today's Bet Amount Limit =  £ ${metaData.sumOfAlreadyPlacedBetAmount} / £ ${metaData.todayTotalBetAmountLimit}, 
									UserBalance = £ ${metaData.currentBalance}, 
									WinConfidencePercentage = ${metaData.minWinConfidencePercentage}%, 
									MinProfitOdd = £ ${metaData.minProfitOdd}, 
									Stake = £ ${metaData.stakeValue}
								</div>
								<br/>`;

					// printRunner(predictedWinnerList[sport][eventNo]['runner-name'], `${predictedWinnerList[sport][eventNo]['decimal-odds']} (${predictedWinnerList[sport][eventNo].metaData.minWinConfidencePercentage}%)`, 'cssWinnerClass');
					printRunner(predictedWinnerList[sport][eventNo]['runner-name'], `${predictedWinnerList[sport][eventNo]['decimal-odds']} (${predictedWinnerList[sport][eventNo]['winPercentage']}%)`, 'cssWinnerClass');

					if(eventFullDetails.markets[market] && eventFullDetails.markets[market].allRunners)
					{
					    for (let runner in eventFullDetails.markets[market].allRunners) {
						// Players List
						if (eventFullDetails.markets[market].allRunners.hasOwnProperty(runner)) {
							if(predictedWinnerList[sport][eventNo]['runner-name'] != eventFullDetails.markets[market].allRunners[runner].name)
								printRunner(eventFullDetails.markets[market].allRunners[runner].name, eventFullDetails.markets[market].allRunners[runner].back);
						}
					}

					}
					else {
						console.log(`allRunners is NOT exist for the ${market}`);
					}

					g_runnersStr += `<br/>`;
				}
			}
		}

		statsMsg = `# Total Number of Predictions = ${eventCounter}`;
		fillMainHTMLContent(statsMsg, g_runnersStr);
	};

	/////////////////////////// Button Events //////////////////////////////////
	let g_activePageName = g_SYMBOL_CONSTANTS.ALL_PREDICTION_LIST;
	const g_pageNameDisplayArea = document.querySelector('#pageNameDisplayAreaId');
	g_pageNameDisplayArea.innerHTML = `<b>:: Predictions List ::</b>`;

	// button id and addEventListeners mapping
	document.querySelector('#allPredictionBtnId').addEventListener('click', showResults);
	document.querySelector('#currentPredictionBtnId').addEventListener('click', showResults);
	document.querySelector('#placedBetBtnId').addEventListener('click', showResults);
	document.querySelector('#logMessagesBtnId').addEventListener('click', showResults);

	document.querySelector('#clearLogMessagesBtnId').addEventListener('click', clearLogMessages);

	/////////////////////////////////// SOCKET.IO (start) //////////////////////////////////////////////////////////////

	const socket = io(); // NOTE: you MUST run by http://localhost:3000/index.html

	// [Client <= Server] Receive data from server to client
	socket.on('SERVER_TO_CLIENT_ALL_PREDICTED_WINNERS_EVENT',     async (data) => { populateClientPage(data, g_SYMBOL_CONSTANTS.ALL_PREDICTION_LIST); });
	socket.on('SERVER_TO_CLIENT_CURRENT_PREDICTED_WINNERS_EVENT', async (data) => { populateClientPage(data, g_SYMBOL_CONSTANTS.CURRENT_PREDICTION_LIST); });
	socket.on('SERVER_TO_CLIENT_ALREADY_PLACED_BETS_EVENT',       async (data) => { populateClientPage(data, g_SYMBOL_CONSTANTS.PLACED_BET_LIST); });
	socket.on('SERVER_TO_CLIENT_LOG_MESSAGES_EVENT',              async (data) => { renderLogMessages(data); populateClientPage(data, g_SYMBOL_CONSTANTS.LOG_MESSAGES);});

	// [Client => Server] Send the data from client to server 
	function notifyToServer(event, data) {
		socket.emit(event, data);
	}

	notifyToServer('CLIENT_TO_SERVER_GIVE_ALL_PREDICTION_EVENT', JSON.stringify({ msg:"give all prediction list"}));

	/////////////////////////////////// SOCKET.IO (end) //////////////////////////////////////////////////////////////

	function showResults(e) {
		switch(this.dataset.key)  // e.currentTarget.dataset.key
		{
			case g_SYMBOL_CONSTANTS.ALL_PREDICTION_LIST:
				g_activePageName = this.dataset.key;
				g_pageNameDisplayArea.innerHTML = `<b>:: All Predictions List ::</b>`;
				notifyToServer('CLIENT_TO_SERVER_GIVE_ALL_PREDICTION_EVENT', JSON.stringify({  msg:"give all prediction list"}));
				break;

			case g_SYMBOL_CONSTANTS.CURRENT_PREDICTION_LIST:
				g_activePageName = this.dataset.key;
				g_pageNameDisplayArea.innerHTML = `<b>:: Current Prediction List ::</b>`;
				notifyToServer('CLIENT_TO_SERVER_GIVE_CURRENT_PREDICTION_EVENT', JSON.stringify({ msg:'give current prediction list'}));
				break;

			case g_SYMBOL_CONSTANTS.PLACED_BET_LIST:
				g_activePageName = this.dataset.key;
				g_pageNameDisplayArea.innerHTML = `<b>:: Bet Placed List ::</b>`;
				notifyToServer('CLIENT_TO_SERVER_GIVE_ALREADY_PLACED_BETS_EVENT', JSON.stringify({ msg:"give already placed bet list" }));
				break;

			case g_SYMBOL_CONSTANTS.LOG_MESSAGES:
				g_activePageName = this.dataset.key;
				g_pageNameDisplayArea.innerHTML = `<b>:: Log Messages ::</b>`;
				showLogMessages();
				notifyToServer('CLIENT_TO_SERVER_GIVE_LOG_MESSAGES_EVENT', JSON.stringify({ msg:'give log messages'}));
				break;
		}
		// console.log(e.key);       // d
		// console.log(this.value);  // srid
	}
	////////////////////////////////////////////////////////////////////////////

	populateClientPage = (data, dataType) => {

		if(g_activePageName === dataType) 
		{
			if(g_activePageName === g_SYMBOL_CONSTANTS.LOG_MESSAGES) {
				showLogMessages();
			}
			else {
				const result = JSON.parse(data);
				console.log(result);
				createPredictedWinnersTable(result);
			}
		}
	};

	////////////////////////////////////////////////////////////////////////////
	const sportsWinningConstants = {
		"allSports": {
			"g_BetStakeValue"           : 0.2,  // ( 0.1 = 1p, 1 = £1) your REAL MONEY !!!!
			"g_betMinutesOffset"        : 600,  // (600 = 10hrs before). 1 => place bet: +1 min before the start time, -5 min after the start time	
			"g_minWinConfidencePercentage" : 80,   // 80 => comparison with nearest competitor ex: 100  (100% or more)
			"g_minProfitOdd"            : 0.8,  // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
		},

		"Horse Racing": {
			"autoBetAtBestWinningTime"  : true, // ignore "g_betMinutesOffset"
			// "g_betMinutesOffset"     : 3,    // place bet: +1 min before the start time, -5 min after the start time
			"g_minWinConfidencePercentage" : 80,   // ex: 80 => (80% or more)
			"g_minProfitOdd"            : 0.7   // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
		},

		"Tennis": {
			// "betAfterEventStarted": true, // "in-running-flag"
			// g_betMinutesOffset = -1; // place bet: +1 min before the start time, -5 min after the start time
			"g_betMinutesOffset": 3,         // g_betMinutesOffset

			"g_minWinConfidencePercentage": 80, // ex: 80 => (80% or more)

			"g_minProfitOdd": 0.7 // 0.7 => £0.7,  ex: 1 => £1 (1/1 = 1 even odd [or] 2.00 in decimal)
		},


	};


	test = () => {
		const sportsName = "Horse Racing";
		let mergedWinningConsts = sportsWinningConstants["allSports"];
			if(sportsWinningConstants[sportsName])
			{
				mergedWinningConsts = { ...sportsWinningConstants["allSports"], ...sportsWinningConstants[sportsName] }
			}

			console.log(mergedWinningConsts);
		

	};
	// test();



}); // window.addEventListener('load', function() {
