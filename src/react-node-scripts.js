#!/usr/bin/env node
import { Command } from 'commander';
import updateNotifier from 'update-notifier';

import pkg from '../package';

const reactNodeScripts = (args) => new Command()
	.version(pkg.version)
	.command('build', 'builds the app')
	.command('start', 'starts the app')
	.command('test', 'tests using `react-scripts test`')
	.parse(args);

/* istanbul ignore next line */
if (require.main === module) {
	updateNotifier({ pkg }).notify();

	reactNodeScripts(process.argv);
}

export default (...args) => reactNodeScripts([process.argv[0], __filename, ...args]);
