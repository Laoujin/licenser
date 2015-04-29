'use strict';

var _ = require('lodash');

module.exports = function(licenses, opts) {
	if (opts.all) {
		return licenses;

	} else if (opts.osi) {
		return _.filter(licenses, function(lic) {
			return lic.osiApproved;
		});

	} else {
		return _.filter(licenses, function(lic) {
			return lic.common;
		});
	}
};