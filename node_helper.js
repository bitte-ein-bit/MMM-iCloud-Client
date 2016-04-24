"use strict";
const NodeHelper = require("node_helper");
const icloud = require("icloud");
const ical = require("ical-generator");
const Datastore = require("nedb");

var instance = icloud();
var phonenumberDB = new Datastore({timestampData: true});
phonenumberDB.ensureIndex({fieldName: "createdAt", expireAfterSeconds: 3600}, function(err) {});
phonenumberDB.ensureIndex({fieldName: "unique", unique: true}, function(err) {});
var birthdayDB = new Datastore({timestampData: true});
birthdayDB.ensureIndex({fieldName: "createdAt", expireAfterSeconds: 3600}, function(err) {});
birthdayDB.ensureIndex({fieldName: "unique", unique: true}, function(err) {console.log(err);});
var contactDB = new Datastore({filename: "contacts.db", autoload: true, timestampData: true});
contactDB.ensureIndex({fieldName: "createdAt", expireAfterSeconds: 3600}, function(err) {});

function sanatizePhoneNumber(number, countrycode) {
	return number.replace(/[^+0-9]+/gi,"").replace(/^00/,"+").replace(/^0/, "+" + countrycode);
}

module.exports = NodeHelper.create({
	// Subclass start method.
	start: function() {
		this.started = false;
		console.log("Starting helper: " + this.name);
		this.expressApp.get("/" + this.name + "/birthdays", this.serverBirthdays);
		this.loadDB();
	},

	loadDB: function() {
		console.log("loading Database");
		var self = this;
		contactDB.find({"birthday": {$exists: true}}, function(err, docs) {
			docs.forEach(function(contact) {
				self.extractBirthday(contact);
			});
		});
	},
	extractBirthday: function(contact) {
		if (contact.birthday.length == 10) {
			var today = new Date();
			var birthday = Date.parse(contact.birthday);
			if (birthday == NaN) {
				console.log(contact.firstName + " " + contact.lastName + " has invalid birthday: " + contact.birthday);
			} else {
				birthday = new Date(contact.birthday);
				var nextbirthday = new Date(contact.birthday);

				nextbirthday.setFullYear(today.getFullYear());
				if (today > nextbirthday) {
					nextbirthday.setFullYear(today.getFullYear() + 1);
					if (birthday.getFullYear() == 1604) {
						// Only Day is entered
						birthday.setFullYear(today.getFullYear() + 1);
					}
				}
				if (birthday.getFullYear() == 1604) {
					// Only Day is entered
					birthday.setFullYear(today.getFullYear());
				}
				var diff = nextbirthday.getTime() - today.getTime();
				var days = Math.floor(diff / (1000 * 60 * 60 * 24));
				var age = nextbirthday.getFullYear() - birthday.getFullYear();
				var info = {unique: "birthday-" + contact.contactId, diffdays: days, age: age, nextbirthday: nextbirthday, firstName: contact.firstName, middleName: contact.middleName, lastName: contact.lastName};
				birthdayDB.insert(info);
				//console.log("added bday for: " + contact.firstName + ' ' + contact.lastName + ' ' + contact.birthday);
			}
		} else {
			console.log(contact.firstName + " " + contact.lastName + " has invalid birthday: " + contact.birthday);
		}
	},

	extractPhoneNumber: function(contact, self) {
		contact.phones.forEach(function(number) {
			var sanenumber = sanatizePhoneNumber(number.field, self.config.countrycode);
			//console.log(sanenumber + " added for " + contact.firstName);
			var info = {unique: sanenumber, number: sanenumber, label: number.label, firstName: contact.firstName, middleName: contact.middleName, lastName: contact.lastName};
			phonenumberDB.insert(info);
		});
	},

	serverBirthdays: function(req, res) {
		var cal = ical({domain: "localhost", name: "birthdays"});
		birthdayDB.find({}).sort({diffdays: 1}).exec(function(err, docs) {
			docs.forEach(function(contact) {
				var name = "";
				var birthday = "";
				if (contact.firstName != undefined) {
					name = contact.firstName;
				}
				if (contact.middleName != undefined) {
					name += " " + contact.middleName;
				}
				if (contact.lastName != undefined) {
					name += " " + contact.lastName;
				}
				name = name.trim();
				if (contact.age > 0) {
					birthday = " (" + contact.age + ")";
				}

				cal.createEvent({
					start: contact.nextbirthday,
					allDay: true,
					floating: true,
					summary: name + birthday,
				});
				//console.log(contact.firstName + " " + contact.lastName + " has birthday in " + contact.diffdays + " days and turns " + contact.age);
			});
			console.log("Serving iCal");
			cal.serve(res);
		});
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
			if (!this.started) {
				console.log("Received config for " + this.name);
				var self = this;
				this.started = true;

				contactDB.find({"phones": {$exists: true}}, function(err, docs) {
					docs.forEach(function(contact) {
						self.extractPhoneNumber(contact);
					});
				});

				instance.login(this.config.username, this.config.password, function(err) {
					if (err) return console.log("login failed");
					instance.contacts(function(err, results) {
						if (err) return console.log("failed to fetch contacts");
						results.contacts.forEach(function(contact) {
							contactDB.update({"contactId": contact.contactId}, contact, {upsert: true});
							if (contact.birthday != undefined) {
								self.extractBirthday(contact);
							}
							if (contact.phones != undefined) {
								self.extractPhoneNumber(contact, self);
							}
						});
						contactDB.persistence.compactDatafile();
						contactDB.count({}),function(err, count) {
							console.log("Loaded " + count + " Contacts");
						};
					});
				});
			};
		};
	}
});
