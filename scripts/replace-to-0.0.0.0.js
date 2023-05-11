const fsPromises = require('node:fs/promises');
const path = require('node:path');

const processDirectory = async dirPath => {
	try {
		await fsPromises.mkdir(dirPath, { recursive: true });

		const fileNames = await fsPromises.readdir(dirPath);
		const txtFiles = fileNames.filter(fileName => fileName.endsWith('.txt'));

		await Promise.all(
			txtFiles.map(async fileName => {
				const filePath = path.join(dirPath, fileName);
				let fileContents = await fsPromises.readFile(filePath, 'utf8');

				const existingDomains = new Set();
				let modifiedLines = 0;

				fileContents = fileContents
					.split('\n')
					.map(line => {
						if (
							line.includes('127.0.0.1 localhost') ||
							line.includes('127.0.0.1 localhost.localdomain') ||
							line.includes('127.0.0.1 local')
						) {
							return line;
						}

						if (line.includes('127.0.0.1 ')) {
							const domain = line.replace('127.0.0.1 ', '').trim();
							if (existingDomains.has(domain)) {
								return line;
							} else {
								existingDomains.add(domain);
								modifiedLines++;
								return line.replace('127.0.0.1', '0.0.0.0');
							}
						} else {
							return line;
						}
					})
					.join('\n');

				await fsPromises.writeFile(filePath, fileContents, 'utf8');

				if (modifiedLines > 0) {
					console.log(
						`✔️ ${modifiedLines} ${modifiedLines === 1 ? 'line' : 'lines'} modified in file ${fileName} located in ${dirPath}`,
					);
				} else {
					console.log(`✔️ No modifications needed for file ${fileName} located in ${dirPath}`);
				}
			}),
		);

		const subDirectories = await fsPromises.readdir(dirPath, {
			withFileTypes: true,
		});

		await Promise.all(
			subDirectories
				.filter(subDir => subDir.isDirectory())
				.map(subDir =>
					processDirectory(path.join(dirPath, subDir.name)),
				),
		);
	} catch (err) {
		console.error(`❌ An error occurred while processing ${dirPath} directory: ${err.message}`);
	}
};

const run = async () => {
	try {
		const templateDirPath = path.join(__dirname, '..', 'blocklist', 'template');
		console.log(`🔍 Searching for .txt files in ${templateDirPath} directory...`);
		await processDirectory(templateDirPath);
		console.log(`✔️ The process is completed successfully for ${templateDirPath} directory`);
	} catch (err) {
		console.error(`❌ An error occurred: ${err.message}`);
	}
};

(async () => await run())();

module.exports = () => run;