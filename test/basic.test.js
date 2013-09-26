'use strict'

var assert = require('assert')
var JSONMinus = require('../json-minus')

describe('JSONMinus', function() {
    var validator = JSONMinus({
        'anyString'      : {type: 'string'},
        'nonemptyString' : {type: 'string', match: /./},
        'anyNumber'      : {type: 'number'},
        'rangeNumber'    : {type: 'number', gt: 0, lte: 1},
        'ar.x'           : {type: 'integer'},
        'omitEmptyString': {type: 'string', omitEmpty: true}
    })

    var in1 = {nonemptyString: 'a', rangeNumber: 0.5}
    var in2 = {nonemptyString: '', rangeNumber: 0.5}
    var in3 = {nonemptyString: 'a', rangeNumber: 0}
    var in4 = {nonemptyString: 'a', rangeNumber: 0.5, oddProp: 1}
    var in5 = {omitEmptyString: 'a'}

    it('should convert undefined to empty string for string types', function() {
        var out = validator(in1)
        assert.ok(out.anyString === '')
    })

    it('should convert undefined to 0 for numeric types', function() {
        var out = validator(in1)
        assert.ok(out.anyNumber === 0)
    })

    it('should throw when string fails to match constraint', function() {
        assert.throws(function() {
            validator(in2)
        }, (/nonemptyString must match \/\.\//))
    })

    it('should throw when number fails to match constraint', function() {
        assert.throws(function() {
            validator(in3)
        }, (/rangeNumber must be greater than 0/))
    })

    it('should throw on unexpected property', function() {
        assert.throws(function() {
            validator(in4)
        }, (/unexpected property: oddProp/))
    })

    it('should convert undefined to empty array for array types', function() {
        var out = validator(in1)
        assert.ok(Array.isArray(out.ar) && out.ar.length === 0)
    })

    it('should omit empty string when omitEmpty is true', function() {
        var out = validator(in1)
        assert.ok(typeof out.omitEmptyString === 'undefined')
    });
})