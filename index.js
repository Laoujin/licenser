'use strict';

// var swig = require('swig');
// console.log(swig.render('{% if foo %}Hooray!{% endif %}', { locals: { foo: true }}));
//{% if loop.first %} class="first"{% endif %}>{{ author }}
//console.log('\u001b[94mwhat tha fuck\u001b[0m');

var l = console.log.bind();


// Creative Commons Attribution zitten ook in de spdx

// npm set init.author.name "Brent Ertz"
// npm set init.author.email "brent.ertz@gmail.com"
// npm set init.author.url "http://brentertz.com"
//npm adduser

//process.exit();


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
	//l(config);
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
		var str = lic.key + ': ' + lic.name + (lic.osiApproved && opts.all ? ' (OSI Approved)' : '');

		if (lic.common) {
			console.log(colors.magenta(str));
		} else if (lic.osiApproved) {
			console.log(colors.green(str));
		} else {
			console.log(str);
		}
	});
}

function addCommand() {
	var newLicense = status.getDetails(opts.license);

	if (!newLicense.valid) {
		console.log(colors.magenta(newLicense.key +' is not a recognized SPDX license!'));

	} else {
		console.log('Setting license: '+ newLicense.key);
		if (!newLicense.osiApproved) {
			console.log(colors.magenta('ATTN: You are setting a not OSI approved license!'));
		}

		if (config.hasNpmPackage) {
			if (config.license.key !== newLicense.key) {
				console.log('Updating package.json');
				status.updatePackageJson(newLicense.key);
			} else {
				console.log('package.json up to date');
			}
		}
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