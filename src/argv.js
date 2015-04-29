'use strict';
var _ = require('lodash');
var cli = require('optimist').argv;

var args = {
	empty: _.size(cli) === 2,
	valid: cli._.length === 0
};

if (!args.empty) {
	args.add = {};
	
}

function a() {

}

module.exports = args;
