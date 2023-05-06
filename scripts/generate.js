const generate000 = require('./generate-0.0.0.0.js');
const generate127 = require('./generate-127.0.0.1.js');
const generateAdGuard = require('./generate-adguard.js');
const generateDnsmasq = require('./generate-dnsmasq.js');
const generateNoIP = require('./generate-noip.js');
const lint = require('./lint.js');

(async () => {
	console.log('\n\n🔵 Generating... 0.0.0.0');
	await generate000();

	console.log('\n\n🔵 Generating... 127.0.0.1');
	await generate127();

	console.log('\n\n🔵 Generating... AdGuard');
	await generateAdGuard();

	console.log('\n\n🔵 Generating... Dnsmasq');
	await generateDnsmasq();

	console.log('\n\n🔵 Generating... No IP');
	await generateNoIP();

	console.log('\n\n🟣 Lint...');
	await lint();
})();