import EventEmitter from 'events';
import childProcess from 'child_process';
import path from 'path';
import reactNodeScripts from './react-node-scripts';

jest.mock('child_process');

const nodePath = process.argv[0];

describe('react-node-scripts', () => {
	childProcess.spawn.mockImplementation(() => new EventEmitter());

	beforeEach(() => {
		childProcess.spawn.mockClear();
	});

	it('spawns react-node-scripts-build with "build"', () => {
		reactNodeScripts('build');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-build.js')], { customFds: [0, 1, 2], stdio: 'inherit' });
	});

	it('spawns react-node-scripts-start with "start"', () => {
		reactNodeScripts('start');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-start.js')], { customFds: [0, 1, 2], stdio: 'inherit' });
	});

	it('spawns react-node-scripts-test with "test"', () => {
		reactNodeScripts('test');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-test.js')], { customFds: [0, 1, 2], stdio: 'inherit' });
	});
});
