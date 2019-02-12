import execa from 'execa';
import path from 'path';
import build from './react-node-scripts-build';

jest.mock('execa');

describe('react-node-scripts build', () => {
	execa.mockImplementation(() => Promise.resolve());

	afterEach(() => {
		execa.mockClear();
	});

	describe('babel', () => {
		it('executes', async () => {
			await build();

			expect(execa).toHaveBeenCalledWith(
				'babel',
				[
					'src',

					'--out-dir', 'lib',
					'--config-file', path.resolve(__dirname, 'babel.config.js'),
					'--copy-files',
					'--delete-dir-on-start',
					'--no-babelrc',
					'--source-maps',
					'--verbose',
				],
				{
					env: {
						...process.env,
						NODE_ENV: 'production',
					},
				},
			);
		});

		it('--no-server', async () => {
			await build('--no-server');

			expect(execa).not.toHaveBeenCalledWith(
				'babel',
				[
					'src',

					'--out-dir', 'lib',
					'--config-file', path.resolve(__dirname, 'babel.config.js'),
					'--copy-files',
					'--delete-dir-on-start',
					'--no-babelrc',
					'--source-maps',
					'--verbose',
				],
				{
					env: {
						...process.env,
						NODE_ENV: 'production',
					},
				},
			);
		});
	});

	describe('react-scripts build', () => {
		const options = {
			env: {
				...process.env,
				SKIP_PREFLIGHT_CHECK: true,
			},
		};

		it('executes', async () => {
			await build();

			expect(execa).toHaveBeenCalledWith('react-scripts', ['build', '--color'], options);
		});

		it('--no-web', async () => {
			await build('--no-web');

			expect(execa).not.toHaveBeenCalledWith('react-scripts', ['build', '--color'], options);
		});
	});
});
