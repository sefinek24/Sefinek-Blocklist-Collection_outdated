const fs = require('node:fs/promises');
const path = require('node:path');

const processDirectory = async (dirPath) => {
	try {
		await fs.mkdir(dirPath, { recursive: true });

		const fileNames = await fs.readdir(dirPath);
		const txtFiles = fileNames.filter((fileName) => fileName.endsWith('.txt'));

		await Promise.all(
			txtFiles.map(async (fileName) => {
				const filePath = path.join(dirPath, fileName);
				let fileContents = await fs.readFile(filePath, 'utf8');

				const existingDomains = new Set();
				let duplicatesRemoved = 0;

				const lines = fileContents.split('\n').map((line) => line.trim()).filter((line) => line !== '');

				fileContents = lines.filter((line) => {
					if (line.startsWith('##') || line.startsWith('#') || line.startsWith('!')) {
						return true;
					}

					const domain = line.replace('0.0.0.0 ', '').replace('127.0.0.1', '');

					if (existingDomains.has(domain)) {
						duplicatesRemoved++;
						return false;
					} else {
						existingDomains.add(domain);
						return true;
					}
				}).join('\n');

				await fs.writeFile(filePath, fileContents, 'utf8');

				if (duplicatesRemoved > 0) {
					console.log(`🗑️ ${duplicatesRemoved} ${duplicatesRemoved === 1 ? 'duplicate' : 'duplicates'} removed from ${filePath}`);
				} else {
					console.log(`✔️ No actions required in ${filePath}`);
				}
			}),
		);

		const subDirectories = await fs.readdir(dirPath, { withFileTypes: true });

		await Promise.all(
			subDirectories.filter((subDirectory) => subDirectory.isDirectory())
				.map((subDirectory) => processDirectory(path.join(dirPath, subDirectory.name))),
		);
	} catch (error) {
		console.error(error);
	}
};

(async () => {
	try {
		const generatedDirPath = path.join(__dirname, '..', 'blocklist', 'generated');
		const templateDirPath = path.join(__dirname, '..', 'blocklist', 'template');

		await processDirectory(generatedDirPath);
		await processDirectory(templateDirPath);
	} catch (error) {
		console.error(error);
	}
})();
