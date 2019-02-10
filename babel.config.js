const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent'); // eslint-disable-line import/no-extraneous-dependencies

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
				development: ['development', 'test'].includes(process.env.NODE_ENV),
				useBuiltIns: true,
			},
		],
	],
	plugins: [
		[
			'@babel/plugin-proposal-class-properties',
			{
				loose: true,
			},
		],

		[
			'extension-resolver',
			{
				extensions: ['.server.js', '.server.jsx', '.server.es6', '.server.es', '.server.mjs', '.js', '.jsx', '.es6', '.es', '.mjs'],
			},
		],
		[
			'css-modules-transform',
			{
				generateScopedName: (localName, resourcePath) => getCSSModuleLocalIdent({ resourcePath }, '[hash:base64]', localName, {}),
				extensions:         ['.module.css', '.module.scss'],
			},
		],
		'universal-dotenv',
	],
	env: {
		production: {
			plugins: [
				[
					'transform-react-remove-prop-types',
					{
						removeImport: true,
					},
				],
			],
		},
	},
};
