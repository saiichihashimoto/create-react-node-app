#!/usr/bin/env node
const execa = require('execa');
const path = require('path');
const program = require('commander');
const { existsSync } = require('fs');
const { homedir } = require('os');

program
	.option('--mongod')
	.option('--no-web')
	.option('--no-server')
	.action(
		({ web, server, mongod }) => Promise.resolve()
			// This triggers it to download the binary
			.then(() => mongod && !existsSync(path.resolve(homedir(), '.mongodb-prebuilt')) && execa(
				'mongod',
				[
					'--version',
				],
				{
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			))
			.then(() => execa(
				'nf',
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
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			))
			.then(
				({ stdout }) => stdout && console.log(stdout), // eslint-disable-line no-console
				({ stderr }) => stderr && console.error(stderr), // eslint-disable-line no-console
			),
	)
	.parse(process.argv);
