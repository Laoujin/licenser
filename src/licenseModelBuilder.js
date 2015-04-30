'use strict';
var _ = require('lodash');
var assert = require('assert');

module.exports = function(licenses) {
	assert(licenses.spdx, 'licenses.spdx should be the object from spdx-license-list');
	assert(_.isObject(licenses.common), 'licenses.common should be an object with extra license information (keys should be the same as the spdx list)');

	// merge
	var lics = _.merge(licenses.spdx, licenses.common);
	return lics;
};