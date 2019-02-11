import getCSSModuleLocalIdent from 'react-dev-utils/getCSSModuleLocalIdent'; // eslint-disable-line import/no-extraneous-dependencies

const src = `${process.cwd()}/src`;

export default {
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
		'transform-dynamic-import',
		[
			'extension-resolver',
			{
				extensions: [
					'.server.js',
					'.server.jsx',
					'.server.es6',
					'.server.es',
					'.server.mjs',
					'.js',
					'.jsx',
					'.es6',
					'.es',
					'.mjs',
				],
			},
		],
		[
			'css-modules-transform',
			{
				extensions: [
					'.module.css',
					'.module.scss',
				],
				generateScopedName: (localName, resourcePath) => getCSSModuleLocalIdent({ resourcePath }, '[hash:base64]', localName, {}),
			},
		],
		[
			'transform-assets',
			{
				extensions: [
					'bmp',
					'gif',
					'jpeg',
					'jpg',
					'png',
				],
				name:  `${process.env.PUBLIC_URL || ''}/static/media/[name].[hash:8].[ext]`,
				limit: 10000,
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
