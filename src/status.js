'use strict';

// Get current license(s) & file status etc
var _ = require('lodash');
var colors = require('colors/safe');
var fs = require('fs');
var path = require('path');
var jsonFile = require('json-file-plus');
var packageJsonPath = path.join(process.cwd(), 'package.json');
var assert = require('assert');
var ini = require('node-ini');

var spdxLicensesPath = __dirname + '/../node_modules/spdx-license-list/licenses/';

// read node package.json
var packageJson;
if (fs.existsSync(packageJsonPath)) {
	try {
		packageJson = fs.readFileSync(packageJsonPath, 'utf8');
		packageJson = JSON.parse(packageJson);

	} catch(err) {
		console.log(colors.magenta('failed to open package.json'));
		console.log(err);
	}
}

function getCurrentAuthor() {
	if (packageJson) {
		return packageJson.author;
	}

	var author = {
		name: '',
		email: ''
	};

	var gitPath = path.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, '.gitconfig');
	if (fs.existsSync(gitPath)) {
		var git = ini.parseSync(gitPath);
		if (git.user) {
			author.name = git.user.name;
			author.email = git.user.email;
		}
	}

	return author;
}

function getCurrentProject() {
	if (packageJson) {
		return {
			years: new Date().getFullYear(),
			name: packageJson.name,
			desc: packageJson.description
		};
	}

	var name = path.normalize(__dirname + '/../').split(path.sep);
	assert(name[name.length -1] === '');
	name = name[name.length - 2];
	return {
		years: new Date().getFullYear(),
		name: name,
		desc: ''
	};
}

function getCurrentLicense() {
	return packageJson ? packageJson.license : '';
}

var currentLicense = getCurrentLicense();
var currentAuthor = getCurrentAuthor();
var currentProject = getCurrentProject();

// Combine license jsons
var licenseModelBuilder = require('./licenseModelBuilder.js');
var licenses = licenseModelBuilder({
	spdx: require('spdx-license-list'),
	common: require('../licenses.json')
});

var globalConfig = {
	fileName: 'LICENSE'
};

var filePath = path.join(process.cwd(), globalConfig.fileName);

module.exports = {
	getConfig: function(spdxlicenses) {
		var config = {
			fileExists: function() {
				return fs.existsSync(filePath);
			},
			license: this.getDetails(currentLicense),
			licenses: licenses,
			hasNpmPackage: packageJson !== undefined,
			defaults: {
				license: currentLicense,
				author: currentAuthor,
				project: currentProject
			},
			update: function(opts) {
				if (opts.license) {
					this.defaults.license = opts.license;
				}
				if (opts.author) {
					this.defaults.author.name = opts.author;
				}
				if (opts.year) {
					this.defaults.project.years = opts.year;
				}
				if (opts.email) {
					this.defaults.author.email = opts.email;
				}
				if (opts.project) {
					this.defaults.project.name = opts.project;
				}
				if (opts.desc) {
					this.defaults.project.desc = opts.desc;
				}
			}
		};

		return config;
	},
	getMatches: function(needle) {
		needle = needle.toLowerCase();

		var i;
		var list = [];
		var descMatches = [];

		var keys = Object.keys(licenses);
		for (i = 0; i < keys.length; i++) {
			if (needle === keys[i].toLowerCase()) {
				return [keys[i]];
			}

			var lic = licenses[keys[i]];
			if (lic.alias) {
				var aliasRegex = new RegExp(lic.alias, 'i');
				if (needle.match(aliasRegex)) {
					return [keys[i]];
				}
			}

			if (keys[i].toLowerCase().indexOf(needle) !== -1) {
				list.push(keys[i]);
			} else {
				assert(lic.name !== undefined, "lic.name undefined. (means a licenses.json key that does not exist in the spdx json)", lic);
				if (lic.name.toLowerCase().indexOf(needle) !== -1) {
					descMatches.push(keys[i]);
				}
			}
		}

		if (list.length === 0) {
			return descMatches;
		}
		return list;
	},
	getDetails: function(licenseKey, getFullText) {
		getFullText = getFullText || false;

		var lic = _.merge({
			key: licenseKey,
			valid: licenses[licenseKey] !== undefined
		}, licenses[licenseKey]);

		if (getFullText && lic.valid) {
			try {
				lic.full = fs.readFileSync(spdxLicensesPath + licenseKey +'.txt').toString();
				if (lic.header) {
					lic.header = new RegExp(lic.header).exec(lic.full)[0];
					if (lic.headerClean) {
						lic.header = lic.header.replace(new RegExp(lic.headerClean, 'mg'), '');
					}
					lic.header = replacePlaceHolders(lic.match, lic.replace, lic.header);
				} else {
					lic.full = replacePlaceHolders(lic.match, lic.replace, lic.full);
				}

			} catch(err) {
				console.log('Error reading ' + licenseKey + ' license content ', err);
			}
		}

		return lic;
	},
	updatePackageJson: function(licenseKey) {
		jsonFile(packageJsonPath, function (err, file) {
			file.set({
				license: licenseKey
			});

			file.save(function(err) {

			}).then(function () {
				console.log('Node package.json updated!');
			}).catch(function (err) {
				console.log('Whoops! Error updating package.json', err);
			});
		});
	},
	writeLicense: function(license) {
		try {
			fs.writeFileSync(filePath, license.full, 'utf8');
			console.log(globalConfig.fileName + ' created');
		} catch(err) {
			console.log('Error writing license file', err);
		}
	}
};

function replacePlaceHolders(matcher, replacer, licenseText) {
	if (matcher) {
		var named = require('named-regexp').named;
		var re = named(new RegExp(matcher, 'g'));

		return re.replace(licenseText, function(matched) {
			return replacer
				.replace('$years', currentProject.years)
				.replace('$author', currentAuthor.name)
				.replace('$email', currentAuthor.email)
				.replace('$url', currentProject.url)
				.replace('$project', currentProject.name + ' - ' + currentProject.desc);
		});
	}
	return licenseText;
}