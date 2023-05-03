const express = require('express');
const path = require('path');
const app = express();

app.get('/', (req, res) => {
	res.send('Hello World!');
});

const staticPath = path.join(__dirname, '..', 'blocklist', 'generated');
console.log(staticPath);
app.use('/static', express.static(staticPath));

app.listen(process.env.PORT, () => {
	if (process.env.NODE_ENV === 'production') {
		process.send('ready');
	} else {
		console.log(`App listening at ${process.env.PROTOCOL}${process.env.DOMAIN}:${process.env.PORT}`);
	}
});