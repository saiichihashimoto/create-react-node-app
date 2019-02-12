import EventEmitter from 'events';
import childProcess from 'child_process';
import path from 'path';
import reactNodeScripts from './react-node-scripts';

jest.mock('child_process');

describe('react-node-scripts', () => {
	const nodePath = process.argv[0];
	const options = { customFds: [0, 1, 2], stdio: 'inherit' };

	childProcess.spawn.mockImplementation(() => new EventEmitter());

	afterEach(() => {
		childProcess.spawn.mockClear();
	});

	it('`build` spawns react-node-scripts-build', () => {
		reactNodeScripts('build');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-build.js')], options);
	});

	it('`start` spawns react-node-scripts-start', () => {
		reactNodeScripts('start');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-start.js')], options);
	});

	it('`test` spawns react-node-scripts-test', () => {
		reactNodeScripts('test');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-test.js')], options);
	});
});
