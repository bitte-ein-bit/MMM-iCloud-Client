/* global Module */

/* Magic Mirror
* Module: MMM-iCloud-Client
*
* By Jonathan Vogt https://github.com/bitte-ein-bit
* MIT Licensed.
*/

Module.register("MMM-iCloud-Client",{

	// Default module config.
	defaults: {
		username: "",
		password: "",
		countrycode: "49",
	},

	start: function() {
		//Open Socket connection
		this.sendSocketNotification("CONFIG", this.config);
		Log.info("Starting module: " + this.name);
	},

	notificationReceived: function(notification, payload, sender) {
		if (notification === "PHONE_LOOKUP") {
			this.sendSocketNotification("PHONE_LOOKUP", payload);
		}
	},

	socketNotificationReceived: function(notification, payload) {
		Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		if (notification === "PHONE_LOOKUP_RESULT") {
			this.sendNotification("PHONE_LOOKUP_RESULT", payload);
		}
	},

});
