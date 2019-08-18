import openBrowser from 'react-dev-utils/openBrowser'; // eslint-disable-line import/no-extraneous-dependencies

function openNgrok() {
	if (process.env.PREVIOUS_BROWSER) {
		process.env.BROWSER = process.env.PREVIOUS_BROWSER;
	} else {
		delete process.env.BROWSER;
	}

	return openBrowser(process.env.PUBLIC_URL);
}

/* istanbul ignore next line */
if (require.main === module) {
	openNgrok();
}

export default openNgrok;
