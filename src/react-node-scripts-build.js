#!/usr/bin/env node
import Listr from 'listr';
import execa from 'execa';
import path from 'path';
import { Command } from 'commander';

function build(args) {
	const command = new Command();

	command
		.option('--no-web')
		.option('--no-server')
		.parse(args);

	const { web, server } = command;

	return new Listr(
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
		{
			renderer: process.env.NODE_ENV === 'test' ? 'silent' : /* istanbul ignore next */ 'default',
		},
	)
		.run([]);
}

/* istanbul ignore next line */
if (require.main === module) {
	build(process.argv)
		.then((output) => (
			output
				.filter(({ stdout }) => stdout)
				.forEach(({ stdout }) => console.log(stdout)) // eslint-disable-line no-console
		))
		.catch(({ code }) => process.exit(code || 1));
}
export default (...args) => build([process.argv[0], __filename, ...args]);
