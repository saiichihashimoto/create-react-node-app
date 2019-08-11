import path from 'path';

import Listr from 'listr';
import execa from 'execa';

export default function build({ web = true, node = true } = {}) {
	return new Listr(
		[
			{
				title: 'node',
				skip:  () => !node,
				task:  () => execa(
					'babel',
					[
						'src',

						'--out-dir',
						'lib',
						'--config-file',
						path.resolve(__dirname, 'babel.config.js'),
						'--copy-files',
						'--delete-dir-on-start',
						'--no-babelrc',
						'--source-maps',
						'--verbose',
					],
					{
						env: {
							...process.env,
							NODE_ENV: 'production',
						},
					}
				),
			},
			{
				title: 'web',
				skip:  () => !web,
				task:  () => execa(
					'react-scripts',
					[
						'build',
						'--color',
					],
					{
						env: {
							...process.env,
							SKIP_PREFLIGHT_CHECK: true,
						},
					}
				),
			},
		],
		{
			renderer:    process.env.NODE_ENV === 'test' ? 'silent' : /* istanbul ignore next */ 'default',
			exitOnError: false,
			concurrent:  true,
		}
	)
		.run([]);
}
