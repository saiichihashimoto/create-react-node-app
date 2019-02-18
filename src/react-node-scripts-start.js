#!/usr/bin/env node
import 'universal-dotenv';
import Listr from 'listr';
import clearConsole from 'react-dev-utils/clearConsole'; // eslint-disable-line import/no-extraneous-dependencies
import execa from 'execa';
import path from 'path';
import program from 'commander';
import { connect as connectNgrok } from 'ngrok';
import { existsSync } from 'fs';
import { homedir } from 'os';

async function start({
	web = true,
	server = true,
	mongod,
	redis,
	ngrok: ngrokArg,
} = {}) {
	const {
		env: {
			PORT = 3000,
			MONGOD_PORT = 27017,
			REDIS_PORT = 6379,
			BROWSER,
			NODE_ENV,
			...env
		},
	} = process;

	if (NODE_ENV === 'production') {
		return execa('node', [existsSync('./lib/index.server.js') ? 'lib/index.server' : 'lib'], { stdio: 'inherit' });
	}

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

	if (process.stdout.isTTY) {
		clearConsole();
	}

	// https://github.com/strongloop/node-foreman/blob/master/lib/colors.js#L7
	// The order dictates the color
	const formation = Object.entries({
		server, // magenta
		foo2: false, // blue
		web, // cyan
		mongod, // green
		foo5: false, // yellow
		redis, // red
	});

	const ngrok = ngrokArg && web;

	const NGROK_URL = ngrok ?
		(await connectNgrok({ port: PORT })) :
		undefined;

	return execa(
		'nf',
		[
			'start',
			'--procfile', path.resolve(__dirname, 'Procfile'),
			formation
				.slice(0, formation.map(([, val]) => val).lastIndexOf(true) + 1)
				.map(([key, val], index) => (val ? `${key}=1` : `foo${index + 1}=0`))
				.join(','),
		],
		{
			env: {
				...env,
				NODE_ENV: 'development',
				BROWSER,
				PORT,

				...(web && {
					WEB_PORT_OFFSET:      -100 * formation.findIndex(([key]) => key === 'web'),
					SKIP_PREFLIGHT_CHECK: true,
				}),

				...(server && {
					SERVER_PORT_OFFSET: 1000 - 100 * formation.findIndex(([key]) => key === 'server'),
					src:                existsSync('./src/index.server.js') ? 'src/index.server' : 'src',
					root:               __dirname,
				}),

				...(mongod && {
					MONGOD_PORT,
					MONGODB_URI: `mongodb://localhost:${MONGOD_PORT}/database`,
					MONGOHQ_URL: `mongodb://localhost:${MONGOD_PORT}/database`,
					ORMONGO_URL: `mongodb://localhost:${MONGOD_PORT}/database`,
				}),

				...(redis && {
					REDIS_PORT,
					OPENREDIS_URL:  `redis://localhost:${REDIS_PORT}`,
					REDISCLOUD_URL: `redis://localhost:${REDIS_PORT}`,
					REDISGREEN_URL: `redis://localhost:${REDIS_PORT}`,
					REDISTOGO_URL:  `redis://localhost:${REDIS_PORT}`,
					REDIS_URL:      `redis://localhost:${REDIS_PORT}`,
				}),

				...(ngrok && {
					// We have to set DANGEROUSLY_DISABLE_HOST_CHECK
					// Otherwise we get "Invalid Host header" error
					// react-scripts binds to HOST if it's set, which is wrong
					// https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development#invalid-host-header-errors-after-configuring-proxy
					DANGEROUSLY_DISABLE_HOST_CHECK: true,

					NGROK_URL,
					BROWSER:      path.resolve(__dirname, 'open-ngrok.js'),
					REAL_BROWSER: BROWSER,
				}),
			},
			stdio: 'inherit',
		},
	);
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
