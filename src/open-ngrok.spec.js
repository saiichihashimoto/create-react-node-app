import openBrowser from 'react-dev-utils/openBrowser'; // eslint-disable-line import/no-extraneous-dependencies
import path from 'path';
import openNgrok from './open-ngrok';

jest.mock('react-dev-utils/openBrowser');

describe('open-ngrok', () => {
	beforeEach(() => {
		process.env.BROWSER = path.resolve(__dirname, 'open-ngrok.js');
		process.env.REAL_BROWSER = 'some browser';
		process.env.NGROK_URL = 'https://foo-bar.com';

		openBrowser.mockImplementation(() => 'some return value');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('opens a browser', async () => {
		const returnValue = openNgrok();

		expect(returnValue).toBe('some return value');
		expect(openBrowser).toHaveBeenCalledWith('https://foo-bar.com');
	});

	it('returns openBrowser\'s return value', async () => {
		expect(openNgrok()).toBe('some return value');
	});

	it('sets BROWSER=$REAL_BROWSER', async () => {
		openNgrok();

		expect(process).toHaveProperty('env.BROWSER', 'some browser');
	});
});
