#!/usr/bin/env node
import execa from 'execa';

function runTest(args) {
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
			stdio: [process.stdin, process.stdout, process.stderr],
		},
	);
}

/* istanbul ignore next line */
if (require.main === module) {
	runTest(process.argv.slice(2))
		.catch(({ code }) => process.exit(code || 1));
}
export default (...args) => runTest(args);
