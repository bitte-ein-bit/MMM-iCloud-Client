# MMM-iCloud-Client
This an extension for the [MagicMirror](https://github.com/MichMich/MagicMirror). It provides a iCloud Client which will show upcomming birthdays using the iCloud Addressbook. It also provides an Addressbook for [MMM-FRITZ-Box-Callmonitor](https://github.com/paviro/MMM-FRITZ-Box-Callmonitor).

## Installation
1. Navigate into your MagicMirror's `modules` folder.
2. Clone repository with `git clone https://github.com/bitte-ein-bit/MMM-iCloud-Client.git`.
3. Navigate into MMM-iCloud-Client.
4. Execute `npm install` to install the dependencies.


## Usage
The entry in the `module array` in your `config.js` can look like the following.

```
{
	module: 'MMM-iCloud-Client',
	config: {
		username: "appleID",
		password: "password",
	}
},
```
To use the Birthday calendar add the following to your calendar module config.

```
{
	symbol: 'birthday-cake',
	url: 'http://localhost:8080/MMM-iCloud-Client/birthdays',
}
```

## Dependencies
- [ical-generator](https://www.npmjs.com/package/ical-generator) (installed by `npm install`)
- [icloud](https://www.npmjs.com/package/icloud) (installed by `npm install`)
- [nedb](https://www.npmjs.com/package/nedb) (installed by `npm install`)
