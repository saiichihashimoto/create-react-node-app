#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../package';

const reactNodeScripts = (args) => new Command()
	.version(version)
	.command('build', 'builds the app')
	.command('start', 'starts the app')
	.command('test', 'tests using `react-scripts test`')
	.parse(args);

/* istanbul ignore next line */
if (require.main === module) {
	reactNodeScripts(process.argv);
}
export default (...args) => reactNodeScripts([process.argv[0], __filename, ...args]);
