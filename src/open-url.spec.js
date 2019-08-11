import openBrowser from 'react-dev-utils/openBrowser'; // eslint-disable-line import/no-extraneous-dependencies

import openUrl from './open-url';

jest.mock('react-dev-utils/openBrowser');

beforeEach(() => {
	process.env.URL_TO_OPEN = 'https://google.com';

	openBrowser.mockImplementation(() => 'some return value');
});

afterEach(() => {
	delete process.env.BROWSER;
	delete process.env.PREVIOUS_BROWSER;
	delete process.env.URL_TO_OPEN;

	jest.resetAllMocks();
});

it('opens a browser', () => {
	openUrl();

	expect(openBrowser).toHaveBeenCalledWith('https://google.com');
});

it('returns openBrowser\'s return value', () => expect(openUrl()).toBe('some return value'));

it('deletes BROWSER', () => {
	process.env.BROWSER = 'hello';

	openUrl();

	expect(process.env.BROWSER).toBeUndefined();
});

it('sets BROWSER=$PREVIOUS_BROWSER', () => {
	process.env.PREVIOUS_BROWSER = 'hello';

	openUrl();

	expect(process.env.BROWSER).toStrictEqual('hello');
});
