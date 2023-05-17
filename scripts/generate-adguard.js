const { promises: fs } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const date = require('./functions/date.js');

const convert = async (folderPath = path.join(__dirname, '../blocklist/template')) => {
	const generatedPath = path.join(__dirname, '../blocklist/generated/adguard');
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
		const cacheFolder = path.join(__dirname, `../cache/adguard/${path.basename(path.dirname(thisFileName)) === 'template' ? '' : path.basename(path.dirname(thisFileName))}`);
		await fs.mkdir(cacheFolder, { recursive: true });

		const cacheFilePath = path.join(cacheFolder, `${file.name.replace('.txt', '')}.sha256`);
		let hashFromCacheFile;

		try {
			hashFromCacheFile = await fs.readFile(cacheFilePath, 'utf8');
		} catch (err) {
			console.warn(`❌  Cache file not found: ${cacheFilePath}`);
		}

		const buff = await fs.readFile(thisFileName);
		const hash = createHash('sha256').update(buff).digest('hex');

		if (hash === hashFromCacheFile) {
			console.log(`⏭️ ${hash} == ${hashFromCacheFile || 'Unknown hash'} / ${file.name} / skipped`);
			return;
		}

		try {
			await fs.writeFile(cacheFilePath, hash);
			console.log(`✅  ${hash} -> ${hashFromCacheFile || 'Unknown hash'} / ${file.name} / hashed`);
		} catch (err) {
			console.error(`Error writing cache file ${cacheFilePath}: ${err}`);
		}




		// Content
		const fileContent = await fs.readFile(thisFileName, 'utf8');
		const replacedFile = fileContent
			.replaceAll(
				/127\.0\.0\.1 localhost\.localdomain|255\.255\.255\.255 broadcasthost|ff0(?:0::0 ip6-mcastprefix|2::(?:2 ip6-allrouter|(?:1 ip6-allnode|3 ip6-allhost))s)|(?:fe80::1%lo0 |(?:(?:127\.0\.0\.|::)1 {2}|::1 (?:ip6-)?))localhost|ff00::0 ip6-localnet|127\.0\.0\.1 local(?:host)?|::1 ip6-loopback|0\.0\.0\.0 0\.0\.0\.0/gi,
				'',
			)
			.replaceAll('#=====', '! =====')
			.replace(/^# 0\.0\.0\.0 (.*?) (.*)/gmu, '@@||$1^! $2')
			.replace(/0\.0\.0\.0 (.*?)$/gmu, '||$1^')
			.replaceAll(/::|#/gmu, '!')
			.replace(/<Release>/gim, 'AdGuard [adguard.com]')
			.replace(/<Version>/gim, date.timestamp.toString())
			.replace(/<LastUpdate>/gim, `${date.hours}:${date.minutes}:${date.seconds}.${date.milliseconds}, ${date.day}.${date.month}.${date.year} [GMT+2 HH:MM:SS.MS, DD.MM.YYYY]`);

		const subFolderName = path.basename(path.dirname(thisFileName));
		const categoryPath = subFolderName === 'template' ? generatedPath : path.join(generatedPath, subFolderName);
		const fullNewFile = path.join(categoryPath, file.name);

		try {
			await fs.access(categoryPath);
		} catch (err) {
			await fs.mkdir(categoryPath, { recursive: true });
		}

		await fs.writeFile(fullNewFile, replacedFile);
		console.log(`✔️ ${hashFromCacheFile || file.name} saved in ${thisFileName}`);
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

const run = async () => {
	await convert();
	console.log('\n');
};

(async () => await run())();

module.exports = () => run;