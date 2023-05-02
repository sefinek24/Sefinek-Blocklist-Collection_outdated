const fs = require('node:fs').promises;
const path = require('node:path');
const date = require('./functions/date.js');

const convertToAdGuardFormat = async (folderPath = path.join(__dirname, '../blocklist/default')) => {
	const adGuardPath = path.join(__dirname, '../blocklist/generated/adguard');
	try {
		await fs.access(adGuardPath);
	} catch (err) {
		await fs.mkdir(adGuardPath, { recursive: true });
	}

	try {
		const files = await fs.readdir(folderPath, { withFileTypes: true });
		const textFiles = files.filter(file => file.isFile() && file.name.endsWith('.txt'));

		await Promise.all(textFiles.map(async file => {
			const thisFileName = path.join(folderPath, file.name);
			const fileContents = await fs.readFile(thisFileName, 'utf8');

			const adGuardFileContents = fileContents
				.replace(/^# 0\.0\.0\.0 (.*?) (.*)/gmu, '@@||$1^! $2')
				.replace(/0\.0\.0\.0 (.*?)$/gmu, '||$1^')
				.replace(/^#/gmu, '!')
				.replace(/<Release>/gim, 'AdGuard [adguard.com]')
				.replace(/<Version>/gim, `${date.timestamp}-${date.year}${date.month}${date.day}`)
				.replace(/<LastUpdate>/gim, `${date.hours}:${date.minutes}:${date.seconds}.${date.milliseconds}, ${date.day}.${date.month}.${date.year} [HH:MM:SS.MS, DD.MM.YYYY]`);

			const adGuardFileName = file.name.replace('.txt', '-ags.txt');
			const subFolderName = path.basename(path.dirname(thisFileName));
			const categoryPath = subFolderName === 'default' ? adGuardPath : path.join(adGuardPath, subFolderName);

			try {
				await fs.access(categoryPath);
			} catch (err) {
				await fs.mkdir(categoryPath, { recursive: true });
			}

			await fs.writeFile(path.join(categoryPath, adGuardFileName), adGuardFileContents);
		}));

		const subdirectories = files.filter(file => file.isDirectory());
		await Promise.all(subdirectories.map(async subdirectory => {
			await convertToAdGuardFormat(path.join(folderPath, subdirectory.name));
		}));

		console.log(`✔️ ${folderPath}`);
	} catch (err) {
		console.error(`❌ ${folderPath}:`, err);
	}
};

(async () => {
	await convertToAdGuardFormat();
})();
