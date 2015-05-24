'use strict';

// Get current license(s) & file status etc

var _ = require('lodash');
var colors = require('colors/safe');
var fs = require('fs');
var path = require('path');
var jsonFilePlus = require('json-file-plus');
var jsonFile = require('jsonfile');
var assert = require('assert');
var ini = require('node-ini');

var globalConfigPath = path.normalize(__dirname + '/../config.json');
var globalDefaults = jsonFile.readFileSync(globalConfigPath);
var spdxLicensesPath = __dirname + '/../node_modules/spdx-license-list/licenses/';

// read node package.json
var packageJsonPath = path.join(process.cwd(), 'package.json');
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
	if (packageJson && packageJson.author) {
		if (typeof packageJson.author === 'string') {
			var parseAuthors = require('parse-authors');
			var authors = parseAuthors(packageJson.author);
			if (authors.length) {
				return authors[0];
			}

		} else {
			return packageJson.author;
		}
	}

	if (globalDefaults.author) {
		return {
			name: globalDefaults.author,
			email: globalDefaults.email
		};
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

	var name = process.cwd().split(path.sep);
	name = name[name.length -1] === '' ? name[name.length - 2] : name[name.length - 1];
	return {
		years: new Date().getFullYear(),
		name: name,
		desc: ''
	};
}

function getCurrentLicense() {
	if (packageJson && packageJson.license) {
		return packageJson.license;
	}

	if (globalDefaults.license) {
		return globalDefaults.license;
	}

	return '';
}

var currentLicense = getCurrentLicense();
var currentAuthor = getCurrentAuthor();
var currentProject = getCurrentProject();

// Combine license jsons
var licenses = _.merge(require('spdx-license-list'), require('../licenses.json'));

var licenseFileConfig = {
	names: ['LICENSE', 'COPYING'],
	exts: ['', '.md', '.txt'],
	defaultFileName: globalDefaults.defaultFileName || 'LICENSE'
};

function getLicenseFileName() {
	var existing;
	_.forEach(licenseFileConfig.names, function(name) {
		_.forEach(licenseFileConfig.exts, function(ext) {
			var fileName = path.join(process.cwd(), name + ext);
			if (fs.existsSync(fileName)) {
				existing = name + ext;
			}
		});
	});
	return existing || licenseFileConfig.defaultFileName;
}

var config;
var fileName = getLicenseFileName();
var filePath = path.join(process.cwd(), fileName);

module.exports = {
	getConfig: function(spdxlicenses) {
		config = {
			global: globalDefaults,
			fileName: fileName,
			fileExists: function() {
				return fs.existsSync(filePath);
			},
			license: this.getDetails(currentLicense),
			licenses: licenses,
			hasNpmPackage: packageJson !== undefined,
			packageJson: packageJson,
			defaults: {
				license: currentLicense,
				author: currentAuthor,
				project: currentProject
			},
			update: function(opts) {
				if (opts._[0] === 'set' && opts._[1] !== undefined) {
					this.defaults.license = opts.license;
				} else if (opts.global) {
					this.defaults.license = globalDefaults.license;
					opts.license = globalDefaults.license;
				}

				if (opts.global) {
					if (opts._[0] === 'set' && fileName !== licenseFileConfig.defaultFileName) {
						// Zie uglyness
						fs.unlinkSync(filePath);

						fileName = licenseFileConfig.defaultFileName;
						config.fileName = fileName;
						filePath = path.join(process.cwd(), fileName);
					}
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
	getMatches: function(needle, returnAll) {
		needle = needle.toLowerCase();

		var i;
		var list = [];
		var descMatches = [];

		var keys = Object.keys(licenses);
		for (i = 0; i < keys.length; i++) {
			if (needle === keys[i].toLowerCase()) {
				if (returnAll) {
					list.push(keys[i]);
					continue;
				} else {
					return [keys[i]];
				}
			}

			var lic = licenses[keys[i]];
			if (lic.alias) {
				var aliasRegex = new RegExp(lic.alias, 'i');
				if (needle.match(aliasRegex)) {
					if (returnAll) {
						list.push(keys[i]);
						continue;
					} else {
						return [keys[i]];
					}
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

		if (returnAll || list.length === 0) {
			return descMatches.concat(list);
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
		jsonFilePlus(packageJsonPath, function (err, file) {
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
	readLicenseFile: function() {
		return fs.readFileSync(filePath).toString();
	},
	writeLicense: function(license) {
		var doWrite = false;
		if (!config.fileExists()) {
			doWrite = true;

		} else {
			var currentContent = this.readLicenseFile();
			if (currentContent !== license.full) {
				doWrite = true;
				console.log('Overwriting existing ' + fileName + ' file');
			} else {
				console.log(fileName + ' file was up to date');
			}
		}

		if (doWrite) {
			try {
				fs.writeFileSync(filePath, license.full, 'utf8');
				console.log(fileName + ' written');
			} catch(err) {
				console.log('Error writing license file', err);
			}
		}
	},
	setGlobal: function(opts) {
		var beforeConfig = JSON.stringify(globalDefaults, null, 3);
		console.log('Current global configuration:');
		console.log(beforeConfig);

		if (opts.author) {
			globalDefaults.author = opts.author;
		}
		if (opts.email) {
			globalDefaults.email = opts.email;
		}
		if (opts.license) {
			var matched = this.getMatches(opts.license);
			if (matched.length === 1) {
				globalDefaults.license = matched[0];
			} else {
				console.log();
				console.log(colors.magenta('Couldn\'t set license: ' + opts.license + (matched.length === 0 ? ' (Unrecognized license)' : ' (Multiple licenses matched your input)')));
			}
		}
		if (opts.defaultFileName) {
			globalDefaults.defaultFileName = opts.defaultFileName;
		}

		var afterConfig = JSON.stringify(globalDefaults, null, 3);
		console.log();

		if (beforeConfig === afterConfig) {
			console.log(colors.magenta('No configuration passed...?'));
			console.log('\nUsage:\n`licenser config --author=\"Your Name\"`');
			console.log('`licenser config --default-name=LICENSE.txt`');
			return;

		} else {
			console.log(colors.yellow('Updated global configuration:'));
			console.log(colors.yellow(afterConfig));
		}

		try {
			console.log();
			console.log('Updating global settings file: ', globalConfigPath);
			fs.writeFileSync(globalConfigPath, JSON.stringify(globalDefaults, null, 2), 'utf8');
			console.log('Global settings updated!');
		} catch(err) {
			console.log('ERR writing ' + globalConfigPath, err);
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