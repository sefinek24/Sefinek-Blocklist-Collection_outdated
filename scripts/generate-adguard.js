const fs = require('node:fs').promises;
const path = require('node:path');

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

			const now = new Date();
			const timestamp = now.getTime();
			const day = now.getDate().toString().padStart(2, '0');
			const month = (now.getMonth() + 1).toString().padStart(2, '0');
			const year = now.getFullYear().toString();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			const seconds = now.getSeconds().toString().padStart(2, '0');
			const milliseconds = now.getMilliseconds().toString().padStart(3, '0');

			const adGuardFileContents = fileContents
				.replaceAll(/^# 0\.0\.0\.0 (.*?) (.*)/gmu, '@@||$1^! $2')
				.replaceAll(/0\.0\.0\.0 (.*?)$/gmu, '||$1^')
				.replaceAll(/^#/gmu, '!')
				.replace(/<Release>/gim, 'AdGuard [adguard.com]')
				.replace(/<Version>/gim, `${timestamp}-${year}${month}${day}`)
				.replace(/<LastUpdate>/gim, `${hours}:${minutes}:${seconds}.${milliseconds}, ${day}.${month}.${year} [HH:MM:SS.MS, DD.MM.YYYY]`);

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