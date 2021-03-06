import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

import clearConsole from 'react-dev-utils/clearConsole'; // eslint-disable-line import/no-extraneous-dependencies
import execa from 'execa';
import ngrok from 'ngrok';

import start from './react-node-scripts-start';

jest.mock('execa');
jest.mock('fs');
jest.mock('ngrok');
jest.mock('react-dev-utils/clearConsole');

const NODE_ENV_BEFORE = process.env.NODE_ENV;
const beforeIsTTY = process.stdout.isTTY;
let files = {};

beforeEach(() => {
	execa.mockImplementation(() => Promise.resolve());
	fs.existsSync.mockImplementation((filePath) => filePath in files);

	files = {};

	process.env.NODE_ENV = NODE_ENV_BEFORE;
	process.stdout.isTTY = beforeIsTTY;

	delete process.env.BROWSER;
	delete process.env.MONGOD_PORT;
	delete process.env.NODE_PORT;
	delete process.env.PORT;
	delete process.env.REDIS_PORT;
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('node', () => {
	it('doesn\'t execute', async () => {
		await start();

		expect(execa).not.toHaveBeenCalledWith('forever', expect.anything(), expect.anything());
	});

	it('executes if NODE_ENV=production', async () => {
		process.env.NODE_ENV = 'production';
		await start();

		expect(execa).toHaveBeenCalledWith('forever', ['lib/index.js'], expect.objectContaining({ stdio: 'inherit' }));
	});

	it('uses lib/index.node.js', async () => {
		process.env.NODE_ENV = 'production';
		files = { './lib/index.node.js': true };

		await start();

		expect(execa).toHaveBeenCalledWith('forever', ['lib/index.node.js'], expect.objectContaining({ stdio: 'inherit' }));
	});
});

describe('foreman', () => {
	it('executes foreman', async () => {
		await start();

		expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['start']), expect.objectContaining({ stdio: 'inherit' }));
	});

	it('uses Procfile', async () => {
		const Procfile = path.resolve(__dirname, 'Procfile');
		let args;
		execa.mockImplementation((...input) => {
			[, args] = input;

			return Promise.resolve();
		});

		await start();

		expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['--procfile', Procfile]), expect.anything());
		expect(args.indexOf(Procfile)).toBe(args.indexOf('--procfile') + 1);
	});

	it('clears the console if isTTY', async () => {
		process.stdout.isTTY = true;

		await start();

		expect(clearConsole).toHaveBeenCalledWith();
	});

	it('does not clear the console if !isTTY', async () => {
		process.stdout.isTTY = false;

		await start();

		expect(clearConsole).not.toHaveBeenCalled();
	});

	it('sets BROWSER=open-url.js', async () => {
		await start();

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ BROWSER: path.resolve(__dirname, 'open-url.js') }) }));
	});

	it('sets PREVIOUS_BROWSER=$BROWSER if set', async () => {
		process.env.BROWSER = 'some browser';

		await start();

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ PREVIOUS_BROWSER: 'some browser' }) }));
	});

	it('sets HTTPS=false', async () => {
		await start({ ngrok: true, web: true });

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ HTTPS: false }) }));
	});

	describe('web', () => {
		it('is enabled by default', async () => {
			await start();

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('web=1')]), expect.anything());
		});

		it('can be disabled', async () => {
			await start({ web: false });

			expect(execa).not.toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('web=1')]), expect.anything());
		});

		it('is third in formation', async () => {
			await start({ web: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^\w+=\d,\w+=\d,web=1/u)]), expect.anything());
		});

		it('can run multiple jobs', async () => {
			await start({ web: 2 });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^\w+=\d,\w+=\d,web=2/u)]), expect.anything());
		});

		it('uses port 3000', async () => {
			await start({ web: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.arrayContaining(['-x', expect.stringMatching(/^\d+,\d+,3000/u)]),
				expect.objectContaining({ env: expect.objectContaining({ PUBLIC_URL: 'http://localhost:3000' }) })
			);
		});

		it('uses defined PORT', async () => {
			process.env.PORT = 4000;

			await start({ web: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.arrayContaining(['-x', expect.stringMatching(/^\d+,\d+,4000/u)]),
				expect.objectContaining({ env: expect.objectContaining({ PUBLIC_URL: 'http://localhost:4000' }) })
			);
		});

		it('sets SKIP_PREFLIGHT_CHECK=true', async () => {
			await start({ web: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ SKIP_PREFLIGHT_CHECK: true }) }));
		});

		it('sets NODE_ENV=development', async () => {
			delete process.env.NODE_ENV;

			await start({ web: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NODE_ENV: 'development' }) }));
		});
	});

	describe('node', () => {
		it('is enabled by default', async () => {
			await start();

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('node=1')]), expect.anything());
		});

		it('can be disabled', async () => {
			await start({ node: false });

			expect(execa).not.toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('node=1')]), expect.anything());
		});

		it('is first in formation', async () => {
			await start({ node: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^node=1/u)]), expect.anything());
		});

		it('can run multiple jobs', async () => {
			await start({ node: 2 });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^node=2/u)]), expect.anything());
		});

		it('uses port 4000', async () => {
			await start({ node: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.arrayContaining(['-x', expect.stringMatching(/^4000/u)]),
				expect.objectContaining({ env: expect.objectContaining({ REACT_APP_BACKEND_URL: 'http://localhost:4000' }) })
			);
		});

		it('uses defined NODE_PORT', async () => {
			process.env.NODE_PORT = 5000;

			await start({ web: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.arrayContaining(['-x', expect.stringMatching(/^5000/u)]),
				expect.objectContaining({ env: expect.objectContaining({ REACT_APP_BACKEND_URL: 'http://localhost:5000' }) })
			);
		});

		it('sets NODE_ENV=development', async () => {
			delete process.env.NODE_ENV;

			await start({ node: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NODE_ENV: 'development' }) }));
		});

		it('sets root=__dirname', async () => {
			await start({ node: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ root: __dirname }) }));
		});

		it('sets src=src', async () => {
			await start({ node: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ src: 'src' }) }));
		});

		it('sets src=src/index.node.js', async () => {
			files = { './src/index.node.js': true };

			await start({ node: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ src: 'src/index.node' }) }));
		});
	});

	describe('mongod', () => {
		it('is disabled by default', async () => {
			await start();

			expect(execa).not.toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('mongod=1')]), expect.anything());
		});

		it('can be enabled', async () => {
			await start({ mongod: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('mongod=1')]), expect.anything());
		});

		it('is fourth in formation', async () => {
			await start({ mongod: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^\w+=\d,\w+=\d,\w+=\d,mongod=1/u)]), expect.anything());
		});

		it('uses port 27017', async () => {
			await start({ mongod: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['-x', expect.stringMatching(/^\d+,\d+,\d+,27017/u)]), expect.anything());
		});

		it('uses defined MONGOD_PORT', async () => {
			process.env.MONGOD_PORT = 4000;

			await start({ mongod: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['-x', expect.stringMatching(/^\d+,\d+,\d+,4000/u)]), expect.anything());
		});

		it('prebuilds mongod', async () => {
			await start({ mongod: true });

			expect(execa).toHaveBeenCalledWith('mongod', ['--version']);
		});

		it('skips prebuilding mongod if exists', async () => {
			files = { [path.resolve(homedir(), '.mongodb-prebuilt')]: true };

			await start({ mongod: true });

			expect(execa).not.toHaveBeenCalledWith('mongod', ['--version']);
		});

		it('throws on failed prebuild', async () => {
			execa.mockImplementation((command) => {
				if (command !== 'mongod') {
					return Promise.resolve();
				}
				const err = new Error('Error Message');
				err.code = 1;

				throw err;
			});

			await expect(start({ mongod: true })).rejects.toThrow('Something went wrong');
		});

		it('sets heroku mongodb addon variables', async () => {
			await start({ mongod: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.anything(),
				expect.objectContaining({
					env: expect.objectContaining({
						MONGODB_URI: 'mongodb://localhost:27017/database',
						MONGOHQ_URL: 'mongodb://localhost:27017/database',
						ORMONGO_URL: 'mongodb://localhost:27017/database',
					}),
				})
			);
		});

		it('sets heroku mongod addon variables with MONGOD_PORT', async () => {
			process.env.MONGOD_PORT = 4000;

			await start({ mongod: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.anything(),
				expect.objectContaining({
					env: expect.objectContaining({
						MONGODB_URI: 'mongodb://localhost:4000/database',
						MONGOHQ_URL: 'mongodb://localhost:4000/database',
						ORMONGO_URL: 'mongodb://localhost:4000/database',
					}),
				})
			);
		});
	});

	describe('redis', () => {
		it('is disabled by default', async () => {
			await start();

			expect(execa).not.toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('redis=1')]), expect.anything());
		});

		it('can be enabled', async () => {
			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringContaining('redis=1')]), expect.anything());
		});

		it('is sixth in formation', async () => {
			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^\w+=\d,\w+=\d,\w+=\d,\w+=\d,\w+=\d,redis=1/u)]), expect.anything());
		});

		it('uses port 6379', async () => {
			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['-x', expect.stringMatching(/^\d+,\d+,\d+,\d+,\d+,6379/u)]), expect.anything());
		});

		it('uses defined REDIS_PORT', async () => {
			process.env.REDIS_PORT = '4000';

			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['-x', expect.stringMatching(/^\d+,\d+,\d+,\d+,\d+,4000/u)]), expect.anything());
		});

		it('prebuilds redis', async () => {
			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith('redis-server', ['--version']);
		});

		it('skips prebuilding redis if exists', async () => {
			files = { [path.resolve(homedir(), '.redis-prebuilt')]: true };

			await start({ redis: true });

			expect(execa).not.toHaveBeenCalledWith('redis', ['--version']);
		});

		it('throws on failed prebuild', async () => {
			execa.mockImplementation((command) => {
				if (command !== 'redis-server') {
					return Promise.resolve();
				}
				const err = new Error('Error Message');
				err.code = 1;

				throw err;
			});

			await expect(start({ redis: true })).rejects.toThrow('Something went wrong');
		});

		it('sets heroku redis addon variables', async () => {
			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.anything(),
				expect.objectContaining({
					env: expect.objectContaining({
						OPENREDIS_URL:  'redis://localhost:6379',
						REDISCLOUD_URL: 'redis://localhost:6379',
						REDISGREEN_URL: 'redis://localhost:6379',
						REDISTOGO_URL:  'redis://localhost:6379',
					}),
				})
			);
		});

		it('sets heroku redis addon variables with REDIS_PORT', async () => {
			process.env.REDIS_PORT = 4000;

			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith(
				'nf',
				expect.anything(),
				expect.objectContaining({
					env: expect.objectContaining({
						OPENREDIS_URL:  'redis://localhost:4000',
						REDISCLOUD_URL: 'redis://localhost:4000',
						REDISGREEN_URL: 'redis://localhost:4000',
						REDISTOGO_URL:  'redis://localhost:4000',
					}),
				})
			);
		});
	});
});

describe('ngrok', () => {
	const nameToUrl = {
		web:  'http://web-ngrok.ngrok.io',
		node: 'http://node-ngrok.ngrok.io',
	};

	beforeEach(() => {
		ngrok.connect.mockImplementation(({ name }) => nameToUrl[name]);
	});

	it('is disabled by default', async () => {
		await start();

		expect(ngrok.connect).not.toHaveBeenCalled();
	});

	it('can be enabled with web', async () => {
		await start({ ngrok: true, web: true });

		expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining({ name: 'web', addr: 3000 }));
	});

	it('can be enabled with node', async () => {
		await start({ ngrok: true, node: true });

		expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining({ name: 'node', addr: 4000 }));
	});

	it('can\'t be enabled if web and node are disabled', async () => {
		await start({ ngrok: true, web: false, node: false });

		expect(ngrok.connect).not.toHaveBeenCalled();
	});

	it('sets common ngrok values', async () => {
		await start({ ngrok: true, web: true, node: true });

		expect(ngrok.connect)
			.toHaveBeenCalledWith(expect.objectContaining({ bind_tls: true, host_header: 'localhost' })); // eslint-disable-line camelcase

		// Make sure opposite situations don't exist
		expect(ngrok.connect)
			.not.toHaveBeenCalledWith(expect.not.objectContaining({ bind_tls: true })); // eslint-disable-line camelcase
		expect(ngrok.connect)
			.not.toHaveBeenCalledWith(expect.not.objectContaining({ host_header: 'localhost' })); // eslint-disable-line camelcase
	});

	it('sets PUBLIC_URL with web', async () => {
		await start({ ngrok: true, web: true });

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ PUBLIC_URL: nameToUrl.web }) }));
	});

	it('sets REACT_APP_BACKEND_URL with node', async () => {
		await start({ ngrok: true, node: true });

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ REACT_APP_BACKEND_URL: nameToUrl.node }) }));
	});
});
