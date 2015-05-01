'use strict';

// Get current license(s) & file status etc
var _ = require('lodash');
var colors = require('colors/safe');
var fs = require('fs');
var path = require('path');
var jsonFile = require('json-file-plus');
var packageJsonPath = path.join(process.cwd(), 'package.json');

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
	return {
		name: '',
		email: '',
		url: ''
	};
}

function getCurrentProject() {
	return {
		url: 'httpsomething'
	};
}

var currentLicense = packageJson ? packageJson.license : '';
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
			//fileName: globalConfig.fileName,
			// filePath: path.join(process.cwd(), this.fileName),
			fileExists: function() {
				return fs.existsSync(filePath);
			},
			license: this.getDetails(currentLicense),
			licenses: licenses,
			hasNpmPackage: packageJson !== undefined
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
	getDetails: function(licenseKey, full) {
		full = full || false;

		var lic = _.merge({
			key: licenseKey,
			valid: licenses[licenseKey] !== undefined
		}, licenses[licenseKey]);

		if (full && lic.valid) {
			try {
				lic.full = fs.readFileSync(spdxLicensesPath + licenseKey +'.txt').toString();
				if (lic.clean) {
					lic.full = lic.full.replace(new RegExp(lic.clean), '');
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
		var customLicense = license.full;

		if (license.match) {
			var named = require('named-regexp').named;
			var re = named(new RegExp(license.match, 'g'));

			customLicense = re.replace(customLicense, function(matched) {
				//console.log('matched', matched.captures);
				return license.replace
					.replace('$years', new Date().getFullYear())
					.replace('$author', currentAuthor.name)
					.replace('$email', currentAuthor.email)
					.replace('$url', currentProject.url);
			});

			//console.log("captured:", matched);

			//
			//console.log(matched.captures); //=> { foo: [ 'aaa', 'bbb' ], bar: [ 'ccc' ] }
			//console.log(matched.capture('foo')); //=> 'bbb' // last matched

			//currentAuthor.name / email / url
		}

		try {
			fs.writeFileSync(filePath, customLicense, 'utf8');
			console.log(globalConfig.fileName + ' created');
		} catch(err) {
			console.log('Error writing license file', err);
		}
	}
};