'use strict';
var _ = require('lodash');
var assert = require('assert');

module.exports = function(licenses) {
	assert(licenses.spdx, 'licenses.spdx should be the object from spdx-license-list');
	assert(_.isObject(licenses.common), 'licenses.common should be an array of common license keys');

	// TODO: we zaten hier:
	// remove this and use _.merge or something..

	return _.forOwn(licenses.spdx, function(lic, key) {
		return {
			key: key,
			name: lic.name,
			osiApproved: lic.osiApproved,
			common: licenses.common[key] === true
		};
	});
};