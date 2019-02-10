#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const { existsSync } = require('fs');
const { homedir } = require('os');
const spawnAsync = require('./spawnAsync');

program
	.option('--mongod')
	.option('--no-web')
	.option('--no-server')
	.action(({ web, server, mongod }) => Promise.resolve()
		// This triggers it to download the binary
		.then(() => mongod && !existsSync(path.resolve(homedir(), '.mongodb-prebuilt')) && spawnAsync(
			require.resolve('mongodb-prebuilt/built/bin/mongod'),
			[
				'--version',
			],
		))
		.then(() => spawnAsync(
			require.resolve('foreman/nf'),
			[
				'start',

				'--procfile', path.resolve(__dirname, 'Procfile'),
				Object.entries({ web, server, mongod })
					.map(([key, val]) => `${key}=${val ? 1 : 0}`)
					.join(','),
			],
			{
				env: {
					MONGO_URL:            mongod && 'mongodb://localhost:27017/database',
					SKIP_PREFLIGHT_CHECK: true,
					...process.env,
					root:                 __dirname,
					NODE_ENV:             'development',
					PORT:                 process.env.PORT || 3000,
				},
			},
		)))
	.parse(process.argv);
