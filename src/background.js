/**
 * @file background.js for Browser Extension MANAv
 * @copyright m-grohs 2023
 */

/**
 * @bug @function handleClick() and @function handleUpdate() can interfere with each other when the Site is
 * not completed yet. (giving OFF Signal even tho it should be ON)
 * You can click Extension Button and change State and Storage even tho @function handleUpdate() is not done yet
 *
 * @todo @function setIcon rewrite without using bools but including check for it
 * @todo remove @var SITE_STATUS and rewrite to integrate Status without it
 * possible using a State Variable to include activeSites and status for better checks/changes
 */

const SETTINGS = {
	DB_NAME: 'MANAvActiveSites',
	// SITE_STATUS: false,
	ICON_ON: './icons/manav-on.svg',
	ICON_OFF: './icons/manav-off.svg'
};

/**
 * State Object
 * @var activeSites - the current Sites Array where the Extension is active
 * @var {bool} status  - current Extension Status (Active/Inactive)
 * @var {string} originURL - Current Tab URL stripped to .origin Format
 */
const extnData = {
	activeSites: [],
	status: false,
	originURL: ''
};

/**
 * Checks for existence of the Active Site Array in storage.local and returns an Array
 * @return {Array} storage.local Active Site Array
 */
async function getURLs() {
	// Check and Set Default DB Name and Values if not present
	const currentDB = await browser.storage.local.get(SETTINGS.DB_NAME);
	if (currentDB[SETTINGS.DB_NAME] === undefined) {
		console.log('DB not Found... Setting Default Values...');
		await setURLs([]);
		return [];
	}
	return Array.from(currentDB[SETTINGS.DB_NAME]);
}

/**
 * Sets a new storage Value
 * @param {arr} arr - the New Values to be stored
 */
async function setURLs(arr) {
	await browser.storage.local.set({
		[SETTINGS.DB_NAME]: arr
	});
}

/**
 * URL Check if present in Active Site Array
 * @param {string} originURL - the present URL stripped down to .origin Values
 * @param {Array} toCheckURLs - Array representing all current active Sites
 * @returns {bool}
 */
async function checkURL(originURL) {
	if (extnData.activeSites.includes(originURL)) {
		return true;
	}
	return false;
}

async function updateActiveSites() {
	// extnData.activeSites = browser.storage.local.get([SETTINGS.DB_NAME] ?? []);
	console.log('update Event');
}

/**
 * Shortens URL to .origin Format (stripping everything from the 3rd "/")
 * Regex /^(?:[^\/]*\/){2}[^\/]+/g
 * @param {string} url - URL to be shorten
 * @returns {string} - finished URL
 */
async function stripToOriginURL(url) {
	return url.match(/^(?:[^\/]*\/){2}[^\/]+/g).toString();
}

/**
 * Change Extension Icon depening on Status from the Active Site Array
 * @param {bool} bool
 */
function switchIcon(bool) {
	if (bool) {
		browser.action.setIcon({ path: SETTINGS.ICON_ON });
		return;
	}
	browser.action.setIcon({ path: SETTINGS.ICON_OFF });
}

/**
 * Sends a Signal to content script
 * @param {number} tabID - the ID of the active Tab
 * @param {string} msg - the Message to send
 */
function sendSignal(tabID, msg) {
	browser.tabs.sendMessage(tabID, msg);
}

async function update() {}

/**
 * Handles Update Event from the active Tab
 * @param {number} tabID - the ID of the active Tab
 * @param {*} changeInfo - the ChangeInfo Object that fires everytime anything changes in the Tab
 * @param {*} tab - the finished Tab Object
 *
 * @Info the changeInfo Object is changing everytime the Event is fired ending in only
 * a changeInfo.status === complete State.
 * to Send Messages properly to the content script we need to wait until this Event is finished
 *
 * @todo Rewrite so we dont use @var SITE_STATUS and wait for complete Status to do anything
 * @todo rewrite Icon switching to include checks
 */
async function handleUpdate(tabID, changeInfo, tab) {
	// Wait for the url to be updated and store it in State
	if (changeInfo.url) {
		extnData.originURL = await stripToOriginURL(changeInfo.url);
	}

	if (tab.status === 'complete') {
		// Check if URL should be active
		if (await checkURL(originURL)) {
			extnData.status = true;
		}
		console.log(extnData.status);
	}

	// After checking and waiting for the changeInfo event to finish
	// Depending on the Outcome switch Extension Icon and send Message to content script!
	// if (changeInfo.status === 'complete' && tab.status === 'complete') {
	// 	if (SETTINGS.SITE_STATUS) {
	// 		// Switch to On Icon and send Signal to Tab
	// 		console.log('site is in array');
	// 		switchIcon(true);
	// 		sendSignal(tabID, true);
	// 	} else {
	// 		console.log('site is not in array');
	// 		switchIcon(false);
	// 		sendSignal(tabID, false);
	// 	}
	// }
}

/**
 * Handle onClick Events from the Extension Button
 * @param {*} tab - Tab Object
 * @param {*} onClickData
 */
async function handleOnClick(tab, onClickData) {
	// testing
	const test = await getURLs();
	test.push('zzzzzzz');
	browser.storage.local.set(await setURLs(test));

	if (tab.status === 'complete') {
		// const originURL = await stripToOriginURL(tab.url);
		// const activeSiteURLs = await getURLs();
		// // Add/Remove URL from Active Site Array and use correct Icon for the State after
		// if (await checkURL(originURL, activeSiteURLs)) {
		// 	console.log('test');
		// 	activeSiteURLs.splice(activeSiteURLs.indexOf(originURL), 1);
		// 	switchIcon(false);
		// 	sendSignal(false);
		// } else {
		// 	activeSiteURLs.push(originURL);
		// 	switchIcon(true);
		// 	sendSignal(true);
		// }
		// await setURLs(activeSiteURLs);
	}
}

async function handleStorageChange(changedData) {
	extnData.activeSites = await getURLs();
	console.log('from storage change -> ', extnData.activeSites);
}

// Setting Default Value on Extension Install
browser.runtime.onInstalled.addListener(() => {
	browser.storage.local.set({ [SETTINGS.DB_NAME]: [] });
});

browser.tabs.onUpdated.addListener(handleUpdate);
browser.action.onClicked.addListener(handleOnClick);
browser.storage.onChanged.addListener(handleStorageChange);
