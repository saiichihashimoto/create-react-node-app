const src = `${process.cwd()}/src`;

module.exports = {
	only: [
		`${src}/**/*.js`,
	],
	ignore: [
		`${src}/**/*.spec.js`,
		`${src}/**/*.test.js`,
		`${src}/**/*.web.js`,
		`${src}/setupProxy.js`,
		`${src}/setupTests.js`,
	],
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: 'current',
				},
				ignoreBrowserslistConfig: true,
			},
		],
		[
			'@babel/preset-react',
			{
				development: process.env.NODE_ENV === 'development',
				useBuiltIns: true,
			},
		],
	],
	env: {
		production: {
			plugins: [
				'transform-node-env-inline',
			],
		},
	},
};
