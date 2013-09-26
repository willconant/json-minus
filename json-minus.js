/*
Copyright (c) 2013 Will Conant, http://willconant.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

'use strict'

module.exports = JSONMinus

function JSONMinus(propDefs) {
    return function(doc) {
        var copy = {};
        var propsLeft = {}
        Object.keys(doc).forEach(function(key) {
            var value = doc[key]
            if (Array.isArray(value)) {
                copy[key] = []
                value.forEach(function(subdoc, index) {
                    if (typeof subdoc === 'object' && subdoc !== null) {
                        copy[key][index] = {}
                        Object.keys(subdoc).forEach(function(subkey) {
                            copy[key][index][subkey] = subdoc[subkey]
                            propsLeft[key + '.' + subkey] = true
                        })
                    } else {
                        copy[key][index] = null
                    }
                })
            } else {
                copy[key] = value
                propsLeft[key] = true
            }
        })

        Object.keys(propDefs).forEach(function(name) {
            var propDef = propDefs[name]
            delete propsLeft[name]

            var m = /^(\w+)(\.(\w+))?$/.exec(name)
            if (!m) {
                throw new Error('invalid property name: ' + name)
            }
            var prop = m[1]
            var subprop = m[3]

            var cleaner = cleaners[propDef.type]
            process(function(index, value) {
                var cleanValue
                try {
                    cleanValue = cleaner(value)
                    if (propDef.type === 'string') {
                        if (propDef.match instanceof RegExp && !propDef.match.test(cleanValue)) {
                            throw new Error('must match ' + propDef.match.toString())
                        }
                        if (propDef.omitEmpty && cleanValue === '') {
                            cleanValue = undefined
                        }
                    } else if (propDef.type === 'number' || propDef.type === 'integer') {
                        if (typeof propDef.gt === 'number' && cleanValue <= propDef.gt) {
                            throw new Error('must be greater than ' + propDef.gt)
                        }
                        if (typeof propDef.gte === 'number' && cleanValue < propDef.gte) {
                            throw new Error('must be greater than or equal to ' + propDef.gte)
                        }
                        if (typeof propDef.lt === 'number' && cleanValue >= propDef.lt) {
                            throw new Error('must be less than ' + propDef.lt)
                        }
                        if (typeof propDef.lte === 'number' && cleanValue > propDef.lte) {
                            throw new Error('must be less than or equal to ' + propDef.lte)
                        }
                    }
                    return cleanValue
                } catch (err) {
                    error(index, err.message)
                }
            })

            function process(fn) {
                var cleanValue;
                if (subprop) {
                    if (typeof copy[prop] === 'undefined') {
                        copy[prop] = []
                    } else if (!Array.isArray(copy[prop])) {
                        throw new Error(prop + ' must be an array of objects')
                    }
                    copy[prop].forEach(function(subdoc, i) {
                        if (subdoc === null) {
                            error('must be an object')
                        } else {
                            cleanValue = fn(i, subdoc[subprop])
                            if (typeof cleanValue !== 'undefined') {
                                subdoc[subprop] = cleanValue
                            }
                        }
                    })
                } else {
                    cleanValue = fn(null, copy[prop])
                    if (typeof cleanValue !== 'undefined') {
                        copy[prop] = cleanValue
                    }
                }
            }

            function error(index, message) {
                var name = prop
                if (index !== null) {
                    name += '[' + index + '].' + subprop
                }
                throw new Error(name + ' ' + message)
            }
        })

        var propsLeft = Object.keys(propsLeft)
        if (propsLeft.length > 0) {
            if (propsLeft.length > 1) {
                throw new Error('unexpected properties: ' + propsLeft.join(', '))
            } else {
                throw new Error('unexpected property: ' + propsLeft[0])
            }
        }

        return copy
    }
}

var cleaners = {
    string: cleanString,
    number: cleanNumber,
    integer: cleanInteger,
    boolean: cleanBoolean
}

function cleanString(value) {
    var type = typeof value

    if (type !== 'string') {
        if (type === 'number') {
            if (!isFinite(value)) {
                throw new TypeError('cannot be Infinity, -Infinity, or NaN')
            }
            value = value.toString(10)
        } else if (type === 'boolean') {
            value = value.toString()
        } else if (type === 'undefined') {
            value = ''
        } else {
            throw new TypeError('cannot be ' + type)
        }
    }

    return value
}

function cleanNumber(value) {
    var type = typeof value

    if (type !== 'number') {
        if (type === 'string') {
            value = parseFloat(value)
        } else if (type === 'undefined') {
            value = 0
        } else {
            throw new TypeError('cannot be ' + type)
        }
    }

    if (!isFinite(value)) {
        throw new TypeError('cannot be Infinity, -Infinity, or NaN')
    }

    return value
}

function cleanInteger(value) {
    var type = typeof value

    if (type !== 'number') {
        if (type === 'string') {
            value = parseFloat(value)
        } else if (type === 'undefined') {
            value = 0
        } else {
            throw new TypeError('cannot be ' + type)
        }
    }

    if (!isFinite(value)) {
        throw new TypeError('cannot be Infinity, -Infinity, or NaN')
    }

    value = Math.round(value)

    return value
}

function cleanBoolean(value) {
    var type = typeof value

    if (type !== 'boolean') {
        if (type === 'string') {
            if (value === 'true' || value === '1') {
                value = true
            } else if (value === 'false' || value === '0' || value === '') {
                value = false
            } else {
                throw new Error('must be "true", "1", "false", "0", or "" for string conversion')
            }
        } else if (type === 'number') {
            if (value === 1) {
                value = true
            } else if (value === 0) {
                value = false
            } else {
                throw new Error('must be 1 or 0 for number conversion')
            }
        } else if (type === 'undefined') {
            value = false;
        } else {
            throw new TypeError('cannot be ' + type);
        }
    }

    return value
}
