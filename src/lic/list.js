'use strict';

var _ = require('lodash');
var status = require('../status.js');

module.exports = function(licenses, opts) {
	if (opts.searchFor) {
		var toKeep = status.getMatches(opts.searchFor);

		_.forOwn(licenses, function(lic, key) {
			if (toKeep.indexOf(key) === -1) {
				delete licenses[key];
			}
		});
	}

	if (opts.all) {
		return licenses;

	} else if (opts.osi) {
		_.forOwn(licenses, function(lic, key) {
			if (!lic.osiApproved) {
				delete licenses[key];
			}
		});
		return licenses;

	} else {
		_.forOwn(licenses, function(lic, key) {
			if (!lic.common) {
				delete licenses[key];
			}
		});
		return licenses;
	}
};