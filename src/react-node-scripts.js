#!/usr/bin/env node
import program from 'commander';
import { version } from '../package';

const reactNodeScripts = program
	.version(version)
	.command('build', 'builds the app')
	.command('start', 'starts the app')
	.command('test', 'tests using `react-scripts test`');

/* istanbul ignore next line */
if (require.main === module) {
	reactNodeScripts.parse(process.argv);
}
export default (...args) => reactNodeScripts.parse([process.argv[0], __filename, ...args]);
