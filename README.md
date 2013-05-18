# json-minus #

The json-minus node module provides a tool for validating and preparing JavaScript objects for database insertion. It targets a subset of JSON documents called [JSON Minus](http://willconant.com/json-minus).


## Installation ##

    npm install json-minus


## Example ##

Create a JSON Minus validator by passing a property specification to the `JSONMinus` constructor:

    var Person = JSONMinus({
        'name'         : {type: 'string', match: /[a-zA-Z]/},
        'eyeColor'     : {type: 'string', match: /^(blue|brown|green|gray|hazel)$/},
        'weight'       : {type: 'number', gt: 0, lt: 500},
        'likesSeafood' : {type: 'boolean'}
    })

The resulting validator is a function that accepts an object and makes a validated copy of that object. Limited type conversion is performed as the input object is copied:

    Person({name: 'Will', eyeColor: 'hazel', weight: '185'})

Produces:

    {name: 'Will', eyeColor: 'hazel', weight: 185, likesSeafood: false}


## Nested Structures ##

A top-level property of a JSON Minus document may be an array of homogeneous objects. Such arrays and the properties of their contained sub-objects may be specified like this:

    var Order = JSONMinus({
        'total'          : {type: 'string', match: /^\d+\.\d\d$/},
        'items.product'  : {type: 'string'},
        'items.price'    : {type: 'string', match: /^\d+\.\d\d$/},
        'items.quantity' : {type: 'integer', gte: 1}
    })

In this example, an `Order` has the property `items` which contains an array of sub-objects. Each of those sub-objects have the properties `product`, `price`, and `quantity`.

Sub-objects may not contain further nested structures.


## Type Conversion ##

JSON Minus object validators make deep copies of input objects as they perform validation. As the copy is made, some limited type conversion may take place.

### Convesion to Strings ###

  - numbers that are finite and are not `NaN` will be converted to decimal strings
  - booleans will be converted to `'true'` or `'false'`
  - undefined will be converted to the empty string
  - all other non-string values will result in validation errors

### Conversion to Numbers ###

  - strings representing finite decimal numbers will be converted to numbers
  - undefined will be converted to `0`
  - all other non-numeric values will result in validation errors
  - `Infinity`, `-Infinity`, and `NaN` will result in validation errors

### Conversion to Integers ###

Values will be converted to numbers using the rules specified above and then rounded to integers using `Math.round()`.

### Conversion to Booleans ###

  - the strings `'true'` and `'1'` will be converted to `true`
  - the strings `'false'`, `'0'`, and the empty string will be converted to `false`
  - the number `1` will be converted to `true`
  - the number `0` will be onverted to `false`
  - undefined will be converted to `false`
  - all other non-boolean values will result in validation errors


## Validation Constraints ##

### For Strings ###

String values may be constrained by a `RegExp` provided in the `match` property of the property specification. The `match` constraint is applied *after* type conversion.

### For Numbers and Integers ###

Numbers and integers may be constrainted with a combination of the properties `gt`, `gte`, `lt`, and `lte` of the property specification. These constratins are applied *after* type conversion.


## Author ##

Will Conant, http://willconant.com/

## License ##

The json-minus modules is released under the MIT License.
