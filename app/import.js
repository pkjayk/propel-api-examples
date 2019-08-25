// Propel Import API
// load items from JSON file into propel using API

const config = require('../config') // username and password stored here
// ./config.js
// module.exports = {
//   username : 'jayson@username.dev',
//   password : 'yourpass_and_token', //must include password+token
//   loginUrl : 'https://login.salesforce.com'
// };

const fs = require('fs')
const jsforce = require('jsforce')        // https://www.npmjs.com/package/jsforce  and see docs: https://jsforce.github.io/
const { parse } = require('json2csv')
const conn = new jsforce.Connection({ loginUrl : config.loginUrl})
const DocumentUpload = require('./DocumentUpload')
let namespace = config.namespace || 'PDLM';
let dataFile = require('../test_data/sample-bom-large.json')
let fieldMapping = require('../test_data/field-mapping.json')

//
// the file try.csv contains a valid CSV import file for your org
// you must import a file using the Propel application one time to establish the column mappings
// after that, this api will re-use those stored column to field mappings
//

class Import {

  constructor(req, res) {

    this.data = dataFile
    this.fields = fieldMapping

  }

  async authenticateSf() {
    return new Promise(async (resolve, reject) => {
      try {
        await conn.login(config.username, config.password)
        .then( () => {
          resolve(conn)
        })
      .catch((e)=>{ console.log(e) });} catch (err) {
        console.error(err);
        reject(error)
      }
    })
  }

  async importData(){
    return new Promise(async (resolve, reject) => {

      //first Authenticate into SF
      const auth = await this.authenticateSf()

      let items = this.data.bomTable.items;

      // TODO: make call to grab top-level assembly
      var firstItem = {Level: 0, Category: 'Assembly', 'Item Number': null, Quantity: '1'}
      var reformattedItems = [firstItem];

      // iterate through BOM and grab relevant fields to construct import file
      for (var i = 0; i < items.length; i++) {
        
        let newItem = items[i];

        var thisItem = {};

        thisItem = this.buildRow(this.fields, newItem, 'Part')

        reformattedItems.push(thisItem);

      }

      const columns = Object.values(this.fields);
      const opts = { columns };
       
      try {
        const csv = parse(reformattedItems, opts);
        const base64data = new Buffer(csv).toString('base64');

        auth.apex.post('/services/apexrest/'+namespace+'/api/v2/import?hasATT=true&isReplacingBOM=true', base64data)
        .then( (resultRows) => {
          if(resultRows) {
            resolve(this.buildResponse(resultRows))
          } else {
            resolve('Error importing data')
          }
        })
      .catch((e)=>{ console.log(e) });} catch (err) {
        console.error(err);
        reject('login failed')
      }
    })
  }

  /*
   * @param {object} map             | Field mapping of JSON Field Name: 
   * @param {object} data            | import data
   * @param {string} defaultCategory | fallback category to prevent import failure if category is missing
  */
  buildRow(map, data, defaultCategory = '') {
    var formattedRow = {}

    for(let key in map){

      /*if(typeof map[key] === 'object' && map[key] !== null) {
        for(let nestedKey in map) {
          console.log(nestedKey)
          formattedRow[map[key]] = data[key][nestedKey] ? data[key][nestedKey] : null
        }
      }*/
      if(map[key] == 'Category' && (data[key] == 'N/A' || data[key] == null)) {       // allow for a default category
        formattedRow[map[key]] = defaultCategory
      } else {
        formattedRow[map[key]] = data[key] ? data[key] : null
      }
    }

    // hard code Onshape params for now
    formattedRow['Doc ID'] = data['itemSource']['documentId']
    formattedRow['WVM Type'] = data['itemSource']['wvmType']
    formattedRow['WVM ID'] = data['itemSource']['wvmId']
    formattedRow['Ele ID'] = data['itemSource']['elementId']  
  
    formattedRow['File Name'] = 'test 1234' // TOOD: Fix issue where need to create item first before creating attachments
    formattedRow['URL'] = 'http://www.google.com'

    return formattedRow
  }

  /*
    Returns a response for API
  */
  buildResponse(results) {
    var resultWrapper = {}
    resultWrapper.statusCode = complete
    resultWrapper.totalResults = results.length
    resultWrapper.results = results 

    return resultWrapper;
  }

}

module.exports = Import