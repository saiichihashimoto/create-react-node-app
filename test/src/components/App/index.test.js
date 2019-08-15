/* global document */
import React from 'react';
import ReactDOM from 'react-dom';

import App from '.';

it('renders without crashing', () => { // eslint-disable-line jest/expect-expect
	const div = document.createElement('div');
	ReactDOM.render(<App />, div);
	ReactDOM.unmountComponentAtNode(div);
});
