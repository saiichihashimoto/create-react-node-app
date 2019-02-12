import execa from 'execa';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import start from './react-node-scripts-start';

jest.mock('execa');
jest.mock('fs');

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
					SKIP_PREFLIGHT_CHECK: true,
					...process.env,
					src:                  'src',
					PORT:                 3000,
					NODE_ENV:             'development',
					root:                 __dirname,
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
					SKIP_PREFLIGHT_CHECK: true,
					...process.env,
					src:                  'src',
					PORT:                 3000,
					NODE_ENV:             'development',
					root:                 __dirname,
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
					SKIP_PREFLIGHT_CHECK: true,
					...process.env,
					src:                  'src',
					PORT:                 3000,
					NODE_ENV:             'development',
					root:                 __dirname,
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
					SKIP_PREFLIGHT_CHECK: true,
					...process.env,
					src:                  'src',
					PORT:                 '5000',
					NODE_ENV:             'development',
					root:                 __dirname,
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
					SKIP_PREFLIGHT_CHECK: true,
					...process.env,
					src:                  'src/index.server',
					PORT:                 3000,
					NODE_ENV:             'development',
					root:                 __dirname,
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	});

	it('runs mongod on --mongod', async () => {
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
					MONGO_URL:            'mongodb://localhost:27017/database',
					SKIP_PREFLIGHT_CHECK: true,
					...process.env,
					src:                  'src',
					PORT:                 3000,
					NODE_ENV:             'development',
					root:                 __dirname,
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

	it('run `node lib` on NODE_ENV=production', async () => {
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

	it('run `node lib/index.server` on NODE_ENV=production', async () => {
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
