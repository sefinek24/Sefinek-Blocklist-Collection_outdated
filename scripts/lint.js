const fs = require('node:fs').promises;
const path = require('node:path');

const worker = async () => {
	let hasError = false;

	const blockListDir = path.join(__dirname, '..', 'blocklist', 'template');
	const files = await getAllTxtFiles(blockListDir);

	async function getAllTxtFiles(dir) {
		const dirents = await fs.readdir(dir, { withFileTypes: true });
		const filesPromise = await Promise.all(
			dirents.map(dirent => {
				const res = path.resolve(dir, dirent.name);

				return dirent.isDirectory() ? getAllTxtFiles(res) : res;
			}),
		);
		return Array.prototype.concat(...filesPromise).filter((file) => {
			return file.endsWith('.txt') && file.includes('blocklist');
		});
	}

	await Promise.all(files.filter((file) => file !== 'everything.txt').map(async file => {
		const fileContents = await fs.readFile(path.join(file), 'utf8');

		const commentedURLs = fileContents.split('\n').map((line) => {
			if (line.startsWith('# 0.0.0.0')) {
				return line.split(' ')[2].trim();
			}

			return null;
		}).filter((a) => a !== null && !!a);

		// let isHeaderComplete = false;
		fileContents.split('\n').forEach((line, index) => {
			// if (line.startsWith('0.0.0.0')) {
			// 	isHeaderComplete = true;
			// }

			// Ensuring that no version/date might confuse users that read the raw text-file(s)
			if (line.length > 0 && !line.indexOf('Version')) {
				console.error(`[Line ${index + 1}]: Must not contain a Version/Date - ${file}`);
				hasError = true;
			}

			// Ensuring that all lines start with "#" or "0.0.0.0 "
			const prefixes = ['#', '0.0.0.0 ', '127.0.0.1 ', '255.255.255.255 ', '::1 ', 'fe80::1%lo0 ', 'ff00::0 ', 'ff02::1 ', 'ff02::2 ', 'ff02::3 '];
			if (line.length > 0 && !prefixes.some(prefix => line.startsWith(prefix))) {
				console.error(`[Line ${index + 1}]: Must start with "#" or "0.0.0.0" (standard) - ${file}`);
				hasError = true;
			}


			// Checking to ensure all URLs are lowercase
			if (line.startsWith('0.0.0.0 ')) {
				const lineNoIP = line.replace('0.0.0.0 ', '');
				const url = lineNoIP.split('#')[0].trim();
				if (url.toLowerCase() !== url) {
					console.error(`[Line ${index + 1}]: Url ${url} must be all lowercase - ${file}`);
					hasError = true;
				}
			}

			// Ensuring that all lines that start with `#` are followed by a space
			// if (line.startsWith('#') && line.length > 1 && line[1] !== ' ') {
			// 	console.error(`[Line ${index + 1}]: Should have a space after # - ${file}`);
			// 	hasError = true;
			// }

			// Ensure that after header is complete that all lines that start with `#` start with `# 0.0.0.0` or `# NOTE:`
			// if (isHeaderComplete && line.startsWith('#') && !line.startsWith('# 0.0.0.0') && !line.startsWith('# NOTE:')) {
			// 	console.error(`[Line ${index + 1}]: Should start with "# 0.0.0.0" or "# NOTE:" - ${file}`);
			// 	hasError = true;
			// }

			// Ensure that the URL doesn't exist in the commentedURLs array
			if (line.startsWith('0.0.0.0 ')) {
				const lineNoIP = line.replace('0.0.0.0 ', '');
				const url = lineNoIP.split('#')[0].trim();
				if (commentedURLs.includes(url)) {
					console.error(`[Line ${index + 1}]: in ${file} url ${url} is commented out in this file. This suggests an error. Please either remove this line or remove the commented URL.`);
					hasError = true;
				}
			}

			// Ensure that the URL doesn't contain whitespace characters
			if (line.startsWith('0.0.0.0 ')) {
				const lineNoIP = line.replace('0.0.0.0 ', '');
				const url = lineNoIP.split('#')[0].trim();
				if ((/\s/gmu).test(url)) {
					console.error(`[Line ${index + 1}]: in ${file} url ${url} contains whitespace in the URL.`);
					hasError = true;
				}
			}
		});
	}));

	console.log(hasError ? '❌ Linting failed!' : '✔️ Linting passed.');
	process.exit(hasError ? 1 : 0);
};

(async () => await worker())();

module.exports = () => worker;