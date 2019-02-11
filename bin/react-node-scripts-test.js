#!/usr/bin/env node
const execa = require('execa');

execa(
	'react-scripts',
	[
		'test',
		'--color',
		...process.argv.slice(2),
	],
	{
		env: {
			...process.env,
			SKIP_PREFLIGHT_CHECK: true,
		},
		stdio: [process.stdin, process.stdout, process.stderr],
	},
);
