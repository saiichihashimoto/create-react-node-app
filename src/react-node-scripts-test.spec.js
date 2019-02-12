import execa from 'execa';
import runTest from './react-node-scripts-test';

jest.mock('execa');

describe('react-node-scripts test', () => {
	execa.mockImplementation(() => Promise.resolve());

	beforeEach(() => {
		execa.mockClear();
	});

	it('executes react-scripts', async () => {
		await expect(runTest()).resolves;

		expect(execa).toHaveBeenCalledWith(
			'react-scripts',
			[
				'test',
				'--color',
			],
			{
				env: {
					...process.env,
					SKIP_PREFLIGHT_CHECK: true,
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	});

	it('passes arguments through', async () => {
		await expect(runTest('arg1', 'arg2')).resolves;

		expect(execa).toHaveBeenCalledWith(
			'react-scripts',
			[
				'test',
				'--color',
				'arg1',
				'arg2',
			],
			{
				env: {
					...process.env,
					SKIP_PREFLIGHT_CHECK: true,
				},
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		);
	});
});
