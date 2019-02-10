#!/usr/bin/env node
const program = require('commander');
const { version } = require('../package');

program
	.version(version)
	.command('build', 'builds the app')
	.command('start', 'starts the app')
	.parse(process.argv);
