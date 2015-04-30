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


//var fs = require('fs');
var _ = require('lodash');
var colors = require('colors/safe');
var swig  = require('swig');

renderTemplate('header');

// Combine license jsons
var licenseModelBuilder = require('./src/licenseModelBuilder.js');
var licenses = licenseModelBuilder({
	spdx: require('spdx-license-list'),
	common: require('./licenses.json')
});

// parse cli arguments
var opts = require('./src/argv.js')();

// decide what to do
switch (opts._[0]) {
case 'list':
	var list = toArray(require('./src/lic/list.js')(licenses, opts));
	if (opts.common) {
		var model = {
			opts: opts,
			licenses: list
		};
		renderTemplate('list-common', model);
	} else {
		simpleLicenseListPrint(list, opts);
	}
	break;

case 'add':
	break;

default:
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




//var packageJson = require('./package.json');

// var config = {
// 	fileName: 'LICENSE',
// 	fileExists: function() {
// 		return fs.existsSync(this.fileName);
// 	},
// 	license: {
// 		name: packageJson.license,
// 		valid: spdxlicenses[packageJson.license] !== undefined
// 	},
// 	spdx: spdxlicenses[packageJson.license]
// };

// if (config.license.valid) {
// 	config.license.osiApproved = config.spdx.osiApproved;
// }


// if (!argv.valid) {
// 	process.exit();
// }

// if (argv.empty) {
// 	console.log('Current license: ' + config.license.name);
// 	if (config.license.name) {
// 		console.log('Valid SPDX: ' + config.license.valid);
// 		if (config.license.valid) {
// 			console.log('OSI approved: ' + config.license.osiApproved);
// 		}

// 		if (config.fileExists()) {
// 			console.log('License file exists.');
// 		} else {
// 			console.log(colors.magenta('License file does not exist!'));
// 		}

		
// 	}
// }

// Usage:
// --add=MIT

// if (argv.i) {
// 	console.log('interactive');
// }


//console.log(spdxLicenseList.MIT);
//=> { name: 'MIT License', osiApproved: true }


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