'use strict';

var _ = require('lodash');

// module.exports = function(licenses, opts) {
// 	if (opts.all) {
// 		return licenses;

// 	} else if (opts.osi) {
// 		return _.filter(licenses, function(lic) {
// 			return lic.osiApproved;
// 		});

// 	} else {
// 		return _.filter(licenses, function(lic) {
// 			return lic.common;
// 		});
// 	}
// };

module.exports = function(licenses, opts) {
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