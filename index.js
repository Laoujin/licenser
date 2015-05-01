'use strict';

// var swig = require('swig');
// console.log(swig.render('{% if foo %}Hooray!{% endif %}', { locals: { foo: true }}));
//{% if loop.first %} class="first"{% endif %}>{{ author }}
//console.log('\u001b[94mwhat tha fuck\u001b[0m');

//var l = console.log.bind();


// Creative Commons Attribution zitten ook in de spdx

// npm set init.author.name "Brent Ertz"
// npm set init.author.email "brent.ertz@gmail.com"
// npm set init.author.url "http://brentertz.com"
//npm adduser

//process.exit();


var _ = require('lodash');
var colors = require('colors/safe');
var swig = require('swig');
//var fs = require('fs');

// Current licensing data
var status = require('./src/status.js');
var config = status.getConfig();

// Running without parameters
// Print some general license info
renderTemplate('header');
if (process.argv.length === 2) {
	renderTemplate('status', config);
	process.exit();
}

// Running with parameters
// parse cli arguments
var opts = require('./src/argv.js')();

// decide what to do
switch (opts._[0]) {
case 'list':
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

case 'add':
	addCommand();
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
		console.log(colors.magenta(str));
	} else if (lic.osiApproved) {
		console.log(colors.green(str));
	} else {
		console.log(str);
	}
}

function addCommand() {
	var licenseKey = opts.license;
	var matched = status.getMatches(licenseKey);
	if (matched.length === 1) {
		licenseKey = matched[0];
	}

	var newLicense = status.getDetails(licenseKey, true);
	if (!newLicense.valid) {
		console.log(colors.magenta(newLicense.key +' is not a recognized SPDX license!'));
		if (matched.length > 1) {
			console.log('Did you mean?');
			_.forEach(matched, function(match) {
				var licDetails = status.getDetails(match);
				simpleLicensePrint(licDetails, true);
			});
		}

	} else {
		console.log('Setting license: '+ newLicense.key);
		if (!newLicense.osiApproved) {
			console.log(colors.magenta('ATTN: You are setting a non OSI approved license!'));
		}

		if (config.hasNpmPackage) {
			if (config.license.key !== newLicense.key) {
				status.updatePackageJson(newLicense.key);
			} else {
				console.log('package.json up to date');
			}
		}

		if (config.fileExists()) {
			console.log('Overwriting existing license');
		}
		status.writeLicense(newLicense);
	}
}

// if (argv.i) {
// 	console.log('interactive');
// }


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
	template = swig.compileFile('./templates/' + template + '.tmpl');
	var output = template(vars);
	console.log(output);
}