const fs = require('node:fs').promises;
const path = require('node:path');

(async () => {
	const files = (await fs.readdir(path.join(__dirname, '..'))).filter((file) => file.endsWith('.txt'));

	await Promise.all(files.map(async file => {
		const existingDomains = new Set();

		const fileContents = await fs.readFile(path.join(__dirname, '..', file), 'utf8');

		fileContents.split('\n').forEach((line) => {
			if (line.startsWith('0.0.0.0 ')) {
				existingDomains.add(line.replace('0.0.0.0 ', ''));
			}
		});

		await fs.writeFile(path.join(__dirname, '..', file), fileContents.replace(/^# Total number of network filters: ?(\d*)$/gmu, `# Total number of network filters: ${existingDomains.size}`), 'utf8');
	}));
})();
