#!/usr/bin/env node
const Listr = require('listr');
const execa = require('execa');
const path = require('path');
const program = require('commander');

program
	.option('--no-web')
	.option('--no-server')
	.action(
		({ web, server }) => new Listr(
			[
				{
					title: 'server',
					skip:  () => !server,
					task:  (output) => execa(
						'babel',
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
					)
						.then((obj) => output.push(obj)),
				},
				{
					title: 'web',
					skip:  () => !web,
					task:  (output) => execa(
						'react-scripts',
						[
							'build',
							'--color',
						],
						{
							env: {
								...process.env,
								SKIP_PREFLIGHT_CHECK: true,
							},
						},
					)
						.then((obj) => output.push(obj)),
				},
			],
		)
			.run([])
			.then((output) => {
				output
					.filter(({ stdout }) => stdout)
					.forEach(({ stdout }) => console.log(stdout)); // eslint-disable-line no-console
			}),
	)
	.parse(process.argv);
