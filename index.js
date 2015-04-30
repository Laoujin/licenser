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
var swig  = require('swig');

renderTemplate('header');

// Combine license jsons
var licenseModelBuilder = require('./src/licenseModelBuilder.js');
var licenses = licenseModelBuilder({
	spdx: require('spdx-license-list'),
	common: require('./licenses.json')
});

// Current licensing data
var config = require('./src/status.js');

// Running without parameters
// Print some general license info
if (process.argv.length === 2) {
	renderTemplate('status');
	process.exit();
}

// Running with parameters
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
	//require('')();
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
	renderTemplate('add', config);
	
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