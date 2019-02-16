import EventEmitter from 'events';
import childProcess from 'child_process';
import path from 'path';
import reactNodeScripts from './react-node-scripts';

jest.mock('child_process');

describe('react-node-scripts', () => {
	const nodePath = process.argv[0];

	beforeEach(() => {
		childProcess.spawn.mockImplementation(() => new EventEmitter());
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('`build` spawns react-node-scripts-build', () => {
		reactNodeScripts('build');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-build.js')], expect.anything());
	});

	it('`start` spawns react-node-scripts-start', () => {
		reactNodeScripts('start');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-start.js')], expect.anything());
	});

	it('`test` spawns react-node-scripts-test', () => {
		reactNodeScripts('test');

		expect(childProcess.spawn).toHaveBeenCalledWith(nodePath, [path.resolve(__dirname, 'react-node-scripts-test.js')], expect.anything());
	});
});
