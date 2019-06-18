import getCSSModuleLocalIdent from 'react-dev-utils/getCSSModuleLocalIdent'; // eslint-disable-line import/no-extraneous-dependencies
import paths, { moduleFileExtensions } from 'react-scripts/config/paths';

const src = `${process.cwd()}/src`;
const {
	env: {
		NODE_ENV,
	},
} = process;

const publicPath = (NODE_ENV === 'production') ? paths.servedPath : '/';

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
		[
			'transform-dynamic-import',
		],
		[
			'extension-resolver',
			{
				extensions: moduleFileExtensions
					.map((ext) => `.${ext.replace(/web\./, 'node.')}`),
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
				publicPath: `${publicPath}static/media`,
				name:       '[name].[hash:8].[ext]',
				extensions: ['bmp', 'gif', 'jpeg', 'jpg', 'png'],
				limit:      10000,
			},
		],
		[
			'file-loader',
			{
				outputPath: null,
				publicPath: `${publicPath}static/media`,
				name:       '[name].[hash:8].[ext]',
				extensions: ['svg'],
			},
			'file-loader-for-svgs',
		],
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
				[
					'universal-dotenv',
				],
			],
		},
	},
};
