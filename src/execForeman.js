import execa from 'execa';
import path from 'path';
import { existsSync } from 'fs';

export default function execForeman({ web, server, mongod, redis, ngrok } = {}) {
	const {
		env: {
			PORT = 3000,
			MONGOD_PORT = 27017,
			REDIS_PORT = 6379,
			...env
		},
	} = process;

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

					// Disables the browser from opening
					BROWSER: 'none',
				}),
			},
			stdio: [process.stdin, process.stdout, process.stderr],
		},
	);
}
