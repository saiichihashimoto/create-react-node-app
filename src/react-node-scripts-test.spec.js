import execa from 'execa';

import runTest from './react-node-scripts-test';

jest.mock('execa');

beforeEach(() => {
	execa.mockImplementation(() => Promise.resolve());
});

afterEach(() => {
	jest.resetAllMocks();
});

it('executes react-scripts test', async () => {
	await runTest();

	expect(execa).toHaveBeenCalledWith(
		'react-scripts',
		['test', '--color'],
		expect.objectContaining({
			env: expect.objectContaining({
				SKIP_PREFLIGHT_CHECK: true,
			}),
			stdio: 'inherit',
		})
	);
});

it('consumes arguments', async () => {
	await runTest(['arg1', 'arg2']);

	expect(execa).toHaveBeenCalledWith('react-scripts', ['test', '--color', 'arg1', 'arg2'], expect.anything());
});
