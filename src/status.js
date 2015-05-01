'use strict';

// Get current license & file status etc
var fs = require('fs');
var spdxlicenses = require('spdx-license-list');
var packageJsonPath = '../package.json';
var packageJson = require(packageJsonPath);

module.exports = {
	getConfig: function() {
		var config = {
			fileName: 'LICENSE',
			fileExists: function() {
				return fs.existsSync(this.fileName);
			},
			license: this.getDetails(packageJson.license)
		};

		return config;
	},
	getDetails: function(license) {
		return {
			key: license,
			valid: spdxlicenses[license] !== undefined,
			spdx: spdxlicenses[license]
		};
	},
	updateConfig: function(licenseKey) {
		//packageJson.license = licenseKey;
		//JSON.stringify(packageJson, null, 4);
		fs.readFile(packageJsonPath, 'utf8', function (err, data) {
			if (err) {
				return console.log(err);
			}
			var current = '"license"\\s*:\\s*"'+packageJson.license+'"';
			var result = data.replace(current, '"license": "'+licenseKey+'"');

			fs.writeFile(packageJsonPath, result, 'utf8', function (err) {
				 if (err) {
				 	return console.log(err);
				 }
			});
		});
	}
};