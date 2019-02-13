import execa from 'execa';
import fs from 'fs';
import ngrok from 'ngrok';
import opn from 'opn';
import path from 'path';
import { homedir } from 'os';
import execForeman from './execForeman';
import start from './react-node-scripts-start';

jest.mock('./execForeman');
jest.mock('execa');
jest.mock('fs');
jest.mock('ngrok');
jest.mock('opn');
jest.useFakeTimers();

describe('react-node-scripts start', () => {
	let files = {};
	let foremanArgs;

	execa.mockImplementation(() => Promise.resolve());
	execForeman.mockImplementation((args) => {
		foremanArgs = args;

		return Promise.resolve();
	});

	fs.existsSync.mockImplementation((filePath) => (
		Object.prototype.hasOwnProperty.call(files, filePath)
	));

	afterEach(() => {
		files = {};
		foremanArgs = undefined;

		execa.mockClear();
		execForeman.mockClear();
		fs.existsSync.mockClear();
	});

	describe('node', () => {
		const NODE_ENV_BEFORE = process.env.NODE_ENV;
		const stdio = [process.stdin, process.stdout, process.stderr];

		afterEach(() => {
			process.env.NODE_ENV = NODE_ENV_BEFORE;
		});

		it('doesn\'t execute', async () => {
			await start();

			expect(execa).not.toHaveBeenCalledWith('node', ['lib'], { stdio });
		});

		it('executes with NODE_ENV=production', async () => {
			process.env.NODE_ENV = 'production';
			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib'], { stdio });
		});

		it('uses lib/index.server.js', async () => {
			process.env.NODE_ENV = 'production';
			files = { './lib/index.server.js': true };

			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib/index.server'], { stdio });
		});
	});

	describe('web', () => {
		it('is passed to execForeman', async () => {
			await start();

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.web).toBeTruthy();
		});

		it('is not passed with --no-web', async () => {
			await start('--no-web');

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.web).toBeFalsy();
		});
	});

	describe('server', () => {
		it('is passed to execForeman', async () => {
			await start();

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.server).toBeTruthy();
		});

		it('is not passed with --no-server', async () => {
			await start('--no-server');

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.server).toBeFalsy();
		});
	});

	describe('mongod', () => {
		it('is not passed to execForeman', async () => {
			await start();

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.mongod).toBeFalsy();
		});

		it('is passed with --mongod', async () => {
			await start('--mongod');

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.mongod).toBeTruthy();
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

	describe('redis', () => {
		it('is not passed to execForeman', async () => {
			await start();

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.redis).toBeFalsy();
		});

		it('is passed with --redis', async () => {
			await start('--redis');

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.redis).toBeTruthy();
		});

		it.todo('prebuilds redis');

		it.todo('skips prebuilding redis if exists');
	});

	describe('ngrok', () => {
		ngrok.connect.mockImplementation(() => Promise.resolve('https://foo-bar.com'));
		opn.mockImplementation(() => Promise.resolve());
		setTimeout.mockImplementation((func) => func());

		afterEach(() => {
			ngrok.connect.mockClear();
			opn.mockClear();
			setTimeout.mockClear();
		});

		it('is not passed to execForeman', async () => {
			await start();

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.ngrok).toBeFalsy();
		});

		it('is passed with --ngrok', async () => {
			await start('--ngrok');

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.ngrok).toBeTruthy();
		});

		it('executes ngrok & opn', async () => {
			await start('--ngrok');

			expect(ngrok.connect).toHaveBeenCalledWith({ port: 3000 });
			expect(opn).toHaveBeenCalledWith('https://foo-bar.com');
		});

		it('is not passed with --no-web', async () => {
			await start('--ngrok', '--no-web');

			expect(execForeman).toHaveBeenCalled();
			expect(foremanArgs.ngrok).toBeFalsy();
		});

		it('doesn\'t execute ngrok & opn with --no-web', async () => {
			await start('--ngrok', '--no-web');

			expect(ngrok.connect).not.toHaveBeenCalledWith({ port: 3000 });
			expect(opn).not.toHaveBeenCalledWith('https://foo-bar.com');
		});
	});
});
