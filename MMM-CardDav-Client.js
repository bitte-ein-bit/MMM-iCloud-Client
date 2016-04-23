/* global Module */

/* Magic Mirror
* Module: MMM-CardDAV-Client
*
* By Jonathan Vogt https://github.com/bitte-ein-bit
* MIT Licensed.
*/

Module.register('MMM-CardDAV-Client',{

	// Default module config.
	defaults: {
		title: "Upcoming Birthdays",
		username: "",
		password: "",
		server: "contacts.iclould.com",
	},

	start: function() {
		//Open Socket connection
		this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);
	}

});
