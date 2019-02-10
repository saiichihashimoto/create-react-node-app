#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const spawnAsync = require('./spawnAsync');

program
	.option('--no-web')
	.option('--no-server')
	.action(({ web, server }) => Promise.resolve()
		.then(() => server && spawnAsync(
			require.resolve('@babel/cli/bin/babel'),
			[
				'src',

				'--out-dir', 'lib',
				'--config-file', path.resolve(__dirname, 'babel.config.js'),
				'--copy-files',
				'--delete-dir-on-start',
				'--no-babelrc',
				'--source-maps',
				'--verbose',
			],
			{
				env: {
					...process.env,
					NODE_ENV: 'production',
				},
			},
		))
		.then(() => web && spawnAsync(
			require.resolve('react-scripts/bin/react-scripts'),
			[
				'build',
			],
			{
				env: {
					...process.env,
					SKIP_PREFLIGHT_CHECK: true,
				},
			},
		)))
	.parse(process.argv);
