const fs = require('fs').promises;
const path = require('path');

const processFiles = async dir => {
	await fs.mkdir(dir, { recursive: true });

	try {
		const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.txt'));
		await Promise.all(
			files.map(async (file) => {
				let fileContents = await fs.readFile(path.join(dir, file), 'utf8');
				const existingDomains = new Set();

				const lines = fileContents.split('\n').map((line) => line.trim()).filter((line) => line !== '');
				let duplicatesRemoved = 0;

				fileContents = lines.filter((line) => {
					if (line.startsWith('0.0.0.0 ')) {
						const domain = line.replace('0.0.0.0 ', '');
						if (existingDomains.has(domain)) {
							duplicatesRemoved++;
							return false;
						} else {
							existingDomains.add(domain);
							return true;
						}
					} else {
						return true;
					}
				}).join('\n');

				await fs.writeFile(path.join(dir, file), fileContents, 'utf8');
				if (duplicatesRemoved > 0) {
					console.log(`🗑️ ${duplicatesRemoved} duplicates removed from ${path.join(dir, file)}`);
				} else {
					console.log(`✔️  No actions required in ${path.join(dir, file)}`);
				}
			}),
		);

		const subDirs = await fs.readdir(dir, { withFileTypes: true });
		await Promise.all(
			subDirs
				.filter((d) => d.isDirectory())
				.map((d) => processFiles(path.join(dir, d.name))),
		);
	} catch (err) {
		console.error(err);
	}
};

(async () => {
	try {
		await processFiles(path.join(__dirname, '..', 'blocklist', 'generated'));
		await processFiles(path.join(__dirname, '..', 'blocklist', 'template'));
	} catch (err) {
		console.error(err);
	}
})();