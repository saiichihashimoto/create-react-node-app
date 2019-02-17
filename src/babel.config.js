import getCSSModuleLocalIdent from 'react-dev-utils/getCSSModuleLocalIdent'; // eslint-disable-line import/no-extraneous-dependencies

const src = `${process.cwd()}/src`;
const {
	env: {
		PUBLIC_URL = '',
		NODE_ENV,
	},
} = process;

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
				development: ['development', 'test'].includes(NODE_ENV),
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
			'file-loader',
			{
				outputPath: null,
				publicPath: `${PUBLIC_URL || ''}/static/media`,
				name:       '[name].[hash:8].[ext]',
				extensions: ['bmp', 'gif', 'jpeg', 'jpg', 'png'],
				limit:      10000,
			},
		],
		[
			'file-loader',
			{
				outputPath: null,
				publicPath: `${PUBLIC_URL || ''}/static/media`,
				name:       '[name].[hash:8].[ext]',
				extensions: ['svg'],
			},
			'file-loader-for-svgs',
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
