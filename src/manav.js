'use strict';

const extensionIsActive = {
	status: false
};

/**
 * React to Messages from service worker/background.js
 */
browser.runtime.onMessage.addListener((msg) => {
	console.log(msg);
	extensionIsActive.status = msg;
});

if (extensionIsActive.status === true) {
	console.log('Extensions is Active');
}
