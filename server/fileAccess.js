// Namespace using Module Pattern 
// https://javascriptweblog.wordpress.com/2010/12/07/namespacing-in-javascript/
// https://liangwu.wordpress.com/2016/07/11/module-pattern-variations-and-common-practices/
const fs = require('fs').promises; // promise version of require('fs');
const FA = (function() {
	// Private Members
	return {

		// Public Members
		isFileExist: async (fileName) => { 
			// const result = await fs.stat(fileName).then(() => true).catch(() => false);
			// return result;  // same as below one line statement
			return await fs.stat(fileName).then(() => true).catch(() => false); // caller: await isFileExist(); =>  MUST have await bcos true/false is wrapped by promise bcos of async function
		},

		readJsonFile: async(fileName) => {
			try {
					const data = await fs.readFile(fileName, 'utf8'); // promise is returned
					const jsonObject = JSON.parse(data);
					console.log(`Read the ${fileName} file successfully`);
					// console.log(jsonObject);
					return jsonObject;
			}
			catch(e) {
				console.error(`ERROR: Unable to read the ${fileName} file`);
				console.log(e);
			}
		},

		writeJsonFile: async(jsonString, fileName, isOverwriteNotAllowed) => {
			// 1. create a file if NOT exist
			// 2. By default, the file overwrites (isOverwriteNotAllowed = false)
			let  isFileExist = false;

			if(isOverwriteNotAllowed) {
				isFileExist = await FA.isFileExist(fileName); // await is MUST
			}

			if(!isFileExist) {
				try {
					await fs.writeFile(fileName, JSON.stringify(jsonString, null, 2), 'utf8'); // promise is returned
					// console.log(`Writing to the ${fileName} file is successfully`);
				}
				catch(e) {
					console.error(`ERROR: Unable to write the ${fileName} file`);
					console.log(e);
				}
			}
		}
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	};
})();


// exports the variables and functions above so that other modules can use them
module.exports.isFileExist = FA.isFileExist;
module.exports.readJsonFile = FA.readJsonFile;
module.exports.writeJsonFile = FA.writeJsonFile;




