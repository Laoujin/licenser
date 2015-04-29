'use strict';
//var _ = require('lodash');
var nomnom = require('nomnom');

module.exports = function(licenses, commands, cli) {
	commands = commands || {};

	if (cli === undefined) {
		nomnom.command('list')
			.callback(function(opts) {
				var list = require('./lic/list.js')(licenses, opts);
				console.log(opts, list);
				return commands.list(list);
			})
			.help('show all common licenses')
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

	// console.log('args', cli);

	// var args = {
	// 	empty: _.size(cli) === 1
	// };

	

	// if (!args.empty) {
	// 	args.add = {};
		
	// }

	return cli;
};
