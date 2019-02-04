const src = `${process.cwd()}/src`;

module.exports = {
	only: [
		`${src}/**/*.js`,
	],
	ignore: [
		`${src}/**/*.spec.js`,
		`${src}/**/*.test.js`,
		`${src}/**/*.web.js`,
		`${src}/setupTests.js`,
	],
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: 'current',
				},
			},
		],
	],
};
