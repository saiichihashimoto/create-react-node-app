import clearConsole from 'react-dev-utils/clearConsole'; // eslint-disable-line import/no-extraneous-dependencies
import execa from 'execa';
import fs from 'fs';
import ngrok from 'ngrok';
import path from 'path';
import { homedir } from 'os';
import start from './react-node-scripts-start';

jest.mock('execa');
jest.mock('fs');
jest.mock('ngrok');
jest.mock('react-dev-utils/clearConsole');

describe('react-node-scripts start', () => {
	let files = {};

	beforeEach(() => {
		execa.mockImplementation(() => Promise.resolve());
		fs.existsSync.mockImplementation((filePath) => (
			Object.prototype.hasOwnProperty.call(files, filePath)
		));
	});

	afterEach(() => {
		files = {};

		jest.resetAllMocks();
	});

	describe('node', () => {
		const NODE_ENV_BEFORE = process.env.NODE_ENV;

		afterEach(() => {
			process.env.NODE_ENV = NODE_ENV_BEFORE;
		});

		it('doesn\'t execute', async () => {
			await start();

			expect(execa).not.toHaveBeenCalledWith('node', ['lib'], expect.anything());
		});

		it('executes if NODE_ENV=production', async () => {
			process.env.NODE_ENV = 'production';
			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib'], expect.objectContaining({ stdio: 'inherit' }));
		});

		it('uses lib/index.node.js', async () => {
			process.env.NODE_ENV = 'production';
			files = { './lib/index.node.js': true };

			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib/index.node'], expect.anything());
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

		it('sets PORT=3000', async () => {
			await start();

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ PORT: 3000 }) }));
		});

		it('uses defined PORT', async () => {
			process.env.PORT = 4000;

			await start();

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ PORT: '4000' }) }));

			delete process.env.PORT;
		});

		describe('output', () => {
			const beforeIsTTY = process.stdout.isTTY;

			afterEach(() => {
				process.stdout.isTTY = beforeIsTTY;
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

				expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^\w+=\d,\w+=\d,web=1/)]), expect.anything());
			});

			it('sets WEB_PORT_OFFSET=-200', async () => {
				await start({ web: true });

				// 3000 + 200 - 200 = 3000
				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ WEB_PORT_OFFSET: -200 }) }));
			});

			it('sets SKIP_PREFLIGHT_CHECK=true', async () => {
				await start({ web: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ SKIP_PREFLIGHT_CHECK: true }) }));
			});

			it('sets NODE_ENV=development', async () => {
				await start({ web: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NODE_ENV: 'development' }) }));
			});

			it('unsets PUBLIC_URL', async () => {
				process.env.PUBLIC_URL = 'something';

				await start({ web: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.not.objectContaining({ PUBLIC_URL: expect.anything() }) }));

				process.env.PUBLIC_URL = undefined;
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

				expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^node=1/)]), expect.anything());
			});

			it('sets NODE_PORT_OFFSET=1000', async () => {
				await start({ node: true });

				// 3000 + 0 + 1000 = 4000
				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NODE_PORT_OFFSET: 1000 }) }));
			});

			it('sets NODE_ENV=development', async () => {
				await start({ node: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NODE_ENV: 'development' }) }));
			});

			it('unsets PUBLIC_URL', async () => {
				process.env.PUBLIC_URL = 'something';

				await start({ node: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.not.objectContaining({ PUBLIC_URL: expect.anything() }) }));

				process.env.PUBLIC_URL = undefined;
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

				expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^\w+=\d,\w+=\d,\w+=\d,mongod=1/)]), expect.anything());
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

			it('sets MONGOD_PORT=27017', async () => {
				await start({ mongod: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ MONGOD_PORT: 27017 }) }));
			});

			it('uses defined MONGOD_PORT', async () => {
				process.env.MONGOD_PORT = '4000';

				await start({ mongod: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ MONGOD_PORT: '4000' }) }));

				delete process.env.MONGOD_PORT;
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
					}),
				);
			});

			it('sets heroku mongod addon variables with MONGOD_PORT', async () => {
				process.env.MONGOD_PORT = '4000';

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
					}),
				);

				delete process.env.MONGOD_PORT;
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

				expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining([expect.stringMatching(/^\w+=\d,\w+=\d,\w+=\d,\w+=\d,\w+=\d,redis=1/)]), expect.anything());
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

			it('sets REDIS_PORT=6379', async () => {
				await start({ redis: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ REDIS_PORT: 6379 }) }));
			});

			it('uses defined REDIS_PORT', async () => {
				process.env.REDIS_PORT = '4000';

				await start({ redis: true });

				// 4000 + 500 + 1779 = 6379
				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ REDIS_PORT: '4000' }) }));

				delete process.env.REDIS_PORT;
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
					}),
				);
			});

			it('sets heroku redis addon variables with REDIS_PORT', async () => {
				process.env.REDIS_PORT = '4000';

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
					}),
				);

				delete process.env.REDIS_PORT;
			});
		});
	});

	describe('ngrok', () => {
		const previousBrowser = process.env.BROWSER;
		const previousHttps = process.env.HTTPS;

		beforeEach(() => {
			ngrok.connect.mockImplementation(() => Promise.resolve('https://foo-bar.com'));
		});

		afterEach(() => {
			process.env.BROWSER = previousBrowser;
			process.env.HTTPS = previousHttps;
		});

		it('is disabled by default', async () => {
			await start({ web: false });

			expect(ngrok.connect).not.toHaveBeenCalled();
		});

		it('can be enabled', async () => {
			await start({ ngrok: true, web: true });

			expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining({ port: 3000, host_header: 'localhost' }));
		});

		it('can\'t be enabled if web is disabled', async () => {
			await start({ ngrok: true, web: false });

			expect(ngrok.connect).not.toHaveBeenCalled();
		});

		it('sets bind_tls=false', async () => {
			await start({ ngrok: true, web: true });

			expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining({ bind_tls: false }));
		});

		it('sets bind_tls=true if HTTPS=true', async () => {
			process.env.HTTPS = 'true';

			await start({ ngrok: true, web: true });

			expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining({ bind_tls: true }));
		});

		describe('foreman', () => {
			it('sets BROWSER=open-ngrok.js', async () => {
				await start({ ngrok: true, web: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ BROWSER: path.resolve(__dirname, 'open-ngrok.js') }) }));
			});

			it('sets REAL_BROWSER=$BROWSER', async () => {
				process.env.BROWSER = 'some browser';

				await start({ ngrok: true, web: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ REAL_BROWSER: 'some browser' }) }));
			});

			it('sets HTTPS=false', async () => {
				await start({ ngrok: true, web: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ HTTPS: false }) }));
			});

			it('sets NGROK_URL', async () => {
				await start({ ngrok: true, web: true });

				expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NGROK_URL: 'https://foo-bar.com' }) }));
			});
		});
	});
});
