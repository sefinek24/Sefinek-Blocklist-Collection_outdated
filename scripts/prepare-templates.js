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

				let modifiedLines = 0;
				let convertedDomains = 0;

				fileContents = fileContents
					.split('\n')
					.map(line => {
						if (line.includes('127.0.0.1  localhost')) {
							return '0.0.0.0 localhost';
						}

						if (
							line.includes('127.0.0.1 localhost') ||
							line.includes('127.0.0.1 localhost.localdomain') ||
							line.includes('127.0.0.1 local')
						) {
							return line;
						}

						if ((line.startsWith('0.0.0.0') || line.startsWith('127.0.0.1')) && !line.includes('#')) {
							const words = line.split(' ');

							if (words.length > 2) {
								const ipAddress = words.shift();
								const domains = words.join(' ').split(' ');
								const modifiedLine = domains.map(domain => `${ipAddress} ${domain.toLowerCase()}`).join('\n').trim();

								if (modifiedLine !== line) {
									modifiedLines++;
									return modifiedLine;
								}
							}
						}

						// Check if domain contains uppercase letters
						if (line.match(/^(0\.0\.0\.0|127\.0\.0\.1)\s/) && (/[A-Z]/).test(line)) {
							const ip = line.split(/\s+/)[0];
							const domain = line.split(/\s+/)[1].toLowerCase();
							const comment = line.includes('#') ? line.slice(line.indexOf('#')) : '';

							const modifiedLine = `${ip.trim()} ${domain.trim()} ${comment}`;
							if (modifiedLine !== line) {
								convertedDomains++;
								modifiedLines++;

								return modifiedLine;
							}
						}

						if (line.includes('127.0.0.1 ')) {
							modifiedLines++;
							return line.replace('127.0.0.1 ', '0.0.0.0 ');
						}

						return line;
					})
					.join('\n');

				if (modifiedLines !== 0) console.log(`✔️ Changes made to ${fileName}: ${modifiedLines} ${modifiedLines === 1 ? 'line' : 'lines'} modified${convertedDomains > 0 ? ` and ${convertedDomains} ${convertedDomains === 1 ? 'domain' : 'domains'} converted to lowercase` : ''}`);

				await fsPromises.writeFile(filePath, fileContents, 'utf8');
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