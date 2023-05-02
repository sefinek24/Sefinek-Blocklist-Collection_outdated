const fs = require('fs').promises;
const path = require('path');

const defaultFolder = path.join(__dirname, '..', 'blocklist', 'default');
const generatedFolder = path.join(__dirname, '..', 'blocklist', 'generated');

const listsToIncludeInEverythingList = [
	'abuse',
	'ads',
	'crypto',
	'drugs',
	'facebook',
	'fraud',
	'gambling',
	'malware',
	'phishing',
	'piracy',
	'porn',
	'ransomware',
	'redirect',
	'scam',
	'tiktok',
	'torrent',
	'tracking',
];

(async () => {
	const files = (
		await fs.readdir(defaultFolder)
	).filter((file) => file.endsWith('.txt')).filter((file) => listsToIncludeInEverythingList.some((val) => file.startsWith(val))); // Array of strings, each representing a single file that ends in `.txt`

	const domains = new Set();
	await Promise.all(files.map(async (file) => { // For each file
		const fileContents = await fs.readFile(path.join(defaultFolder, file), 'utf8'); // Get file contents as a string

		fileContents.split('\n').forEach((line) => {
			if (line.startsWith('0.0.0.0 ')) {
				domains.add(line.replace('0.0.0.0 ', ''));
			}
		});
	}));

	let everythingListContent =
		`# ------------------------------------[UPDATE]--------------------------------------
# Title: The Block List Project - Everything List
# Expires: 1 day
# Homepage: https://blocklist.site
# Help: https://github.com/blocklistproject/lists/wiki/
# License: https://unlicense.org
# Total number of network filters:
# ------------------------------------[SUPPORT]-------------------------------------
# You can support by:
# - reporting false positives
# - making a donation: https://paypal.me/blocklistproject
# -------------------------------------[INFO]---------------------------------------
#
# Everything list
# ------------------------------------[FILTERS]-------------------------------------
`;
	domains.forEach((val) => everythingListContent += `0.0.0.0 ${val}\n`);

	await fs.writeFile(path.join(generatedFolder, 'everything.txt'), everythingListContent, 'utf8');
})();
