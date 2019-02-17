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
				task:  async (outputs) => {
					const output = await execa(
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
					);

					outputs.push(output);

					return output;
				},
			},
			{
				title: 'web',
				skip:  () => !web,
				task:  async (outputs) => {
					const output = await execa(
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
					);

					outputs.push(output);

					return output;
				},
			},
		],
		{
			renderer:    process.env.NODE_ENV === 'test' ? 'silent' : /* istanbul ignore next */ 'default',
			exitOnError: false,
			concurrent:  true,
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
		.then((outputs) => {
			outputs
				.filter(({ stdout }) => stdout)
				.forEach(({ stdout }) => console.log(stdout)); // eslint-disable-line no-console
			return outputs;
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
