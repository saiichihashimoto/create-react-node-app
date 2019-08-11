import express from 'express';

import app from './app';

express()
	.get('/', (req, res) => res.send(app))
	.listen(process.env.PORT, () => console.log(app)); // eslint-disable-line no-console
