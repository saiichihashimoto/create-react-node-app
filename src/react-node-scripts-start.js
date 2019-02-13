#!/usr/bin/env node
import Listr from 'listr';
import execa from 'execa';
import opn from 'opn';
import path from 'path';
import { Command } from 'commander';
import { connect as connectNgrok } from 'ngrok';
import { existsSync } from 'fs';
import { homedir } from 'os';
import execForeman from './execForeman';

function start(args) {
	if (process.env.NODE_ENV === 'production') {
		return execa(
			'node',
			[existsSync('./lib/index.server.js') ? 'lib/index.server' : 'lib'],
			{
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	}

	const command = new Command();

	command
		.option('--mongod')
		.option('--redis')
		.option('--ngrok')
		.option('--no-web')
		.option('--no-server')
		.parse(args);

	const { mongod } = command;
	const ngrok = command.ngrok && command.web;

	const { env: { PORT: port = 3000 } } = process;

	return Promise.resolve()
		.then(() => (
			new Listr(
				[
					{
						title:   'Downloading mongod',
						enabled: () => mongod && !existsSync(path.resolve(homedir(), '.mongodb-prebuilt')),
						task:    () => execa('mongod', ['--version']).stdout,
					},
				],
				{
					renderer:    process.env.NODE_ENV === 'test' ? 'silent' : /* istanbul ignore next */ 'default',
					exitOnError: false,
					concurrent:  true,
				},
			)
				.run()
		))
		.then(
			/* istanbul ignore next line */
			() => process.env.NODE_ENV !== 'test' && console.log(), // eslint-disable-line no-console
			(err) => {
				const { errors } = err;

				/* istanbul ignore next line */
				errors
					.filter(({ stdout }) => stdout)
					.forEach(({ stdout }) => console.log(stdout)); // eslint-disable-line no-console
				/* istanbul ignore next line */
				errors
					.filter(({ stderr }) => stderr)
					.forEach(({ stderr }) => console.error(stderr)); // eslint-disable-line no-console

				// eslint-disable-next-line no-param-reassign
				err.code = err.code || errors.find(({ code }) => code).code;

				throw err;
			},
		)
		.then(() => Promise.all([
			execForeman({ ...command, ngrok }),
			// TODO Is there a good way to detect when react-scripts is ready?
			ngrok && new Promise((resolve) => setTimeout(resolve, 2000))
				.then(() => connectNgrok({ port }))
				.then((url) => opn(url)),
		].filter(Boolean)));
}

/* istanbul ignore next line */
if (require.main === module) {
	start(process.argv)
		.catch(({ code }) => process.exit(code || 1));
}

export default (...args) => start([process.argv[0], __filename, ...args]);
