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

				let modifiedLines = 0;
				let convertedDomains = 0;

				fileContents = fileContents
					.split('\n')
					.map((line) => {
						line = line.trim();

						if (line.includes('127.0.0.1  localhost')) line = '0.0.0.0 localhost';
						if (line.includes('::1  localhost')) line = '::1 localhost';

						if (
							line.includes('127.0.0.1 localhost') ||
							line.includes('127.0.0.1 localhost.localdomain') ||
							line.includes('127.0.0.1 local')
						) {
							return line;
						}

						// Check if domain contains uppercase letters
						if (line.match(/^(0\.0\.0\.0|127\.0\.0\.1)\s/) && (/[A-Z]/).test(line)) {
							const [ip, domain, ...comment] = line.split(/\s+/);
							const modifiedLine = `${ip.trim()} ${domain.toLowerCase().trim()} ${comment.join(' ').trim()}`;

							if (modifiedLine !== line) {
								convertedDomains++;
								modifiedLines++;

								line = modifiedLine;
							}
						}


						if ((line.startsWith('0.0.0.0') || line.startsWith('127.0.0.1')) && !line.includes('#')) {
							const words = line.split(' ');
							if (words.length > 2) {
								const ipAddress = words.shift();
								const domains = words.join(' ').split(' ');

								let modifiedLine = domains
									.map((domain) => `${ipAddress} ${domain}`)
									.join('\n')
									.trim();
								if ((/[A-Z]/).test(modifiedLine)) {
									modifiedLine = modifiedLine.toLowerCase();
									convertedDomains++;
									modifiedLines++;
								}

								if (modifiedLine !== line && modifiedLine.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
									modifiedLines++;
									line = modifiedLine;
								}
							}
						}

						// 127.0.0.0 -> 0.0.0.0
						if (line.includes('127.0.0.1')) {
							modifiedLines++;
							line = line.replace('127.0.0.1', '0.0.0.0');
						}

						// 0.0.0.0\t -> 0.0.0.0
						if (line.includes('0.0.0.0\t')) {
							modifiedLines++;
							line = line.replace('0.0.0.0\t', '0.0.0.0 ');
						}

						// 0.0.0.0 -> nothing
						if (line === '0.0.0.0') {
							modifiedLines++;
							line = line.replace('0.0.0.0', '');
						}

						return line;
					})
					.join('\n');



				if (modifiedLines !== 0) {
					await fs.writeFile(filePath, fileContents.trim(), 'utf8');

					console.log(
						`📝 ${fileName}: ${modifiedLines} ${modifiedLines === 1 ? 'line' : 'lines'} modified${
							convertedDomains > 0 ? ` and ${convertedDomains} ${convertedDomains === 1 ? 'domain' : 'domains'} converted to lowercase` : ''
						}`,
					);
				}
			}),
		);

		const subDirectories = await fs.readdir(dirPath, { withFileTypes: true });

		await Promise.all(
			subDirectories
				.filter((subDir) => subDir.isDirectory())
				.map((subDir) => processDirectory(path.join(dirPath, subDir.name))),
		);
	} catch (err) {
		console.error(`❌ An error occurred while processing ${dirPath} directory: ${err.message}`);
	}
};

const run = async () => {
	try {
		console.log('🔍 Searching for .txt files in blocklist/template directory...');

		const templateDirPath = path.join(__dirname, '..', 'blocklist', 'template');
		await processDirectory(templateDirPath);
		console.log(`✔️ The process is completed successfully for ${templateDirPath} directory`);
	} catch (err) {
		console.error(`❌ An error occurred: ${err.message}`);
	}
};

(async () => await run())();

module.exports = () => run;