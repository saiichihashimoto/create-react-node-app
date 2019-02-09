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
	plugins: [
		[
			'extension-resolver',
			{
				extensions: ['.server.js', '.server.jsx', '.server.es6', '.server.es', '.server.mjs', '.js', '.jsx', '.es6', '.es', '.mjs'],
			},
		],
		'universal-dotenv',
	],
};
