'use strict';
var nomnom = require('nomnom');

module.exports = function(args, config) {
	nomnom.command('list')
		.callback(function(opts) {
			if (opts._[1]) {
				opts.searchFor = opts._[1];
				if (!opts.osi) {
					opts.all = true;
				}
			}

			if (!opts.all && !opts.osi) {
				opts.common = true;
			}
		})
		.help('show licenses')
		.option('filter', {
			position: 1,
			help: 'filters the list with the value given'
		})
		.option('common', {
			flag: true,
			help: 'show most common licenses (default)'
		})
		.option('all', {
			flag: true,
			abbr: 'a',
			help: 'show all licenses'
		})
		.option('osi', {
			flag: true,
			help: 'show OSI approved licenses'
		});

	nomnom.command('print')
		.option('key', {
			position: 1,
			help: 'the license key',
			required: true
		})
		.help('print a full license');

	nomnom.command('set')
		.callback(function(opts) {
			
		})
		.help('sets the license and adds the file')
		.option('license', {
			position: 1,
			help: 'the license key',
			required: true
		})
		.option('author', {
			abbr: 'auth',
			help: 'name to place in the license'
		})
		.option('year', {
			help: 'year to place in the license',
			default: new Date().getFullYear()
		});

	var opts = nomnom.parse(args);
	return opts;
};
