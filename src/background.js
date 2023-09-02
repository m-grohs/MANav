/**
 * background.js for Browser Extension MANAv
 * @copyright m-grohs 2023
 *
 * With the Switch to manifest v3 a non persistant State has been enforced
 * Using store.local for State Vars is now the way to go instead of Global Vars
 */

// Adding Settings and Default DB Values on Install
browser.runtime.onInstalled.addListener(() => {
	const EXT_STATE = {
		dbName: 'MANAvDB',
		settings: 'MANAvSettings',
		currentURL: '',
		icon: {
			ON: './icons/manav-on.svg',
			OFF: './icons/manav-off.svg'
		},
		status: false
	};
	browser.storage.local.set({ [EXT_STATE.dbName]: [], [EXT_STATE.settings]: EXT_STATE });
});

// Add Event Listeners
browser.tabs.onUpdated.addListener(handleUpdate);
browser.action.onClicked.addListener(handleOnClick);
browser.storage.onChanged.addListener(handleStorageChange);

function handleUpdate() {}

async function handleOnClick(tab, _) {
	// Wait until Tab finished loading and fetch State
	// ! Do we need to wait for tab complete? would make the click
	// ! not functioning while its still loading
	if (tab.status === 'complete') {
		// fetch DB and Settings from Storage
		const state = await browser.storage.local.get();
		const stateKeys = Object.keys(state);

		// Strip current URL to origin Format and store it
		const originURL = await urlToOrigin(tab.url);

		// Check if current URL is an active one
		if (await isURLActive(state.stateKeys[0], tab.url)) {
		} else {
			// Add current URL to DB
			const addToDB = state.stateKeys[0];
			addToDB.push(originURL);
			browser.storage.local.set({ [state.stateKeys[0]]: addToDB });
		}
	}
}

async function handleStorageChange(changes) {
	console.log('storage changes: ', changes);
}

async function isURLActive(activeArr, url) {}

/**
 * Shortens URL to .origin Format (stripping everything from the 3rd "/")
 * Regex /^(?:[^\/]*\/){2}[^\/]+/g
 * @param {string} url - URL to be shorten
 * @returns {string} - finished URL
 */
async function urlToOrigin(url) {
	return url.match(/^(?:[^\/]*\/){2}[^\/]+/g).toString();
}
