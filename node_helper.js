'use strict';
const NodeHelper = require('node_helper');
const dav = require('dav');

module.exports = NodeHelper.create({
  // Subclass start method.
  start: function() {
    this.started = false
    console.log('Starting module: ' + this.name);
  },

  socketNotificationReceived: function(notification, payload) {
    if(notification === 'CONFIG') {
      this.config = payload
      if(!this.started) {
        console.log('Received config for' + this.name);
        var self = this;
        this.started = true;
        var xhr = new dav.transport.Basic(
          new dav.Credentials({
            username: this.config.username,
            password: this.config.password,
          })
        );

        dav.createAccount({ server: 'https://'+this.config.server, xhr: xhr })
        .then(function(account) {
          // account instanceof dav.Account
          account.contacts.forEach(function(calendar) {
            console.log('Found contact named ' + calendar.displayName);
            // etc.
          });
        });
      };
    };
  }
});
