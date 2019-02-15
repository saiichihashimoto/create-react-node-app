import execa from 'execa';
import runTest from './react-node-scripts-test';

jest.mock('execa');

describe('react-node-scripts test', () => {
	execa.mockImplementation(() => Promise.resolve());

	afterEach(() => {
		execa.mockClear();
	});

	describe('react-scripts test', () => {
		it('executes', async () => {
			await expect(runTest()).resolves;

			expect(execa).toHaveBeenCalledWith(
				'react-scripts',
				['test', '--color'],
				expect.objectContaining({
					env: expect.objectContaining({
						SKIP_PREFLIGHT_CHECK: true,
					}),
				}),
			);
		});

		it('consumes arguments', async () => {
			await expect(runTest('arg1', 'arg2')).resolves;

			expect(execa).toHaveBeenCalledWith(
				'react-scripts',
				['test', '--color', 'arg1', 'arg2'],
				expect.objectContaining({
					env: expect.objectContaining({
						SKIP_PREFLIGHT_CHECK: true,
					}),
				}),
			);
		});
	});
});
