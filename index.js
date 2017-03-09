'use strict';
var fs = require('fs')
var typeCheck = require('type-check').typeCheck;
var getCallerPath = require('caller-path')
var escallmatch = require('escallmatch')
var esprima = require('esprima')
var estraverse = require('estraverse')

var matcher = escallmatch('assert(match)')

module.exports = function (input) {
	var callerPath = getCallerPath()

	return {
		is: function (type) {
			var valid;
			var err;

			if (typeof type === 'function') {
				err = input + ' did not pass the test' + (type.name && ' of function `' + type.name + '`');
				valid = type(input);
			} else if (typeof input === 'undefined') {
				estraverse.traverse(esprima.parse(fs.readFileSync(callerPath, 'utf8')), {
					enter: (currentNode, parentNode) => {
						if (matcher.test(currentNode)) {
							var argument = currentNode.arguments[0]
							var errInput = `${argument.object.name}.${argument.property.name}`
							err = `Expected \`${errInput}\` to be of type \`${type}\`, got \`undefined\``
							valid = false
						}
					}
				})
			} else {
				err = input + ' is not of type ' + type;
				valid = typeCheck(type, input);
			}

			if (!valid) {
				throw new TypeError(err);
			}
		},
		isOptional: function (type) {
			if (input === undefined) {
				return;
			}

			this.is(type);
		}
	};
};
