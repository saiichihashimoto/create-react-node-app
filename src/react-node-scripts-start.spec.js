import execa from 'execa';
import fs from 'fs';
import ngrok from 'ngrok';
import opn from 'opn';
import path from 'path';
import { homedir } from 'os';
import start from './react-node-scripts-start';

jest.mock('execa');
jest.mock('fs');
jest.mock('ngrok');
jest.mock('opn');
jest.useFakeTimers();

describe('react-node-scripts start', () => {
	const stdio = [process.stdin, process.stdout, process.stderr];

	let files = {};
	execa.mockImplementation(() => Promise.resolve());
	fs.existsSync.mockImplementation((filePath) => (
		Object.prototype.hasOwnProperty.call(files, filePath)
	));

	afterEach(() => {
		files = {};
		execa.mockClear();
		fs.existsSync.mockClear();
	});

	describe('foreman', () => {
		const Procfile = path.resolve(__dirname, 'Procfile');
		const env = {
			...process.env,
			NODE_ENV:             'development',
			PORT:                 3000,
			SKIP_PREFLIGHT_CHECK: true,
			root:                 __dirname,
			src:                  'src',
		};

		it('executes', async () => {
			await start();

			expect(execa).toHaveBeenCalledWith(
				'nf',
				['start', '--procfile', Procfile, 'web=1,server=1,cyan=0,mongod=0,yellow=0,redis=0'],
				{ stdio, env },
			);
		});
		it('--no--web', async () => {
			await start('--no-web');

			expect(execa).toHaveBeenCalledWith(
				'nf',
				['start', '--procfile', Procfile, 'web=0,server=1,cyan=0,mongod=0,yellow=0,redis=0'],
				{ stdio, env },
			);
		});

		it('--no--server', async () => {
			await start('--no-server');

			expect(execa).toHaveBeenCalledWith(
				'nf',
				['start', '--procfile', Procfile, 'web=1,server=0,cyan=0,mongod=0,yellow=0,redis=0'],
				{ stdio, env },
			);
		});

		it('src/index.server.js', async () => {
			files = { './src/index.server.js': true };

			await start();

			expect(execa).toHaveBeenCalledWith(
				'nf',
				['start', '--procfile', Procfile, 'web=1,server=1,cyan=0,mongod=0,yellow=0,redis=0'],
				{
					stdio,
					env: {
						...env,
						src: 'src/index.server',
					},
				},
			);
		});

		describe('--mongod', () => {
			it('has mongod=1', async () => {
				await start('--mongod');

				expect(execa).toHaveBeenCalledWith(
					'nf',
					['start', '--procfile', Procfile, 'web=1,server=1,cyan=0,mongod=1,yellow=0,redis=0'],
					{
						stdio,
						env: {
							...env,
							MONGODB_URI: 'mongodb://localhost:27017/database',
							MONGOHQ_URL: 'mongodb://localhost:27017/database',
							ORMONGO_URL: 'mongodb://localhost:27017/database',
						},
					},
				);
			});

			it('prebuilds mongod', async () => {
				await start('--mongod');

				expect(execa).toHaveBeenCalledWith('mongod', ['--version']);
			});

			it('skips prebuilding mongod if exists', async () => {
				files = { [path.resolve(homedir(), '.mongodb-prebuilt')]: true };

				await start('--mongod');

				expect(execa).not.toHaveBeenCalledWith('mongod', ['--version']);
			});

			it('throw on failed prebuild', async () => {
				execa.mockImplementation((command) => {
					if (command !== 'mongod') {
						return Promise.resolve();
					}
					const err = new Error('Error Message');
					err.code = 1;

					throw err;
				});

				await expect(start('--mongod')).rejects.toThrow('Something went wrong');
			});
		});

		describe('--redis', () => {
			it('has redis=1', async () => {
				await start('--redis');

				expect(execa).toHaveBeenCalledWith(
					'nf',
					['start', '--procfile', Procfile, 'web=1,server=1,cyan=0,mongod=0,yellow=0,redis=1'],
					{
						stdio,
						env: {
							...env,
							OPENREDIS_URL:  'redis://localhost:6379',
							REDISCLOUD_URL: 'redis://localhost:6379',
							REDISGREEN_URL: 'redis://localhost:6379',
							REDISTOGO_URL:  'redis://localhost:6379',
							REDIS_URL:      'redis://localhost:6379',
						},
					},
				);
			});
		});

		describe('--ngrok', () => {
			ngrok.connect.mockImplementation(() => Promise.resolve('https://foo-bar.com'));
			opn.mockImplementation(() => Promise.resolve());
			setTimeout.mockImplementation((func) => func());

			afterEach(() => {
				ngrok.connect.mockClear();
				opn.mockClear();
				setTimeout.mockClear();
			});

			it('executes ngrok & opn', async () => {
				await start('--ngrok');

				expect(ngrok.connect).toHaveBeenCalledWith({ port: 3000 });
				expect(opn).toHaveBeenCalledWith('https://foo-bar.com');
			});

			it('sets BROWSER=none', async () => {
				await start('--ngrok');

				expect(execa).toHaveBeenCalledWith(
					'nf',
					['start', '--procfile', Procfile, 'web=1,server=1,cyan=0,mongod=0,yellow=0,redis=0'],
					{
						stdio,
						env: {
							...env,
							BROWSER:                        'none',
							DANGEROUSLY_DISABLE_HOST_CHECK: true,
						},
					},
				);
			});
		});
	});

	describe('NODE_ENV=production', () => {
		const NODE_ENV_BEFORE = process.env.NODE_ENV;

		beforeAll(() => {
			process.env.NODE_ENV = 'production';
		});

		afterAll(() => {
			process.env.NODE_ENV = NODE_ENV_BEFORE;
		});

		it('executes `node lib`', async () => {
			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib'], { stdio });
		});

		it('lib/index.server.js', async () => {
			files = { './lib/index.server.js': true };
			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib/index.server'], { stdio });
		});
	});
});
