#!/usr/bin/env node
import Listr from 'listr';
import execa from 'execa';
import opn from 'opn';
import path from 'path';
import { Command } from 'commander';
import { connect as connectNgrok } from 'ngrok';
import { existsSync } from 'fs';
import { homedir } from 'os';

const options = {
	stdio: [process.stdin, process.stdout, process.stderr],
};

function start(args) {
	if (process.env.NODE_ENV === 'production') {
		return execa('node', [existsSync('./lib/index.server.js') ? 'lib/index.server' : 'lib'], options);
	}

	const command = new Command();

	command
		.option('--mongod')
		.option('--redis')
		.option('--ngrok')
		.option('--no-web')
		.option('--no-server')
		.parse(args);

	const { web, server, mongod, redis, ngrok } = command;

	const mongodUrl = mongod && 'mongodb://localhost:27017/database';
	const redisUrl = redis && 'redis://localhost:6379';

	const {
		env: {
			PORT = 3000,
			SKIP_PREFLIGHT_CHECK = true,

			MONGODB_URI = mongodUrl,
			MONGOHQ_URL = mongodUrl,
			ORMONGO_URL = mongodUrl,

			OPENREDIS_URL = redisUrl,
			REDISCLOUD_URL = redisUrl,
			REDISGREEN_URL = redisUrl,
			REDISTOGO_URL = redisUrl,
			REDIS_URL = redisUrl,

			...env
		},
	} = process;

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
		))
		.then(() => Promise.all([
			execa(
				'nf',
				[
					'start',

					'--procfile', path.resolve(__dirname, 'Procfile'),
					Object.entries({ web, server, cyan: false, mongod, yellow: false, redis })
						.map(([key, val]) => `${key}=${val ? 1 : 0}`)
						.join(','),
				],
				{
					...options,
					env: {
						...env,
						src:      existsSync('./src/index.server.js') ? 'src/index.server' : 'src',
						NODE_ENV: 'development',
						root:     __dirname,
						PORT,
						SKIP_PREFLIGHT_CHECK,

						MONGODB_URI,
						MONGOHQ_URL,
						ORMONGO_URL,

						OPENREDIS_URL,
						REDISCLOUD_URL,
						REDISGREEN_URL,
						REDISTOGO_URL,
						REDIS_URL,

						...(ngrok && {
							// We have to set DANGEROUSLY_DISABLE_HOST_CHECK
							// Otherwise we get "Invalid Host header" error
							// react-scripts binds to HOST if it's set, which is wrong
							// https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development#invalid-host-header-errors-after-configuring-proxy
							DANGEROUSLY_DISABLE_HOST_CHECK: true,

							// Disables the browser from opening
							BROWSER: 'none',
						}),
					},
				},
			),
			// TODO Is there a good way to detect when react-scripts is ready?
			ngrok && new Promise((resolve) => setTimeout(resolve, 2000))
				.then(() => connectNgrok({ port: PORT }))
				.then((url) => opn(url)),
		].filter(Boolean)));
}

/* istanbul ignore next line */
if (require.main === module) {
	start(process.argv)
		.catch(({ code }) => process.exit(code || 1));
}
export default (...args) => start([process.argv[0], __filename, ...args]);
