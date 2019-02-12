#!/usr/bin/env node
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
	let action = null;
	new Command()
		.option('--mongod')
		.option('--ngrok')
		.option('--no-web')
		.option('--no-server')
		.action(({ web, server, mongod, ngrok }) => {
			const {
				env: {
					MONGO_URL = mongod && 'mongodb://localhost:27017/database',
					PORT = 3000,
					SKIP_PREFLIGHT_CHECK = true,
					NODE_ENV,
					...env
				},
			} = process;

			action = NODE_ENV === 'production' ?
				execa('node', [existsSync('./lib/index.server.js') ? 'lib/index.server' : 'lib'], options) :
				Promise.resolve()
					.then(() => (
						// Downloads the mongod binary
						mongod &&
						!existsSync(path.resolve(homedir(), '.mongodb-prebuilt')) &&
						execa('mongod', ['--version'], options)
					))
					.then(() => Promise.all([
						execa(
							'nf',
							[
								'start',

								'--procfile', path.resolve(__dirname, 'Procfile'),
								Object.entries({ web, server, mongod })
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
									MONGO_URL,
									PORT,
									SKIP_PREFLIGHT_CHECK,

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
