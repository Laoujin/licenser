'use strict';
//var _ = require('lodash');
var nomnom = require('nomnom');

module.exports = function(args) {
	nomnom.command('list')
		.callback(function(opts) {
			if (!opts.all && !opts.osi) {
				opts.common = true;
			}
		})
		.help('show licenses')
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

	nomnom.command('add')
		.callback(function(opts) {
			
		})
		.option('license', {
			position: 0,
			help: 'the license type'
		})
		.option('author', {
			abbr: 'auth',
			help: 'name to place in the license'
		})
		.option('year', {
			help: 'year to place in the license',
			default: new Date().getFullYear()
		})
		.option('force', {
			abbr: 'f',
			flag: true,
			help: 'overwrite existing license'
		});

	var opts = nomnom.parse(args);
	return opts;
};
