(function () {
	const fs = require('fs').promises; // promise version of require('fs');

	async function cleanDirectory(directoryName) {
		const result = await fs.readdir(directoryName).then((files) => Promise.all(files.map(file => fs.unlink(file))));
		console.log(result);
		// await Promise.all(files.map(file => fs.promises.unlink(path.join("./data-Report", file))));
	}

	cleanDirectory("./data-Report");



}()); // namespace
