const fs = require('node:fs').promises;
const path = require('node:path');
const sha256File = require('sha256-file');
const date = require('./functions/date.js');

const convert = async (folderPath = path.join(__dirname, '../blocklist/template')) => {
	const generatedPath = path.join(__dirname, '../blocklist/generated/noip');
	try {
		await fs.access(generatedPath);
	} catch (err) {
		await fs.mkdir(generatedPath, { recursive: true });
	}

	const files = await fs.readdir(folderPath, { withFileTypes: true });
	const txtFiles = files.filter(file => file.isFile() && file.name.endsWith('.txt'));

	await Promise.all(txtFiles.map(async file => {
		const thisFileName = path.join(folderPath, file.name);

		// Cache
		const cacheFolder = path.join(__dirname, `../cache/noip/${path.basename(path.dirname(thisFileName)) === 'template' ? '' : path.basename(path.dirname(thisFileName))}`);
		await fs.mkdir(cacheFolder, { recursive: true });

		const cacheFilePath = path.join(cacheFolder, `${file.name.replace('.txt', '')}.hash`);

		let hashFromCacheFile;
		try {
			hashFromCacheFile = await fs.readFile(cacheFilePath, 'utf8');
		} catch (err) {
			console.warn('❌  Cache file not found:', cacheFilePath);
		}

		const hashFromTemplateFile = sha256File(thisFileName);
		console.log(`⏳  File hash: ${hashFromTemplateFile || 'Unknown'}; Cache: ${hashFromCacheFile || 'Unknown'}; File: ${file.name}`);

		if (hashFromTemplateFile === hashFromCacheFile) {
			console.log(`⏭️ ${thisFileName} - skipped`);
			return;
		}

		await fs.writeFile(cacheFilePath, hashFromTemplateFile);

		// Content
		const fileContent = await fs.readFile(thisFileName, 'utf8');
		const replacedFile = fileContent
			.replaceAll(/^0\.0\.0\.0 /gmu, '')
			.replaceAll(/^# 0\.0\.0\.0 /gmu, '# ')
			.replace(/<Release>/gim, 'No IP (only domains)')
			.replace(/<Version>/gim, date.timestamp.toString())
			.replace(/<LastUpdate>/gim, `${date.hours}:${date.minutes}:${date.seconds}.${date.milliseconds}, ${date.day}.${date.month}.${date.year} [HH:MM:SS.MS, DD.MM.YYYY]`);

		const subFolderName = path.basename(path.dirname(thisFileName));
		const categoryPath = subFolderName === 'template' ? generatedPath : path.join(generatedPath, subFolderName);
		const fullNewFile = path.join(categoryPath, file.name);

		try {
			await fs.access(categoryPath);
		} catch (err) {
			await fs.mkdir(categoryPath, { recursive: true });
		}

		await fs.writeFile(fullNewFile, replacedFile);
		console.log(`✔️ ${thisFileName}`);
	}));

	try {
		const subdirectories = files.filter(file => file.isDirectory());
		await Promise.all(subdirectories.map(async subdirectory => {
			await convert(path.join(folderPath, subdirectory.name));
		}));
	} catch (err) {
		console.error(`❌ ${folderPath}:`, err);
	}
};

(async () => {
	await convert();
	console.log('\n');
})();
