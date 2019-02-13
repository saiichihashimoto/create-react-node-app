import execa from 'execa';
import fs from 'fs';
import path from 'path';
import execForeman from './execForeman';

jest.mock('execa');
jest.mock('fs');

describe('execForeman', () => {
	let files = {};
	let command;
	let args;
	let options;

	execa.mockImplementation((...input) => {
		[command, args, options] = input;

		return Promise.resolve();
	});

	fs.existsSync.mockImplementation((filePath) => (
		Object.prototype.hasOwnProperty.call(files, filePath)
	));

	afterEach(() => {
		files = {};
		[command, args, options] = [];

		execa.mockClear();
	});

	it('executes foreman', async () => {
		await execForeman();

		expect(execa).toHaveBeenCalledTimes(1);
		expect(command).toBe('nf');
		expect(args).toHaveProperty('0', 'start');
	});

	it('uses Procfile', async () => {
		const Procfile = path.resolve(__dirname, 'Procfile');

		await execForeman();

		expect(args).toContain('--procfile');
		expect(args).toContain(Procfile);
		expect(args.indexOf(Procfile)).toBe(args.indexOf('--procfile') + 1);
	});

	it('streams to process', async () => {
		await execForeman();

		expect(options).toHaveProperty('stdio', [process.stdin, process.stdout, process.stderr]);
	});

	it('sets PORT=3000', async () => {
		await execForeman();

		expect(options).toHaveProperty('env.PORT', 3000);
	});

	it('passes PORT through', async () => {
		process.env.PORT = '4000';

		await execForeman();

		expect(options).toHaveProperty('env.PORT', '4000');

		delete process.env.PORT;
	});

	describe('web', () => {
		it('is third in formation', async () => {
			await execForeman({ web: true });

			expect(args).toContain('foo1=0,foo2=0,web=1');
		});

		it('sets WEB_PORT_OFFSET=-200', async () => {
			await execForeman({ web: true });

			// 3000 + 200 - 200 = 3000
			expect(options).toHaveProperty('env.WEB_PORT_OFFSET', -200);
		});

		it('sets SKIP_PREFLIGHT_CHECK=true', async () => {
			await execForeman({ web: true });

			expect(options).toHaveProperty('env.SKIP_PREFLIGHT_CHECK', true);
		});

		it('sets NODE_ENV=development', async () => {
			await execForeman();

			expect(options).toHaveProperty('env.NODE_ENV', 'development');
		});
	});

	describe('server', () => {
		it('is first in formation', async () => {
			await execForeman({ server: true });

			expect(args).toContain('server=1');
		});

		it('sets SERVER_PORT_OFFSET=1000', async () => {
			await execForeman({ server: true });

			// 3000 + 0 + 1000 = 4000
			expect(options).toHaveProperty('env.SERVER_PORT_OFFSET', 1000);
		});

		it('sets NODE_ENV=development', async () => {
			await execForeman({ server: true });

			expect(options).toHaveProperty('env.NODE_ENV', 'development');
		});

		it('sets root=__dirname', async () => {
			await execForeman({ server: true });

			expect(options).toHaveProperty('env.root', __dirname);
		});

		it('sets src=src', async () => {
			await execForeman({ server: true });

			expect(options).toHaveProperty('env.src', 'src');
		});

		it('sets src=src/index.server.js', async () => {
			files = { './src/index.server.js': true };

			await execForeman({ server: true });

			expect(options).toHaveProperty('env.src', 'src/index.server');
		});
	});

	describe('mongod', () => {
		it('is fourth in formation', async () => {
			await execForeman({ mongod: true });

			expect(args).toContain('foo1=0,foo2=0,foo3=0,mongod=1');
		});

		it('sets MONGOD_PORT=27017', async () => {
			await execForeman({ mongod: true });

			expect(options).toHaveProperty('env.MONGOD_PORT', 27017);
		});

		it('passes MONGOD_PORT through', async () => {
			process.env.MONGOD_PORT = '4000';

			await execForeman({ mongod: true });

			expect(options).toHaveProperty('env.MONGOD_PORT', '4000');

			delete process.env.MONGOD_PORT;
		});

		it('sets heroku mongodb addon variables', async () => {
			await execForeman({ mongod: true });

			expect(options).toHaveProperty('env.MONGODB_URI', 'mongodb://localhost:27017/database');
			expect(options).toHaveProperty('env.MONGOHQ_URL', 'mongodb://localhost:27017/database');
			expect(options).toHaveProperty('env.ORMONGO_URL', 'mongodb://localhost:27017/database');
		});

		it('sets heroku mongod addon variables with REDIS_PORT', async () => {
			process.env.MONGOD_PORT = '4000';

			await execForeman({ mongod: true });

			expect(options).toHaveProperty('env.MONGODB_URI', 'mongodb://localhost:4000/database');
			expect(options).toHaveProperty('env.MONGOHQ_URL', 'mongodb://localhost:4000/database');
			expect(options).toHaveProperty('env.ORMONGO_URL', 'mongodb://localhost:4000/database');

			delete process.env.MONGOD_PORT;
		});
	});

	describe('redis', () => {
		it('is sixth in formation', async () => {
			await execForeman({ redis: true });

			expect(args).toContain('foo1=0,foo2=0,foo3=0,foo4=0,foo5=0,redis=1');
		});

		it('sets REDIS_PORT=6379', async () => {
			await execForeman({ redis: true });

			expect(options).toHaveProperty('env.REDIS_PORT', 6379);
		});

		it('passes REDIS_PORT through', async () => {
			process.env.REDIS_PORT = '4000';

			await execForeman({ redis: true });

			// 4000 + 500 + 1779 = 6379
			expect(options).toHaveProperty('env.REDIS_PORT', '4000');

			delete process.env.REDIS_PORT;
		});

		it('sets heroku redis addon variables', async () => {
			await execForeman({ redis: true });

			expect(options).toHaveProperty('env.OPENREDIS_URL', 'redis://localhost:6379');
			expect(options).toHaveProperty('env.REDISCLOUD_URL', 'redis://localhost:6379');
			expect(options).toHaveProperty('env.REDISGREEN_URL', 'redis://localhost:6379');
			expect(options).toHaveProperty('env.REDISTOGO_URL', 'redis://localhost:6379');
		});

		it('sets heroku redis addon variables with REDIS_PORT', async () => {
			process.env.REDIS_PORT = '4000';

			await execForeman({ redis: true });

			expect(options).toHaveProperty('env.OPENREDIS_URL', 'redis://localhost:4000');
			expect(options).toHaveProperty('env.REDISCLOUD_URL', 'redis://localhost:4000');
			expect(options).toHaveProperty('env.REDISGREEN_URL', 'redis://localhost:4000');
			expect(options).toHaveProperty('env.REDISTOGO_URL', 'redis://localhost:4000');

			delete process.env.REDIS_PORT;
		});
	});

	describe('ngrok', () => {
		it('sets DANGEROUSLY_DISABLE_HOST_CHECK=true', async () => {
			await execForeman({ ngrok: true });

			expect(options).toHaveProperty('env.DANGEROUSLY_DISABLE_HOST_CHECK', true);
		});

		it('sets BROWSER=none', async () => {
			await execForeman({ ngrok: true });

			expect(options).toHaveProperty('env.BROWSER', 'none');
		});
	});
});
