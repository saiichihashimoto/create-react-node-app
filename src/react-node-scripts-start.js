import 'universal-dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

import Listr from 'listr';
import clearConsole from 'react-dev-utils/clearConsole'; // eslint-disable-line import/no-extraneous-dependencies
import execa from 'execa';
import { connect as connectNgrok } from 'ngrok';
import { expand } from 'babel-plugin-universal-dotenv';

export default async function start({
	web = true,
	node = true,
	mongod = false,
	redis = false,
	ngrok = false,
} = {}) {
	const { NODE_ENV = 'development' } = process.env;
	const env = { ...expand(NODE_ENV), ...process.env };

	if (NODE_ENV === 'production') {
		return execa(
			'forever',
			[existsSync('./lib/index.node.js') ? 'lib/index.node.js' : 'lib/index.js'],
			{
				env: {
					...env,
					NODE_ENV: 'production',
				},
				stdio: 'inherit',
			}
		);
	}

	const {
		PORT = 3000,
		NODE_PORT = 4000,
		MONGOD_PORT = 27017,
		REDIS_PORT = 6379,
		BROWSER: PREVIOUS_BROWSER,
	} = env;

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
		}
	)
		.run();

	if (process.stdout.isTTY) {
		clearConsole();
	}

	/*
	 * https://github.com/strongloop/node-foreman/blob/master/lib/colors.js#L7
	 * The order dictates the color
	 */

	const formation = [
		['node', node && Number(node)], // magenta
		['foo2', false], // blue
		['web', web && Number(web)], // cyan
		['mongod', mongod && Number(mongod)], // green
		['foo5', false], // yellow
		['redis', redis && Number(redis)], // red
	];

	while (formation.length && !formation[formation.length - 1][1]) {
		formation.pop();
	}

	const ports = {
		web:    PORT,
		node:   NODE_PORT,
		mongod: MONGOD_PORT,
		redis:  REDIS_PORT,
	};

	return execa(
		'nf',
		[
			'start',
			'--procfile',
			path.resolve(__dirname, 'Procfile'),
			'-x',
			formation
				.map(([key]) => ports[key] || 0)
				.join(','),
			formation
				.map(([key, val], index) => (val ? `${key}=${val}` : `foo${index + 1}=0`))
				.join(','),
		],
		{
			env: {
				...env,
				NODE_ENV: 'development',
				BROWSER:  path.resolve(__dirname, 'open-url.js'),
				PREVIOUS_BROWSER,
				HTTPS:    false,

				...web && {
					PUBLIC_URL:           `http://localhost:${PORT}`,
					SKIP_PREFLIGHT_CHECK: true,
				},

				...node && {
					REACT_APP_BACKEND_URL: `http://localhost:${NODE_PORT}`,
					src:                   existsSync('./src/index.node.js') ? 'src/index.node' : 'src',
					root:                  __dirname,
				},

				...mongod && {
					MONGODB_URI: `mongodb://localhost:${MONGOD_PORT}/database`,
					MONGOHQ_URL: `mongodb://localhost:${MONGOD_PORT}/database`,
					ORMONGO_URL: `mongodb://localhost:${MONGOD_PORT}/database`,
				},

				...redis && {
					OPENREDIS_URL:  `redis://localhost:${REDIS_PORT}`,
					REDISCLOUD_URL: `redis://localhost:${REDIS_PORT}`,
					REDISGREEN_URL: `redis://localhost:${REDIS_PORT}`,
					REDISTOGO_URL:  `redis://localhost:${REDIS_PORT}`,
					REDIS_URL:      `redis://localhost:${REDIS_PORT}`,
				},

				...ngrok && Object.fromEntries(await Promise.all(
					[
						web && ['PUBLIC_URL', {
							name: 'web',
							addr: PORT,
						}],
						node && ['REACT_APP_BACKEND_URL', {
							name: 'node',
							addr: NODE_PORT,
						}],
					]
						.filter(Boolean)
						.map(async ([key, opts]) => [key, await connectNgrok({
							bind_tls:    true, // eslint-disable-line camelcase
							host_header: 'localhost', // eslint-disable-line camelcase
							...opts,
						})])
				)),
			},
			stdio: 'inherit',
		}
	);
}
