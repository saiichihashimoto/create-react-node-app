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
				expect.objectContaining({
					env: expect.objectContaining({
						NODE_ENV: 'production',
					}),
				}),
			);
		});

		it('an be disabled', async () => {
			await build({ server: false });

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
				expect.objectContaining({
					env: expect.objectContaining({
						NODE_ENV: 'production',
					}),
				}),
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
				}),
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
				}),
			);
		});
	});
});
