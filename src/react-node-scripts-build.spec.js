import execa from 'execa';
import path from 'path';
import build from './react-node-scripts-build';

jest.mock('execa');

describe('react-node-scripts build', () => {
	execa.mockImplementation(() => Promise.resolve());

	beforeEach(() => {
		execa.mockClear();
	});

	it('executes build scripts', async () => {
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

		expect(execa).toHaveBeenCalledWith(
			'react-scripts',
			[
				'build',
				'--color',
			],
			{
				env: {
					...process.env,
					SKIP_PREFLIGHT_CHECK: true,
				},
			},
		);
	});

	it('doesn\'t execute babel with --no-server', async () => {
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

	it('doesn\'t execute react-scripts with --no-web', async () => {
		await build('--no-web');

		expect(execa).not.toHaveBeenCalledWith(
			'react-scripts',
			[
				'build',
				'--color',
			],
			{
				env: {
					...process.env,
					SKIP_PREFLIGHT_CHECK: true,
				},
			},
		);
	});
});
