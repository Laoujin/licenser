'use strict';

// Get current license(s) & file status etc
var _ = require('lodash');
var colors = require('colors/safe');
var fs = require('fs');
var path = require('path');
var jsonFile = require('json-file-plus');
var packageJsonPath = path.join(process.cwd(), 'package.json');
//var packageJsonPath = __DIRNAME + '../package.json';

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

var currentLicense = packageJson ? packageJson.license : '';

// Combine license jsons
var licenseModelBuilder = require('./licenseModelBuilder.js');
var licenses = licenseModelBuilder({
	spdx: require('spdx-license-list'),
	common: require('../licenses.json')
});


module.exports = {
	getConfig: function(spdxlicenses) {
		var config = {
			fileName: 'LICENSE',
			fileExists: function() {
				return fs.existsSync(this.fileName);
			},
			license: this.getDetails(currentLicense),
			licenses: licenses,
			hasNpmPackage: packageJson !== undefined
		};

		return config;
	},
	getDetails: function(license) {
		return _.merge({
			key: license,
			valid: licenses[license] !== undefined
		}, licenses[license]);
	},
	updatePackageJson: function(licenseKey) {
		jsonFile(packageJsonPath, function (err, file) {
			file.set({
				license: licenseKey
			});

			file.save(function(err) {
			}).then(function () {
				console.log('package.json updated!');
			}).catch(function (err) {
				console.log('Whoops! Error updating package.json', err);
			});
		});
	}
};