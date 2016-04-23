# MMM-CardDav-Client
This an extension for the [MagicMirror](https://github.com/MichMich/MagicMirror). It provides a cardDAV Client which will show the upcomming birthdays. It also provides an Addressbook for [MMM-FRITZ-Box-Callmonitor](https://github.com/paviro/MMM-FRITZ-Box-Callmonitor).

## Installation
1. Navigate into your MagicMirror's `modules` folder.
2. Clone repository with `git clone https://github.com/bitte-ein-bit/MMM-CardDAV-Client.git`.
3. Navigate into MMM-CardDAV-Client.
4. Execute `npm install` to install the dependencies.


## Usage
The entry in the `module array` in your `config.js` can look like the following. (NOTE: You only have to add the variables to config if want to change its standard value.)

```
{
	module: 'MMM-CardDav-Client',
	config: {
		title: "Upcoming Birthdays",
		user: "JohnDoe@icloud.com",
		password: "SuperSecretPassword",
		server: "contacts.iclould.com",
	}
}
```

## Dependencies
- [dav](https://www.npmjs.com/package/dav) (installed by `npm install`)
