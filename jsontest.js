// https://www.npmjs.com/package/jsonfile
// read json
var jsonfile = require('jsonfile')
var obj = jsonfile.readFileSync('./urls.json');
console.log(obj['/']);
console.log(obj['/a']);

