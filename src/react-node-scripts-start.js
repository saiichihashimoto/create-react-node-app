#!/usr/bin/env node
import execa from 'execa';
import path from 'path';
import program from 'commander';
import { existsSync } from 'fs';
import { homedir } from 'os';

function start(args) {
	let action = null;
	program
		.option('--mongod')
		.option('--no-web')
		.option('--no-server')
		.action(({ web, server, mongod }) => {
			action = process.env.NODE_ENV === 'production' ?
				execa(
					'node',
					[
						existsSync('./lib/index.server.js') ? 'lib/index.server' : 'lib',
					],
					{
						stdio: [process.stdin, process.stdout, process.stderr],
					},
				) :
				Promise.resolve()
				// This triggers it to download the binary
					.then(() => mongod && !existsSync(path.resolve(homedir(), '.mongodb-prebuilt')) && execa(
						'mongod',
						[
							'--version',
						],
						{
							stdio: [process.stdin, process.stdout, process.stderr],
						},
					))
					.then(() => execa(
						'nf',
						[
							'start',

							'--procfile', path.resolve(__dirname, 'Procfile'),
							Object.entries({ web, server, mongod })
								.map(([key, val]) => `${key}=${val ? 1 : 0}`)
								.join(','),
						],
						{
							env: {
								MONGO_URL:            mongod && 'mongodb://localhost:27017/database',
								SKIP_PREFLIGHT_CHECK: true,
								...process.env,
								src:                  existsSync('./src/index.server.js') ? 'src/index.server' : 'src',
								PORT:                 process.env.PORT || 3000,
								NODE_ENV:             'development',
								root:                 __dirname,
							},
							stdio: [process.stdin, process.stdout, process.stderr],
						},
					));
		})
		.parse(args);
	return action;
}

/* istanbul ignore next line */
if (require.main === module) {
	start(process.argv)
		.catch(({ code }) => process.exit(code || 1));
}
export default (...args) => start([process.argv[0], __filename, ...args]);
