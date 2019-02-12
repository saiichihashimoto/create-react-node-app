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
	let files = {};

	execa.mockImplementation(() => Promise.resolve());
	fs.existsSync.mockImplementation((filePath) => (
		Object.prototype.hasOwnProperty.call(files, filePath)
	));

	beforeEach(() => {
		files = {};
		execa.mockClear();
		fs.existsSync.mockClear();
	});

	it('executes foreman', async () => {
		await start();

		expect(execa).toHaveBeenCalledWith(
			'nf',
			[
				'start',

				'--procfile', path.resolve(__dirname, 'Procfile'),
				'web=1,server=1,mongod=0',
			],
			{
				env: {
					...process.env,
					NODE_ENV:             'development',
					PORT:                 3000,
					SKIP_PREFLIGHT_CHECK: true,
					root:                 __dirname,
					src:                  'src',
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	});

	it('excludes web on --no--web', async () => {
		await start('--no-web');

		expect(execa).toHaveBeenCalledWith(
			'nf',
			[
				'start',

				'--procfile', path.resolve(__dirname, 'Procfile'),
				'web=0,server=1,mongod=0',
			],
			{
				env: {
					...process.env,
					NODE_ENV:             'development',
					PORT:                 3000,
					SKIP_PREFLIGHT_CHECK: true,
					root:                 __dirname,
					src:                  'src',
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	});

	it('excludes server on --no--server', async () => {
		await start('--no-server');

		expect(execa).toHaveBeenCalledWith(
			'nf',
			[
				'start',

				'--procfile', path.resolve(__dirname, 'Procfile'),
				'web=1,server=0,mongod=0',
			],
			{
				env: {
					...process.env,
					NODE_ENV:             'development',
					PORT:                 3000,
					SKIP_PREFLIGHT_CHECK: true,
					root:                 __dirname,
					src:                  'src',
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	});

	it('uses PORT', async () => {
		process.env.PORT = 5000;

		await start('--no-server');

		expect(execa).toHaveBeenCalledWith(
			'nf',
			[
				'start',

				'--procfile', path.resolve(__dirname, 'Procfile'),
				'web=1,server=0,mongod=0',
			],
			{
				env: {
					...process.env,
					NODE_ENV:             'development',
					PORT:                 '5000',
					SKIP_PREFLIGHT_CHECK: true,
					root:                 __dirname,
					src:                  'src',
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);

		delete process.env.PORT;
	});

	it('runs on src/index.server.js', async () => {
		files = { './src/index.server.js': true };

		await start();

		expect(execa).toHaveBeenCalledWith(
			'nf',
			[
				'start',

				'--procfile', path.resolve(__dirname, 'Procfile'),
				'web=1,server=1,mongod=0',
			],
			{
				env: {
					...process.env,
					NODE_ENV:             'development',
					PORT:                 3000,
					SKIP_PREFLIGHT_CHECK: true,
					root:                 __dirname,
					src:                  'src/index.server',
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	});

	describe('NODE_ENV=production', () => {
		it('runs `node lib`', async () => {
			process.env.NODE_ENV = 'production';

			await start();

			expect(execa).toHaveBeenCalledWith(
				'node',
				[
					'lib',
				],
				{
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);

			delete process.env.NODE_ENV;
		});

		it('runs `node lib/index.server`', async () => {
			files = { './lib/index.server.js': true };
			process.env.NODE_ENV = 'production';

			await start();

			expect(execa).toHaveBeenCalledWith(
				'node',
				[
					'lib/index.server',
				],
				{
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);

			delete process.env.NODE_ENV;
		});
	});

	describe('--mongod', () => {
		it('runs mongod', async () => {
			await start('--mongod');

			expect(execa).toHaveBeenCalledWith(
				'mongod',
				[
					'--version',
				],
				{
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);

			expect(execa).toHaveBeenCalledWith(
				'nf',
				[
					'start',

					'--procfile', path.resolve(__dirname, 'Procfile'),
					'web=1,server=1,mongod=1',
				],
				{
					env: {
						...process.env,
						MONGO_URL:            'mongodb://localhost:27017/database',
						NODE_ENV:             'development',
						PORT:                 3000,
						SKIP_PREFLIGHT_CHECK: true,
						root:                 __dirname,
						src:                  'src',
					},
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);
		});

		it('doesn\'t rebuild over existing mongod', async () => {
			files = { [path.resolve(homedir(), '.mongodb-prebuilt')]: true };

			await start('--mongod');

			expect(execa).not.toHaveBeenCalledWith(
				'mongod',
				[
					'--version',
				],
				{
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);
		});
	});

	describe('--ngrok', () => {
		ngrok.connect.mockImplementation(() => Promise.resolve('https://foo-bar.com'));
		opn.mockImplementation(() => Promise.resolve());
		setTimeout.mockImplementation((func) => func());

		beforeEach(() => {
			ngrok.connect.mockClear();
			opn.mockClear();
			setTimeout.mockClear();
		});

		it('runs with BROWSER=none', async () => {
			await start('--ngrok');

			expect(execa).toHaveBeenCalledWith(
				'nf',
				[
					'start',

					'--procfile', path.resolve(__dirname, 'Procfile'),
					'web=1,server=1,mongod=0',
				],
				{
					env: {
						...process.env,
						BROWSER:                        'none',
						DANGEROUSLY_DISABLE_HOST_CHECK: true,
						NODE_ENV:                       'development',
						PORT:                           3000,
						SKIP_PREFLIGHT_CHECK:           true,
						root:                           __dirname,
						src:                            'src',
					},
					stdio: [process.stdin, process.stdout, process.stderr],
				},
			);
		});

		it('opens url in browser', async () => {
			await start('--ngrok');

			expect(ngrok.connect).toHaveBeenCalledWith({ port: 3000 });
			expect(opn).toHaveBeenCalledWith('https://foo-bar.com');
		});
	});
});
