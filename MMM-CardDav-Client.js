/* global Module */

/* Magic Mirror
* Module: MMM-CardDAV-Client
*
* By Jonathan Vogt https://github.com/bitte-ein-bit
* MIT Licensed.
*/

Module.register('MMM-CardDav-Client',{

	// Default module config.
	defaults: {
		username: "",
		password: "",
		countrycode: "49",
	},

	start: function() {
		//Open Socket connection
		this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);
	}

});
