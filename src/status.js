'use strict';

// Get current license & file status etc
var fs = require('fs');
var spdxlicenses = require('spdx-license-list');
var packageJson = require('../package.json');

var config = {
	fileName: 'LICENSE',
	fileExists: function() {
		return fs.existsSync(this.fileName);
	},
	license: {
		name: packageJson.license,
		valid: spdxlicenses[packageJson.license] !== undefined
	},
	spdx: spdxlicenses[packageJson.license]
};

if (config.license.valid) {
	config.license.osiApproved = config.spdx.osiApproved;
}

module.exports = config;