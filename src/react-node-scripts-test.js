import execa from 'execa';

export default function runTest(args = []) {
	return execa(
		'react-scripts',
		[
			'test',
			'--color',
			...args,
		],
		{
			env: {
				...process.env,
				SKIP_PREFLIGHT_CHECK: true,
			},
			stdio: 'inherit',
		}
	);
}
