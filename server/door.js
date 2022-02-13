const request = require('request');
const fs = require('fs');
const DOOR = (function() {
	// Private Members
	return {
	// Public Members

	// Login
	// Login to Matchbook and create a new session.
	// The response includes a session token value. This value should be included with all subsequent requests as either a 
	// cookie named "session-token" or a header named "session-token".
	// Matchbook sessions live for approximately 6 hours so only 1 login request every 6 hours is required. The same session 
	// should be used for all requests in that period.
	login: function (callback) {
		// Asynchronous 'json' file read
		fs.readFile('../../../../GitHubOutside/myLoginDetails/secret.json', function(err, data) {
	 // fs.readFile('./../../../../credential.json', function(err, data) {
			if (err) throw err;
			var credential = JSON.parse(data);
			// console.log(credential);
			
			request.post(
				'https://api.matchbook.com/bpapi/rest/security/session',
				{ json: credential}, // username and passwords
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						const sessionToken = body['session-token'];
						const sessionStartTime = body['last-login']; // new Date().getTime();

						DOOR.storeCookie(sessionToken, sessionStartTime);

						return callback(null, sessionToken, sessionStartTime);
					}
					else {
						console.log(body);

						return callback(error, null, 0);
					}
				}
			);
		});
		},
	
		// Logout
		// Logout from Matchbook and terminate the current session.
		logout: function (sessionToken) {
			const options = UTIL.UTIL.getDefaultOptions();
			options.method = 'DELETE';
			options.url = 'https://api.matchbook.com/bpapi/rest/security/session';
	
			// Cookie data for maintaining the session
			options.headers['session-token'] = sessionToken;
	
			request(options, function (error, response, body) {
				if (error) throw new Error(error);
	
				//console.log(body);
			});
		},

		//////////////////////////////////////// FILE API SETUP ////////////////////////////////////////////////////////////
		// Read json file by 'fs' module(WITH promise)
		getLastSession: async function(callback) {
			const fileFullPath = "../../../../GitHubOutside/myLoginDetails/mySessionToken.json";
			try{
				const isFileExist = await fs.promises.stat(fileFullPath).then(() => true).catch(() => false);

				if(isFileExist) {
					const data = await fs.promises.readFile(fileFullPath, 'utf8');
					// console.log("successfully - Read the local json");
					const jsonObject = JSON.parse(data);
					// console.log(jsonObject);

					// "login.lastLoginTIme": "2021-12-22T06:55:09.000Z"
					const elapsedTime = new Date() - new Date(jsonObject["login.lastLoginTIme"]); // milli seconds

					// Check is less than 6 hrs
					if(6*60*60 > elapsedTime / 1000)
					{
						console.log("Last Session is still valid because elapsed time is less than 6 hours");
						const sessionToken = jsonObject["login.sessionToken"];
						const sessionStartTime = jsonObject["login.lastLoginTIme"];

						return callback(null, sessionToken, sessionStartTime);
					}
					else {
						console.log("Last Session is NOT valid because elapsed time is greater than 6 hours");
						DOOR.login(callback); // NOT => login(callback);
					}
				}
				else {
					DOOR.login(callback);
				}
			}
			catch(e) {
				console.error("ERROR: Unable to read the json file");
				console.log(e);
				DOOR.login(callback);
			}
		},

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		storeCookie: async function(sessionToken, lastLoginTIme)
		{
			try
			{
				let obj = {};
				obj["login" + '.sessionToken']  = sessionToken;
				obj["login" + '.lastLoginTIme'] = lastLoginTIme;
				await fs.promises.writeFile('../../../../GitHubOutside/myLoginDetails/mySessionToken.json', JSON.stringify(obj, null, 4), 'utf8');
				console.log('Success: A new mySessionToken.json file has been created');
			}
			catch(e)
			{
				console.error(e);
			}
		}
	};
})();


// exports the variables and functions above so that other modules can use them
module.exports.login = DOOR.login;
module.exports.logout = DOOR.logout;
module.exports.getLastSession = DOOR.getLastSession;