const fs = require('node:fs').promises;
const path = require('node:path');

(async () => {
	const files = (await fs.readdir(path.join(__dirname, '..'))).filter((file) => file.endsWith('.txt'));

	await Promise.all(files.map(async file => {
		const existingDomains = new Set();

		let fileContents = await fs.readFile(path.join(__dirname, '..', file), 'utf8');

		fileContents.split('\n').forEach((line) => {
			if (line.startsWith('0.0.0.0 ')) {
				const domain = line.replace('0.0.0.0 ', '');
				if (existingDomains.has(domain)) {
					fileContents = fileContents.replace(`${line}\n`, '');
				}
				existingDomains.add(domain);
			}
		});

		await fs.writeFile(path.join(__dirname, '..', file), fileContents, 'utf8');
	}));
})();
