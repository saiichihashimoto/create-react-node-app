#!/usr/bin/env node
/* istanbul ignore file */
import updateNotifier from 'update-notifier';
import { Command } from 'commander';

import pkg from '../package';

import reactNodeScriptsBuild from './react-node-scripts-build';
import reactNodeScriptsStart from './react-node-scripts-start';
import reactNodeScriptsTest from './react-node-scripts-test';

updateNotifier({ pkg }).notify();

let action;

const program = new Command()
	.version(pkg.version);

program
	.command('build')
	.option('--no-web')
	.option('--no-node')
	.action((...args) => { action = () => reactNodeScriptsBuild(...args); });

program
	.command('start')
	.option('--mongod')
	.option('--redis')
	.option('--ngrok')
	.option('--no-web')
	.option('--no-node')
	.option('--web [number]')
	.option('--node [number]')
	.action((...args) => { action = () => reactNodeScriptsStart(...args); });

program
	.command('test [args...]')
	.action((...args) => { action = () => reactNodeScriptsTest(...args); });

program.parse(process.argv);

action()
	.catch((err) => { /* eslint-disable-line promise/prefer-await-to-callbacks */
		const queue = [err];

		while (queue.length) {
			const currentErr = queue.shift();

			if (currentErr.errors) {
				queue.push(...currentErr.errors);
			} else if (currentErr.all) {
				console.log(currentErr.all); /* eslint-disable-line no-console */
			} else if (currentErr.stderr) {
				console.error(currentErr.stderr); /* eslint-disable-line no-console */
			} else if (currentErr.stdout) {
				console.log(currentErr.stdout); /* eslint-disable-line no-console */
			} else if (currentErr.message !== 'Staged Failed') {
				console.error(currentErr); /* eslint-disable-line no-console */
			}
		}

		process.exit(1);
	});
