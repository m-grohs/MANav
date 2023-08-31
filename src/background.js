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
 * @todo duplicate check before storing new urls
 * @bug possible storage.StorageArea.onChanged Event will not fire in non persistant idle state
 */

const SETTINGS = {
	DB_NAME: 'MANAvActiveSites',
	ICON_ON: './icons/manav-on.svg',
	ICON_OFF: './icons/manav-off.svg'
};

/**
 * State Object
 * @var activeSites - the current Sites Array where the Extension is active
 * @var {bool} status  - current Extension Status (Active/Inactive)
 * @var {string} originURL - Current Tab URL stripped to .origin Format
 */
const extData = {
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
		console.warn('DB not Found... Setting Default Values...');
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
	await updateActiveSites();
}

async function deleteURL(url) {
	extData.activeSites.splice(extData.activeSites.indexOf(url), 1);
	browser.storage.local.set({ [SETTINGS.DB_NAME]: extData.activeSites });
	// ! missing update to extData.status
}

/**
 * Checks if Value is in Active Site Array and set State Status accordingly
 * @param {string} url - the present URL stripped down to .origin Values
 */
async function statusOfURL(url) {
	if (extData.activeSites.includes(url)) {
		extData.status = true;
		return;
	}
	extData.status = false;
}

async function updateActiveSites() {
	extData.activeSites = (await getURLs(extData.originURL)) ?? browser.storage.local.get([SETTINGS.DB_NAME] ?? []);
}

async function updateStatus(bool) {
	if (bool) {
		extData.status = false;
		return;
	}
	extData.status = true;
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
 * Update Extension Icon depening on Status
 */
function updateIcon() {
	console.log('icon update');
	if (extData.status) {
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

/**
 * Handles Update Event from the active Tab
 * @param {number} tabID - the ID of the active Tab
 * @param {*} changeInfo - the ChangeInfo Object that fires everytime anything changes in the Tab
 * @param {*} tab - the finished Tab Object
 *
 * @Info the changeInfo Object is changing everytime the Event is fired ending in only
 * a changeInfo.status === complete State.
 * to Send Messages properly to the content script we need to wait until this Event is finished
 */
async function handleUpdate(_, changeInfo, tab) {
	// Wait for the url to be updated and store it in State
	if (changeInfo.url) {
		extData.originURL = await stripToOriginURL(changeInfo.url);
	}

	if (tab.status === 'complete') {
		await statusOfURL(extData.originURL);
		await updateIcon();
		// ? add send signal
	}
}

/**
 * Handle onClick Events from the Extension Button
 * @param {*} tab - Tab Object
 * @param {*} onClickData
 *
 * @todo Icon doesnt get update correctly.
 * @todo add/delete doesnt work properly sometimes
 */
async function handleOnClick(tab, _) {
	if (tab.status === 'complete') {
		// Delete URL from Active Sites
		if (extData.status === true) {
			await deleteURL(extData.originURL);
			await updateStatus();
		}

		// Add URL to Active Sites
		if (extData.status === false) {
			const newActiveSites = await getURLs();
			newActiveSites.push(extData.originURL);
			await setURLs(newActiveSites);
			await updateStatus();
		}

		await updateIcon();
		//? add Signals

		// ! do we need to wait for status?
		// if (tab.status === 'complete') {
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
		// }
	}
}

async function handleStorageChange(changedData) {
	await updateActiveSites();
	console.log('from storage change -> ', extData.activeSites);
	await updateIcon();
}

// Run once at the Start
(async () => {
	await updateActiveSites();
})();

// Setting Default Value on Extension Install
browser.runtime.onInstalled.addListener(() => {
	browser.storage.local.set({ [SETTINGS.DB_NAME]: ['https://asuracomics.com'] });
});

browser.tabs.onUpdated.addListener(handleUpdate);
browser.action.onClicked.addListener(handleOnClick);
browser.storage.onChanged.addListener(handleStorageChange);
