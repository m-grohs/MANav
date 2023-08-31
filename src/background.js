/**
 * background.js for Browser Extension MANAv
 * @copyright m-grohs 2023
 *
 * With the Switch to manifest v3 a non persistant State has been enforced
 * Using store.local for State Vars is now the way to go instead of Global Vars
 */

// Adding Settings and Default DB Values on Install
browser.runtime.onInstalled.addListener(() => {
	const SETTINGS = {
		dbName: 'MANAvDB',
		currentURL: '',
		icon: {
			ON: './icons/manav-on.svg',
			OFF: './icons/manav-off.svg'
		},
		status: false
	};
	browser.storage.local.set(
		{ [SETTINGS.dbName]: [] },
		{
			MANAvSettings: SETTINGS
		}
	);
});

// Add Event Listeners
browser.tabs.onUpdated.addListener(handleUpdate);
browser.action.onClicked.addListener(handleOnClick);
browser.storage.onChanged.addListener(handleStorageChange);

function handleUpdate() {}

function handleOnClick() {}

function handleStorageChange() {}
