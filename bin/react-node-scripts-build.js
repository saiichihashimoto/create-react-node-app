#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const { spawnSync } = require('child_process');

program
	.option('--no-web')
	.option('--no-server')
	.action(({ web, server }) => {
		if (server) {
			spawnSync(
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
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);
		}
		if (web) {
			spawnSync(
				require.resolve('react-scripts/bin/react-scripts'),
				[
					'build',
				],
				{
					env: {
						...process.env,
						SKIP_PREFLIGHT_CHECK: true,
					},
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);
		}
	})
	.parse(process.argv);
