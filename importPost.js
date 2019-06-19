// Propel Import API
// load items from CSV file into propel using API

const config = require('./config') // username and password stored here
// ./config.js
// module.exports = {
//   username : 'ron@username.dev',
//   password : 'yourpass_and_token', //must include password+token
//   loginUrl : 'https://login.salesforce.com'
// };

const fs = require('fs')
const jsforce = require('jsforce')        // https://www.npmjs.com/package/jsforce  and see docs: https://jsforce.github.io/
const conn = new jsforce.Connection({ loginUrl : config.loginUrl})
let namespace = config.namespace || 'PDLM';

//
// the file try.csv contains a valid CSV import file for your org
// you must import a file using the Propel application one time to establish the column mappings
// after that, this api will re-use those stored column to field mappings
//
const filedata = fs.readFileSync('./try.csv', 'utf8');
const base64data = new Buffer(filedata).toString('base64');
conn.login(config.username, config.password)
.then( () => {
  //
  // invoke the Propel API passing in the body base64 encoded
  //
  return conn.apex.post('/services/apexrest/'+namespace+'/Import/?hasItem=true&hasbom=false', base64data);
})
.then( (resultRows) => {
  console.log("Propel Item and Revision imported: ", resultRows);
  // the response is list of Apex.RowResult
  // [{ warning: '',
  //   success: true,
  //   rowName: '20-00362:A*',
  //   objName: 'Item Revision',
  //   isInsert: false,
  //   id: 'a0936000009c7OaAAI',
  //   errors: [],
  //   description: '' }]
})
.catch((e)=>{ console.log(e) });
