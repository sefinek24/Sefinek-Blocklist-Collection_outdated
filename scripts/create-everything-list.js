const fs = require('node:fs').promises;
const path = require('node:path');
const date = require('./functions/date.js');

const defaultFolder = path.join(__dirname, '..', 'blocklist', 'default');
const generatedFolder = path.join(__dirname, '..', 'blocklist', 'generated');

(async () => {
	try {
		await fs.access(generatedFolder);
	} catch (err) {
		await fs.mkdir(generatedFolder, { recursive: true });
	}

	const files = (await fs.readdir(defaultFolder)).filter((file) => file.endsWith('.txt'));
	const domains = new Set();

	await Promise.all(
		files.map(async file => {
			const fileContents = await fs.readFile(path.join(defaultFolder, file), 'utf8');

			fileContents.split('\n').forEach((line) => {
				if (line.startsWith('0.0.0.0 ')) {
					domains.add(line.replace('0.0.0.0 ', ''));
				}
			});
		}),
	);

	const domainsCount = domains.size;

	let content = `# ---------------------------------------------------------------------------------------------------------------------------------------------------
#
#       _____   ______   ______   _____   _   _   ______   _  __        ____    _         ____     _____   _  __  _        _____    _____   _______
#      / ____| |  ____| |  ____| |_   _| | \\ | | |  ____| | |/ /       |  _ \\  | |       / __ \\   / ____| | |/ / | |      |_   _|  / ____| |__   __|
#     | (___   | |__    | |__      | |   |  \\| | | |__    | ' /        | |_) | | |      | |  | | | |      | ' /  | |        | |   | (___      | |
#      \\___ \\  |  __|   |  __|     | |   | . \` | |  __|   |  <         |  _ <  | |      | |  | | | |      |  <   | |        | |    \\___ \\     | |
#      ____) | | |____  | |       _| |_  | |\\  | | |____  | . \\        | |_) | | |____  | |__| | | |____  | . \\  | |____   _| |_   ____) |    | |
#     |_____/  |______| |_|      |_____| |_| \\_| |______| |_|\\_\\       |____/  |______|  \\____/   \\_____| |_|\\_\\ |______| |_____| |_____/     |_|
#
#                              The best collection of blocklists for Pi-hole, AdGuard and uBlock Origin - https://sefinek.net
#
# Title       : Big collection of blocklist
# Description : This list contains a collection of everything from https://github.com/sefinek24/PiHole-BlockList-Test/tree/main/blocklist/default
# Author      : Sefinek (https://sefinek.net) <contact@sefinek.net>
# GitHub      : https://github.com/sefinek24/PiHole-Blocklist-Collection
# Release for : Default (with 0.0.0.0)
# Domains     : ${domainsCount}
# Version     : ${date.timestamp}-${date.year}${date.month}${date.day}
# Last update : ${date.hours}:${date.minutes}:${date.seconds}.${date.milliseconds}, ${date.day}.${date.month}.${date.year} [HH:MM:SS.MS, DD.MM.YYYY]
#
# > ABOUT:
# This file is part of the Pi-hole Blocklist Collection maintained by Sefinek. The collection is hosted on GitHub and can also be accessed from the main URL address provided below.
# If you encounter any issues or have suggestions, please open an issue on the GitHub repository or contact the author. Feel free to create new Pull Requests.
#
# > WARNING:
# By using this file, you agree that the author is not responsible for any damages or losses that may result from its use.
#
# ---------------------------------------------------------------------------------------------------------------------------------------------------\n\n`;

	domains.forEach((val) => content += `0.0.0.0 ${val}\n`);

	await fs.writeFile(path.join(generatedFolder, 'everything.txt'), content, 'utf8');
	console.log(`✔️ Saved everything.txt with ${domainsCount} domains`);
})();
