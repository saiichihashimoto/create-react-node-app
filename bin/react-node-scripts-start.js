#!/usr/bin/env node
const execa = require('execa');
const fs = require('fs');
const path = require('path');
const program = require('commander');
const { existsSync } = require('fs');
const { homedir } = require('os');

program
	.option('--mongod')
	.option('--no-web')
	.option('--no-server')
	.action(
		process.env.NODE_ENV === 'production' ?
			() => execa(
				'node',
				[
					fs.existsSync('./lib/index.server.js') ? 'lib/index.server' : 'lib',
				],
				{
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			) :
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
							src:                  fs.existsSync('./src/index.server.js') ? 'src/index.server' : 'src',
							PORT:                 process.env.PORT || 3000,
							NODE_ENV:             'development',
							root:                 __dirname,
						},
						stdio: [process.stdin, process.stdout, process.stderr],
					},
				)),
	)
	.parse(process.argv);
