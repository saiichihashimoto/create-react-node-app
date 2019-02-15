#!/usr/bin/env node
import Listr from 'listr';
import execa from 'execa';
import path from 'path';
import program from 'commander';

function build({ web = true, server = true } = {}) {
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
	program
		.option('--no-web')
		.option('--no-server')
		.parse(process.argv);

	build(process)
		.then((output) => {
			output
				.filter(({ stdout }) => stdout)
				.forEach(({ stdout }) => console.log(stdout)); // eslint-disable-line no-console
			return output;
		})
		.catch((err) => {
			const { errors = [] } = err;

			/* istanbul ignore next line */
			errors
				.filter(({ stdout }) => stdout)
				.forEach(({ stdout }) => console.log(stdout)); // eslint-disable-line no-console
			/* istanbul ignore next line */
			errors
				.filter(({ stderr }) => stderr)
				.forEach(({ stderr }) => console.error(stderr)); // eslint-disable-line no-console

			process.exit(err.code || (errors.find(({ code }) => code) || {}).code || 1);
		});
}
export default build;
