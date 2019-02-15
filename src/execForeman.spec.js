import execa from 'execa';
import fs from 'fs';
import path from 'path';
import execForeman from './execForeman';

jest.mock('execa');
jest.mock('fs');

describe('execForeman', () => {
	let files = {};

	execa.mockImplementation(() => Promise.resolve());
	fs.existsSync.mockImplementation((filePath) => (
		Object.prototype.hasOwnProperty.call(files, filePath)
	));

	afterEach(() => {
		files = {};

		execa.mockClear();
	});

	it('executes foreman', async () => {
		await execForeman();

		expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['start']), expect.anything());
	});

	it('uses Procfile', async () => {
		const Procfile = path.resolve(__dirname, 'Procfile');
		let args;
		execa.mockImplementation((...input) => {
			[, args] = input;

			return Promise.resolve();
		});

		await execForeman();

		expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['--procfile', Procfile]), expect.anything());
		expect(args.indexOf(Procfile)).toBe(args.indexOf('--procfile') + 1);
	});

	it('streams to process', async () => {
		await execForeman();

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ stdio: [process.stdin, process.stdout, process.stderr] }));
	});

	it('sets PORT=3000', async () => {
		await execForeman();

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ PORT: 3000 }) }));
	});

	it('passes PORT through', async () => {
		process.env.PORT = 4000;

		await execForeman();

		expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ PORT: '4000' }) }));

		delete process.env.PORT;
	});

	describe('web', () => {
		it('is third in formation', async () => {
			await execForeman({ web: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['foo1=0,foo2=0,web=1']), expect.anything());
		});

		it('sets WEB_PORT_OFFSET=-200', async () => {
			await execForeman({ web: true });

			// 3000 + 200 - 200 = 3000
			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ WEB_PORT_OFFSET: -200 }) }));
		});

		it('sets SKIP_PREFLIGHT_CHECK=true', async () => {
			await execForeman({ web: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ SKIP_PREFLIGHT_CHECK: true }) }));
		});

		it('sets NODE_ENV=development', async () => {
			await execForeman();

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NODE_ENV: 'development' }) }));
		});
	});

	describe('server', () => {
		it('is first in formation', async () => {
			await execForeman({ server: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['server=1']), expect.anything());
		});

		it('sets SERVER_PORT_OFFSET=1000', async () => {
			await execForeman({ server: true });

			// 3000 + 0 + 1000 = 4000
			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ SERVER_PORT_OFFSET: 1000 }) }));
		});

		it('sets NODE_ENV=development', async () => {
			await execForeman({ server: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ NODE_ENV: 'development' }) }));
		});

		it('sets root=__dirname', async () => {
			await execForeman({ server: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ root: __dirname }) }));
		});

		it('sets src=src', async () => {
			await execForeman({ server: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ src: 'src' }) }));
		});

		it('sets src=src/index.server.js', async () => {
			files = { './src/index.server.js': true };

			await execForeman({ server: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ src: 'src/index.server' }) }));
		});
	});

	describe('mongod', () => {
		it('is fourth in formation', async () => {
			await execForeman({ mongod: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['foo1=0,foo2=0,foo3=0,mongod=1']), expect.anything());
		});

		it('sets MONGOD_PORT=27017', async () => {
			await execForeman({ mongod: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ MONGOD_PORT: 27017 }) }));
		});

		it('passes MONGOD_PORT through', async () => {
			process.env.MONGOD_PORT = '4000';

			await execForeman({ mongod: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ MONGOD_PORT: '4000' }) }));

			delete process.env.MONGOD_PORT;
		});

		it('sets heroku mongodb addon variables', async () => {
			await execForeman({ mongod: true });

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

		it('sets heroku mongod addon variables with REDIS_PORT', async () => {
			process.env.MONGOD_PORT = '4000';

			await execForeman({ mongod: true });

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
		it('is sixth in formation', async () => {
			await execForeman({ redis: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.arrayContaining(['foo1=0,foo2=0,foo3=0,foo4=0,foo5=0,redis=1']), expect.anything());
		});

		it('sets REDIS_PORT=6379', async () => {
			await execForeman({ redis: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ REDIS_PORT: 6379 }) }));
		});

		it('passes REDIS_PORT through', async () => {
			process.env.REDIS_PORT = '4000';

			await execForeman({ redis: true });

			// 4000 + 500 + 1779 = 6379
			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ REDIS_PORT: '4000' }) }));

			delete process.env.REDIS_PORT;
		});

		it('sets heroku redis addon variables', async () => {
			await execForeman({ redis: true });

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

			await execForeman({ redis: true });

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

	describe('ngrok', () => {
		it('sets DANGEROUSLY_DISABLE_HOST_CHECK=true', async () => {
			await execForeman({ ngrok: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ DANGEROUSLY_DISABLE_HOST_CHECK: true }) }));
		});

		it('sets BROWSER=none', async () => {
			await execForeman({ ngrok: true });

			expect(execa).toHaveBeenCalledWith('nf', expect.anything(), expect.objectContaining({ env: expect.objectContaining({ BROWSER: 'none' }) }));
		});
	});
});
