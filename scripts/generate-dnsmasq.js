const fs = require('node:fs').promises;
const path = require('node:path');

(async () => {
	const files = (await fs.readdir(path.join(__dirname, '..'))).filter((file) => file.endsWith('.txt'));
	await Promise.all(files.map(async (file) => {
		const fileContents = await fs.readFile(path.join(__dirname, '..', file), 'utf8');
		const noIPFileContents = fileContents
			.replaceAll(/0\.0\.0\.0 (.*?)( .*)?$/gmu, '0.0.0.0 $1/$2')
			.replaceAll(/^0\.0\.0\.0 /gmu, 'server=/')
			.replaceAll(/^# 0\.0\.0\.0 /gmu, '# server=/')
			.replace(/^# Title: (.*?)$/gmu, '# Title: $1 (dnsmasq)');
		await fs.writeFile(path.join(__dirname, '..', 'dnsmasq-version', file.replace('.txt', '-dnsmasq.txt')), noIPFileContents, 'utf8');
	}));
})();
