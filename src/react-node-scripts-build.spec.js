import path from 'path';

import execa from 'execa';

import build from './react-node-scripts-build';

jest.mock('execa');

beforeEach(() => {
	execa.mockImplementation(() => Promise.resolve());
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('babel', () => {
	it('executes', async () => {
		await build();

		expect(execa).toHaveBeenCalledWith(
			'babel',
			[
				'src',

				'--out-dir',
				'lib',
				'--config-file',
				path.resolve(__dirname, 'babel.config.js'),
				'--copy-files',
				'--delete-dir-on-start',
				'--no-babelrc',
				'--source-maps',
				'--verbose',
			],
			expect.objectContaining({
				env: expect.objectContaining({
					NODE_ENV: 'production',
				}),
			})
		);
	});

	it('can be disabled', async () => {
		await build({ node: false });

		expect(execa).not.toHaveBeenCalledWith(
			'babel',
			[
				'src',

				'--out-dir',
				'lib',
				'--config-file',
				path.resolve(__dirname, 'babel.config.js'),
				'--copy-files',
				'--delete-dir-on-start',
				'--no-babelrc',
				'--source-maps',
				'--verbose',
			],
			expect.objectContaining({
				env: expect.objectContaining({
					NODE_ENV: 'production',
				}),
			})
		);
	});
});

describe('react-scripts build', () => {
	it('executes', async () => {
		await build();

		expect(execa).toHaveBeenCalledWith(
			'react-scripts',
			['build', '--color'],
			expect.objectContaining({
				env: expect.objectContaining({
					SKIP_PREFLIGHT_CHECK: true,
				}),
			})
		);
	});

	it('can be disabled', async () => {
		await build({ web: false });

		expect(execa).not.toHaveBeenCalledWith(
			'react-scripts',
			['build', '--color'],
			expect.objectContaining({
				env: expect.objectContaining({
					SKIP_PREFLIGHT_CHECK: true,
				}),
			})
		);
	});
});
