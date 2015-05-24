#!/usr/bin/env node
'use strict';

var _ = require('lodash');
var colors = require('colors/safe');
var swig = require('swig');

// Current licensing data
var status = require('./src/status.js');
var config = status.getConfig();

// Running without parameters
// Print some general license info
if (process.argv.length === 2) {
	renderTemplate('header');
	renderTemplate('status', config);
	process.exit();
}

// Running with parameters
// parse cli arguments
var opts = require('./src/argv.js')(config);
config.update(opts);

// decide what to do
switch (opts._[0]) {
case 'list':
	renderTemplate('header');
	var list = toArray(require('./src/list.js')(config.licenses, opts));
	if (opts.common) {
		var model = {
			opts: opts,
			licenses: list
		};
		renderTemplate('list-common', model);

	} else {
		console.log();
		simpleLicenseListPrint(list, opts);
	}
	break;

case 'print':
	printCommand();
	break;

case 'set':
	renderTemplate('header');
	setCommand();
	break;

case 'update':
	renderTemplate('header');
	updateCommand();
	break;

case 'config':
	renderTemplate('header');
	status.setGlobal(opts);
	break;
}

function simpleLicenseListPrint(list, opts) {
	if (list.length !== 0) {
		_.forEach(list, function(lic) {
			simpleLicensePrint(lic, opts.all);
		});
		console.log('\nExample usage: `licenser set ' + list[list.length - 1].key + '`');
	} else {
		console.log('No licenses matched ' + opts.searchFor);
	}
}

function simpleLicensePrint(lic, addOsiApproved) {
	var str = lic.key + ': ' + lic.name + (lic.osiApproved && addOsiApproved ? ' (OSI Approved)' : '');

	if (lic.common) {
		console.log(colors.magenta(str + ' <-- You might want to pick this one'));
	} else if (lic.osiApproved) {
		console.log(colors.green(str));
	} else {
		console.log(str);
	}
}

var cancelUpdate = false;
function updateCommand() {
	var license = config.license;
	if (!license.valid) {
		console.log(colors.magenta(license.key +' is not a recognized SPDX license!'));
	} else if (!license.match) {
		console.log('Your license has no placeholders for \'years\'. (or it is not yet configured?)');
	} else if (!config.fileExists()) {
		console.log('You do not have a license file! Use `licenser set`?');
	} else {
		var content = status.readLicenseFile();
		if (!content.match(license.recognize)) {
			console.log('Failed to recognize your license file as ' + license.key);
		} else {
			var updatedLicense = transformCopyrightMatcher(content);
			if (!cancelUpdate && updatedLicense) {
				status.writeLicense({full: updatedLicense});
			}
		}
	}
}


function transformCopyrightMatcher(licenseText) {
	var matcher = /(Copyright\s+(?:@|\([cC]\)\s+)?)(?:(\d{4})(?:(\s*-\s*)(\d{4}))?|\[?yyyy\]?|<year>|19yy)/i;
	var currentYear = new Date().getFullYear();
	return licenseText.replace(matcher, function(match, copyrightPrefix, firstYear, inBetween, lastYear) {
		if (isNaN(firstYear)) {
			cancelUpdate = true;
			console.log('Saw original placeholders. Use `licenser set` first?');
		} else if (parseInt(firstYear, 10) !== currentYear && (lastYear === undefined || parseInt(lastYear, 10) !== currentYear)) {
			console.log('Updated license for the year ' + currentYear);
			return copyrightPrefix + firstYear + (inBetween || '-') + currentYear;
		} else {
			cancelUpdate = true;
			console.log('Year was ok in file.');
		}
	});
}

function setCommand() {
	var licenseKey = opts.license;
	if (!licenseKey) {
		console.log('No license key given and no global license set.');
		return;
	}

	var matched = status.getMatches(licenseKey);
	if (matched.length === 1) {
		licenseKey = matched[0];
	}

	var newLicense = status.getDetails(licenseKey, true);
	if (!newLicense.valid) {
		console.log(colors.magenta(newLicense.key +' is not a recognized SPDX license!'));
		printCandidates(matched);

	} else {
		console.log('Setting license: '+ newLicense.key);
		if (!newLicense.osiApproved) {
			console.log(colors.magenta('ATTN: You are setting a non OSI approved license!'));
		}

		if (config.hasNpmPackage) {
			if (config.packageJson.license !== newLicense.key) {
				status.updatePackageJson(newLicense.key);
			} else {
				console.log('package.json up to date');
			}
		}

		status.writeLicense(newLicense);
	}
}

function printCommand() {
	var list = status.getMatches(opts.key);
	if (list.length !== 1) {
		printCandidates(list);
	} else {
		var details = status.getDetails(list[0], true);
		if (opts.header && details.header) {
			console.log(details.header);
		} else {
			console.log(details.full);
		}
	}
}

function printCandidates(list) {
	if (list.length > 1) {
		console.log('Did you mean?');
		_.forEach(list, function(match) {
			var licDetails = status.getDetails(match);
			simpleLicensePrint(licDetails, true);
		});
	}
}


function toArray(object) {
	var list = [];
	var keys = Object.keys(object).sort();
	var i, key;
	for (i = 0; i < keys.length; i++) {
		key = keys[i];
		object[key].key = key;
		list.push(object[key]);
	}
	return list;
}


function renderTemplate(name, vars) {
	var template = name;
	template = swig.compileFile(__dirname + '/templates/' + template + '.tmpl');
	var output = template(vars);
	console.log(output);
}