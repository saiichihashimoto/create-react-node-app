#!/usr/bin/env node
import 'universal-dotenv';
import Listr from 'listr';
import execa from 'execa';
import opn from 'opn';
import path from 'path';
import program from 'commander';
import { connect as connectNgrok } from 'ngrok';
import { existsSync } from 'fs';
import { homedir } from 'os';
import execForeman from './execForeman';

async function start(args = {}) {
	const {
		env: {
			PORT: port = 3000,
			NODE_ENV,
		},
	} = process;

	if (NODE_ENV === 'production') {
		return execa(
			'node',
			[existsSync('./lib/index.server.js') ? 'lib/index.server' : 'lib'],
			{
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	}

	const {
		web = true,
		server = true,
		mongod,
		redis,
		ngrok: ngrokArg,
	} = args;
	const ngrok = ngrokArg && web;

	await new Listr(
		[
			{
				title:   'Downloading mongod',
				enabled: () => mongod && !existsSync(path.resolve(homedir(), '.mongodb-prebuilt')),
				task:    () => execa('mongod', ['--version']).stdout,
			},
			{
				title:   'Downloading redis',
				enabled: () => redis && !existsSync(path.resolve(homedir(), '.redis-prebuilt')),
				task:    () => execa('redis-server', ['--version']).stdout,
			},
		],
		{
			renderer:    NODE_ENV === 'test' ? 'silent' : /* istanbul ignore next */ 'default',
			exitOnError: false,
			concurrent:  true,
		},
	)
		.run();

	/* istanbul ignore next line */
	if (NODE_ENV !== 'test') {
		console.log(); // eslint-disable-line no-console
	}

	return Promise.all([
		execForeman({ web, server, mongod, redis, ngrok }),
		// TODO Is there a good way to detect when react-scripts is ready?
		ngrok && new Promise((resolve) => setTimeout(resolve, 2000))
			.then(async () => {
				const url = await connectNgrok({ port });

				return opn(url);
			}),
	].filter(Boolean));
}

/* istanbul ignore next line */
if (require.main === module) {
	program
		.option('--mongod')
		.option('--redis')
		.option('--ngrok')
		.option('--no-web')
		.option('--no-server')
		.parse(process.argv);

	start(program)
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

export default start;
