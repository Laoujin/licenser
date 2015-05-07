'use strict';
var nomnom = require('nomnom');

module.exports = function(config) {
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
		.option('header', {
			flag: true,
			help: 'show the license header instead of the full license (For licenses like Apache-2.0, GPL-3.0+ etc a smallish header can be included in your source files instead of the entire license text in each file)'
		})
		.help('print a full license');

	nomnom.command('set')
		.help('sets the license and adds the file')
		.option('license', {
			position: 1,
			help: 'the license key',
			default: config.defaults.license
		})
		.option('author', {
			abbr: 'auth',
			help: 'name to place in the license',
			default: config.defaults.author.name
		})
		.option('year', {
			help: 'year to place in the license',
			default: config.defaults.project.years
		})
		.option('email', {
			help: 'author email',
			default: config.defaults.author.email
		})
		.option('url', {
			help: 'project url',
			default: config.defaults.project.url
		})
		.option('project', {
			help: 'project name',
			default: config.defaults.project.name
		})
		.option('desc', {
			help: 'project description',
			default: config.defaults.project.desc
		});

	var opts = nomnom.parse();
	return opts;
};
