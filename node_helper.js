/* MagicMirror²
 * Module: MMM-iCloud-Client
 *
 * By Jonathan Vogt https://github.com/bitte-ein-bit
 * MIT Licensed.
 */
"use strict";
const NodeHelper = require("node_helper");
const icloud = require("icloud");
const ical = require("ical-generator");
const Datastore = require("nedb");

var instance = icloud();

var phonenumberDB = new Datastore({ timestampData: true });
phonenumberDB.ensureIndex(
	{ fieldName: "createdAt", expireAfterSeconds: 3600 },
	function (err) {},
);
phonenumberDB.ensureIndex(
	{ fieldName: "unique", unique: true },
	function (err) {},
);

var birthdayDB = new Datastore({ timestampData: true });
birthdayDB.ensureIndex(
	{ fieldName: "createdAt", expireAfterSeconds: 3600 },
	function (err) {},
);
birthdayDB.ensureIndex({ fieldName: "unique", unique: true }, function (err) {
	console.log(err);
});

var contactDB = new Datastore({
	filename: `${__dirname}/contacts.db`,
	autoload: true,
	timestampData: true,
});
contactDB.ensureIndex(
	{ fieldName: "createdAt", expireAfterSeconds: 3600 },
	function (err) {},
);

module.exports = NodeHelper.create({
	// Subclass start method.
	start: function () {
		this.started = false;
		console.log(`Starting helper: ${this.name}`);
		this.expressApp.get(`/${this.name}/birthdays`, this.serverBirthdays);
		this.loadDB();
	},

	loadDB: function () {
		console.log("loading Database");
		contactDB.find(
			{ birthday: { $exists: true } },
			function (err, docs) {
				docs.forEach(
					function (contact) {
						this.extractBirthday(contact);
					}.bind(this),
				);
			}.bind(this),
		);
	},
	extractBirthday: function (contact) {
		if (contact.birthday.length === 10) {
			var today = new Date();
			today.setHours(0, 0, 0, 0);
			var birthday = Date.parse(contact.birthday);
			if (birthday == NaN) {
				console.log(
					`${contact.firstName} ${contact.lastName} has invalid birthday: ${contact.birthday}`,
				);
			} else {
				birthday = new Date(contact.birthday);
				birthday.setHours(0, 0, 0, 0);
				var nextbirthday = new Date(contact.birthday);
				nextbirthday.setHours(0, 0, 0, 0);
				nextbirthday.setFullYear(today.getFullYear());
				if (today > nextbirthday) {
					nextbirthday.setFullYear(today.getFullYear() + 1);
					if (birthday.getFullYear() === 1604) {
						// Only Day is entered
						birthday.setFullYear(today.getFullYear() + 1);
					}
				}
				if (birthday.getFullYear() === 1604) {
					// Only Day is entered
					birthday.setFullYear(today.getFullYear());
				}
				var diff = nextbirthday.getTime() - today.getTime();
				var days = Math.floor(diff / (1000 * 60 * 60 * 24));
				var age = nextbirthday.getFullYear() - birthday.getFullYear();
				var unique = `birthday-${contact.contactId}`;
				var info = {
					unique: unique,
					diffdays: days,
					age: age,
					nextbirthday: nextbirthday,
					birthday: birthday,
					firstName: contact.firstName,
					middleName: contact.middleName,
					lastName: contact.lastName,
				};
				birthdayDB.update({ unique: unique }, info, { upsert: true });
				//console.log("added bday for: " + contact.firstName + ' ' + contact.lastName + ' ' + contact.birthday);
			}
		} else {
			console.log(
				`${contact.firstName} ${contact.lastName} has invalid birthday: ${contact.birthday}`,
			);
		}
	},

	extractPhoneNumber: function (contact) {
		contact.phones.forEach(
			function (number) {
				var sanenumber = this.sanatizePhoneNumber(number.field);
				//console.log(sanenumber + " added for " + contact.firstName);
				var info = {
					unique: sanenumber,
					number: sanenumber,
					label: number.label,
					firstName: contact.firstName,
					middleName: contact.middleName,
					lastName: contact.lastName,
				};
				phonenumberDB.update({ unique: sanenumber }, info, { upsert: true });
			}.bind(this),
		);
	},

	serverBirthdays: function (req, res) {
		var cal = ical({ domain: "localhost", name: "birthdays" });
		birthdayDB
			.find({})
			.sort({ diffdays: 1 })
			.exec(function (err, docs) {
				docs.forEach(function (contact) {
					var name = "";
					var birthday = "";
					if (contact.firstName !== undefined) {
						name = contact.firstName;
					}
					if (contact.middleName !== undefined) {
						name += ` ${contact.middleName}`;
					}
					if (contact.lastName !== undefined) {
						name += ` ${contact.lastName}`;
					}
					name = name.trim();
					if (contact.age > 0) {
						birthday = ` (${contact.age})`;
					}
					var end = new Date(contact.nextbirthday);
					end.setHours(23, 59, 59, 0);
					cal.createEvent({
						start: contact.nextbirthday,
						end: end,
						//allDay: true,
						//floating: true,
						summary: name + birthday,
					});
					//console.log(contact.firstName + " " + contact.lastName + " has birthday in " + contact.diffdays + " days and turns " + contact.age);
				});
				console.log("Serving iCal");
				cal.serve(res);
			});
	},

	loadiCloud: function () {
		console.log("syncing iCloud");
		contactDB.find(
			{ phones: { $exists: true } },
			function (err, docs) {
				docs.forEach(
					function (contact) {
						this.extractPhoneNumber(contact);
					}.bind(this),
				);
			}.bind(this),
		);
		instance.login(
			this.config.username,
			this.config.password,
			function (err) {
				if (err) return console.log("login failed");
				instance.contacts(
					function (err, results) {
						if (err) return console.log("failed to fetch contacts");
						results.contacts.forEach(
							function (contact) {
								contactDB.update({ contactId: contact.contactId }, contact, {
									upsert: true,
								});
								if (contact.birthday !== undefined) {
									this.extractBirthday(contact);
								}
								if (contact.phones !== undefined) {
									this.extractPhoneNumber(contact);
								}
							}.bind(this),
						);
						contactDB.persistence.compactDatafile();
						contactDB.count({}),
							function (err, count) {
								console.log(`Loaded ${count} Contacts`);
							};
					}.bind(this),
				);
			}.bind(this),
		);
	},

	sanatizePhoneNumber: function (number) {
		return number
			.replace(/[^+0-9]+/gi, "")
			.replace(/^00/, "+")
			.replace(/^0/, `+${this.config.countrycode}`);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
			if (!this.started) {
				console.log(`Received config for ${this.name}`);
				this.started = true;
				this.loadiCloud();
				this.intervalID = setInterval(
					function () {
						this.loadiCloud();
					}.bind(this),
					3500000,
				);
			}
		}
		if (notification === "PHONE_LOOKUP") {
			console.log(
				`Requested Lookup for ${this.sanatizePhoneNumber(payload.number)}`,
			);
			phonenumberDB
				.find({ number: this.sanatizePhoneNumber(payload.number) })
				.limit(1)
				.exec(
					function (err, docs) {
						console.log(docs);
						var name = "Unknown Caller";
						var label = "";
						var resolved = false;
						docs.forEach(function (contact) {
							name = "";
							resolved = true;
							label = contact.label;
							if (contact.firstName !== undefined) {
								name = contact.firstName;
							}
							if (contact.middleName !== undefined) {
								name += ` ${contact.middleName}`;
							}
							if (contact.lastName !== undefined) {
								name += ` ${contact.lastName}`;
							}
							if (contact.nickName !== undefined) {
								name = `${contact.nickName} (${name})`;
							}
						});
						// Always send results
						var info = {
							name: name,
							label: label,
							number: this.sanatizePhoneNumber(payload.number),
							request: payload.number,
							original_sender: payload.sender,
							reason: payload.reason,
							resolved: resolved,
						};
						this.sendSocketNotification("PHONE_LOOKUP_RESULT", info);
					}.bind(this),
				);
		}
	},
});
