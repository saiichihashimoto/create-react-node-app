#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const { spawnSync } = require('child_process');

program
	.option('--mongod')
	.option('--no-web')
	.option('--no-server')
	.action(({ web, server, mongod }) => spawnSync(
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
				...process.env,
				root:                 __dirname,
				NODE_ENV:             'development',
				SKIP_PREFLIGHT_CHECK: true,
				PORT:                 process.env.PORT || 3000,
			},
			stdio: [process.stdin, process.stdout, process.stderr],
		},
	))
	.parse(process.argv);
