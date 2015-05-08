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
	var list = toArray(require('./src/lic/list.js')(config.licenses, opts));
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

case 'config':
	renderTemplate('header');
	status.setGlobal(opts);
	break;
}

function simpleLicenseListPrint(list, opts) {
	_.forEach(list, function(lic) {
		simpleLicensePrint(lic, opts.all);
	});
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

function setCommand() {
	var licenseKey = opts.license;
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