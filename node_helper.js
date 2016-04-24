'use strict';
const NodeHelper = require('node_helper');
const icloud = require('icloud');

var instance = icloud();
var Datastore = require('nedb')
//, contactDB = new Datastore({filename: 'contacts.db', autoload: true})
, phonenumberDB = new Datastore()
, birthdayDB = new Datastore();

function sanatizePhoneNumber(number, countrycode) {
  return number.replace(/[^+0-9]+/gi,'').replace(/^00/,'+').replace(/^0/, '+'+countrycode);
}

module.exports = NodeHelper.create({
  // Subclass start method.
  start: function() {
    this.started = false
    console.log('Starting helper: ' + this.name);
    dav.debug.enabled = true;
  },

  socketNotificationReceived: function(notification, payload) {
    if(notification === 'CONFIG') {
      this.config = payload
      if(!this.started) {
        console.log('Received config for ' + this.name);
        var self = this;
        this.started = true;

        instance.login(this.config.username, this.config.password, function(err) {
          if (err) return console.log('login failed');
          instance.contacts(function(err, results) {
            if (err) return console.log('failed to fetch contacts');
            results.contacts.forEach(function(contact){
              //contactDB.update({ "contact.contactID": contact.contactID}, { contact }, {upsert: true });
              if (contact.birthday) {
                if (contact.birthday.length == 10) {
                  birthday = Date.parse(contact.birthday);
                  if (birthday == NaN) {
                    console.log(contact.firstName + ' ' + contact.lastName + ' has invalid birthday: ' + contact.birthday);
                  } else {
                    birthday = new Date(contact.birthday);
                    nextbirthday = new Date(contact.birthday);

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
                    diff = nextbirthday.getTime() - today.getTime();
                    days = Math.floor(diff/(1000*60*60*24));
                    //console.log(nextbirthday + ' ' + nextbirthday.getFullYear());
                    //console.log(birthday + ' ' + birthday.getFullYear());
                    age = nextbirthday.getFullYear() - birthday.getFullYear();
                    var info = { type: 'birthday', diffdays: days, age: age, nextbirthday: nextbirthday, firstName: contact.firstName, middleName: contact.middleName, lastName: contact.lastName }
                    birthdayDB.insert(info);
                    //console.log("added bday for: " + contact.firstName + ' ' + contact.lastName + ' ' + contact.birthday);
                  }
                } else {
                  console.log(contact.firstName + ' ' + contact.lastName + ' has invalid birthday: ' + contact.birthday);
                }
              }
              if (contact.phones) {
                contact.phones.forEach(function(number){
                  var sanenumber = sanatizePhoneNumber(number.field, this.config.countrycode);
                  console.log(sanenumber + ' added for ' + contact.firstName);
                  var info = { number: sanenumber, label: number.label, firstName: contact.firstName, middleName: contact.middleName, lastName: contact.lastName}
                  phonenumberDB.insert(info);
                });
              }
            });
          });
        });
      };
    };
  }
});
