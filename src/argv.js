'use strict';
//var _ = require('lodash');
var nomnom = require('nomnom');

module.exports = function(licenses, commands, cli) {
	commands = commands || {};

	if (cli === undefined) {
		nomnom.command('list')
			.callback(function(opts) {
				var list = require('./lic/list.js')(licenses, opts);
				return commands.list(list, opts);
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
			})
			.option('verbose', {
				abbr: 'v',
				flag: true,
				help: 'verbose output'
			});

		nomnom.command('add')
			.callback(function(opts) {
				commands.add(opts);
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

		cli = nomnom.parse();
	}

	return cli;
};
