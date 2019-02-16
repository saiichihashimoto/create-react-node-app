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

	beforeEach(() => {
		execa.mockImplementation(() => Promise.resolve());
		execForeman.mockImplementation(() => Promise.resolve());
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

		it('executes with NODE_ENV=production', async () => {
			process.env.NODE_ENV = 'production';
			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib'], expect.anything());
		});

		it('uses lib/index.server.js', async () => {
			process.env.NODE_ENV = 'production';
			files = { './lib/index.server.js': true };

			await start();

			expect(execa).toHaveBeenCalledWith('node', ['lib/index.server'], expect.anything());
		});
	});

	describe('web', () => {
		it('is passed to execForeman', async () => {
			await start();

			expect(execForeman).toHaveBeenCalledWith(expect.objectContaining({ web: true }));
		});

		it('can be disabled', async () => {
			await start({ web: false });

			expect(execForeman).not.toHaveBeenCalledWith(expect.objectContaining({ web: true }));
		});
	});

	describe('server', () => {
		it('is passed to execForeman', async () => {
			await start();

			expect(execForeman).toHaveBeenCalledWith(expect.objectContaining({ server: true }));
		});

		it('can be disabled', async () => {
			await start({ server: false });

			expect(execForeman).not.toHaveBeenCalledWith(expect.objectContaining({ server: true }));
		});
	});

	describe('mongod', () => {
		it('is not passed to execForeman', async () => {
			await start();

			expect(execForeman).not.toHaveBeenCalledWith(expect.objectContaining({ mongod: true }));
		});

		it('can be enabled', async () => {
			await start({ mongod: true });

			expect(execForeman).toHaveBeenCalledWith(expect.objectContaining({ mongod: true }));
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
	});

	describe('redis', () => {
		it('is not passed to execForeman', async () => {
			await start();

			expect(execForeman).not.toHaveBeenCalledWith(expect.objectContaining({ redis: true }));
		});

		it('can be enabled', async () => {
			await start({ redis: true });

			expect(execForeman).toHaveBeenCalledWith(expect.objectContaining({ redis: true }));
		});

		it('prebuilds redis', async () => {
			await start({ redis: true });

			expect(execa).toHaveBeenCalledWith('redis-server', ['--version']);
		});

		it('skips prebuilding redis if exists', async () => {
			files = { [path.resolve(homedir(), '.redis-prebuilt')]: true };

			await start({ mongod: true });

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
	});

	describe('ngrok', () => {
		beforeEach(() => {
			ngrok.connect.mockImplementation(() => Promise.resolve('https://foo-bar.com'));
			opn.mockImplementation(() => Promise.resolve());
			setTimeout.mockImplementation((func) => func());
		});

		it('is not passed to execForeman', async () => {
			await start();

			expect(execForeman).not.toHaveBeenCalledWith(expect.objectContaining({ ngrok: true }));
		});

		it('can be enabled', async () => {
			await start({ ngrok: true });

			expect(execForeman).toHaveBeenCalledWith(expect.objectContaining({ ngrok: true }));
		});

		it('executes ngrok & opn', async () => {
			await start({ ngrok: true });

			expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining({ port: 3000 }));
			expect(opn).toHaveBeenCalledWith('https://foo-bar.com');
		});

		it('can\'t be enabled if web is disabled', async () => {
			await start({ ngrok: true, web: false });

			expect(execForeman).not.toHaveBeenCalledWith(expect.objectContaining({ ngrok: true }));
		});

		it('doesn\'t execute ngrok & opn with --no-web', async () => {
			await start({ ngrok: true, web: false });

			expect(ngrok.connect).not.toHaveBeenCalledWith(expect.objectContaining({ port: 3000 }));
			expect(opn).not.toHaveBeenCalledWith('https://foo-bar.com');
		});
	});
});
