// Namespace using Module Pattern 
// Server listen at the given port number
const PORT = process.env.PORT || 3004;
const express = require("express");
const app = express();
const httpServer = require("http").createServer(app); // explicitly create a 'http' server instead of using express() server
const io = require("socket.io")(httpServer);

//////////////////////////// SERVER IS LISTENING ///////////////////////////////////////////////////////////////////
app.use(express.json());               // for body parsing
app.use(express.static('../client'));  // path to public folder you can access through server

httpServer.listen(PORT, async () => {
	CONNECTIONS.print("must","Server is running on the port : " + httpServer.address().port);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const CONNECTIONS = (function() {
	// Private Members
	return {
		
		///////////////////////   Public Members ///////////////////////////////////////////////////////////////////////

		// [Server => Client(S)] Notify all the connected clients
		notifyAllUser: (event, data) => {
			io.emit(event, data);
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////		

		print: (level, msg) => {
			switch(level)
			{
				case "must":
					console.log(msg);
					break;
				case "info":
					console.log(msg);
					break;
				case "ignore":
					// console.log(msg);
					break;
				case "warnings":
					// console.log(msg);
					break;
				case "log":
					console.log(msg);
					break;
				case "logClient":
					console.log(msg);
					CONNECTIONS.notifyAllUser('SERVER_TO_CLIENT_LOG_MESSAGES_EVENT', msg); // notify the client
					break;

				case "extra":
					// console.log(msg);
					break;

				default:
					console.log(msg);
					break;
			}
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	};
})();


// exports the variables and functions above so that other modules can use them
module.exports.io = io;
module.exports.print = CONNECTIONS.print;
module.exports.notifyAllUser = CONNECTIONS.notifyAllUser;















