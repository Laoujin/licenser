'use strict';
var nomnom = require('nomnom');

module.exports = function(config) {
	nomnom.command('list')
		.callback(function(opts) {
			if (opts._[1]) {
				opts.searchFor = opts._[1];
				if (!opts.osi && !opts.creativeCommons) {
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
		.option('verbose', {
			abbr: 'v',
			flag: true,
			help: 'show more information for the most common licenses'
		})
		.option('creativeCommons', {
			abbr: 'c',
			full: 'creative-commons',
			flag: true,
			help: 'show the latest versions of the Creative Commons'
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

	nomnom.command('config')
		.option('author', {
			help: 'name to place in your licenses',
			default: config.global.author
		})
		.option('email', {
			help: 'default author email',
			default: config.global.email
		})
		.option('license', {
			help: 'your default license key (ex: MIT, CC-BY-4.0, ...)',
			default: config.global.license
		})
		.option('defaultFileName', {
			abbr: 'n',
			full: 'default-name',
			help: 'the default name for your license file',
			default: config.global.defaultFileName
		})
		.help('set global licenser settings');

	var licenseKeyHelp = 'the license key (ex: MIT, Apache2, GPL3, ...)';
	nomnom.command('print')
		.option('key', {
			position: 1,
			help: licenseKeyHelp,
			required: true
		})
		.option('header', {
			flag: true,
			help: 'show the license header instead of the full license (For licenses like Apache-2.0, GPL-3.0+ etc a smallish header can be included in your source files instead of the entire license text in each file)'
		})
		.help('print a full license');

	nomnom.command('update')
		// .option('readme', {
		// 	flag: true,
		// 	help: 'also update the year in README.md',
		// 	default: true
		// })
		.help('your yearly license update automated. wheee!');

	nomnom.command('set')
		.help('sets the license and adds the file')
		.option('license', {
			position: 1,
			help: licenseKeyHelp,
			default: config.defaults.license
		})
		.option('global', {
			abbr: 'g',
			flag: true,
			help: 'overwrite package.json license and/or file with your global licenser configuration'
		})
		// .option('readme', {
		// 	flag: true,
		// 	help: 'also add license notice at the end of the README.md file'
		// })
		.option('author', {
			help: 'name to place in the license',
			default: config.defaults.author.name
		})
		.option('year', {
			help: 'year(s) to place in the license (ex: 2003-2015 or 2015)',
			default: config.defaults.project.years
		})
		.option('email', {
			help: 'author email',
			default: config.defaults.author.email
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
