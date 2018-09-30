/**
 * @author Alex Pandre
 * @copyright 2018-Present, Alex Pandre
 */

const fs = require('fs');
//const uuidv1 = require('uuid/v1');
const arrOps = require('../modules/arrayTools');

// <https://nodejs.org/docs/latest-v8.x/api/modules.html#modules_dirname>
const jsonDB = __dirname + '/inventory.json';



/**
 * @summary Get all data as object from JSON file
 * @returns { collection:  inventory | null,   [error: 'error message'] }
 */
var getAll = function () {
	const filepath = jsonDB;
	if ( fs.existsSync(filepath) ) {
		const rawdata = fs.readFileSync(filepath);
		const inventory = JSON.parse(rawdata);
		// check if collection is empty
		if ( inventory.length == 0 ) {
			let msg = 'Collection is empty.';
			//console.log( __file, __func, __line, ">>> Message: ", msg, "\n");
			return { collection: null,   error: msg };
		}
		return { collection: inventory };
	}

	//console.log( __file, __func, __line, ">>> File not exist:\n", filepath, "\n");
	return { collection:  null,   error: 'File not exist.' };
}



/**
 * @summary Find record with given id
 * @returns { record: result, obj: res.collection, error: msg }
 */
var findById = function ( id ) {
	//
	const res = this.getAll();
	if ( !res.collection ) {
		if ( res.error ) {
			//console.log( __file, __func, __line, ">>> Message: ", res.error, "\n");
			return { record: false, obj: false, error: res.error };
		}
		let msg = 'Something goes wrong during file reading.';
		//console.log( __file, __func, __line, ">>> Message: ", msg, "\n");
		return { record: false, obj: false, error: msg };
	}
	const obj2search = res.collection;
	const result = obj2search.find( function(o) {
		return o.id == id;
	});

	if ( !result ) {
		let msg = "There are no records with that id.";
		//console.log( __file, __func, __line, ">>> Message: ", msg, "\n");
		return { record: false, obj: res.collection, error: msg };
	} else {
		//console.log( __file, __func, __line, ">>> result:\n", result, "\n");
		return { record: result, obj: res.collection };
	}
}



/**
 * @summary Create new course record
 */
var createRecord = function( record ) {
	//console.log( __file, __func, __line, ">>> record:\n", record, "\n");

	/**
	 * Check if record with the same id already exist,
	 * in the same time retrieve all records,
	 * then fill in date_created and last_update,
	 * then push record to result and write it back to JSON file.
	 */
	let res = this.findById( record.id );
	if ( res.record ) {
		res.error = 'record with that id already exist';
		//console.log( __file, __func, __line, ">>> Message: ", res.error, "\n");
		return res;
	}

	const dt = new Date().toISOString()
								.replace(/T/, ' ')      // replace T with a space
								.replace(/\..+/, '');   // delete the dot and everything after
	record.date_created = dt;
	record.last_update = dt;

	const inventory = res.obj;
	inventory.push(record);

	fs.writeFileSync( jsonDB, JSON.stringify(inventory, null, 2) );
	// check again to make sure it was saved
	res = this.findById( record.id );
	return res;
}



/**
 * @summary Update course record
 */
var updateRecord = function( editedRecord ) {
	// 1st make sure its exists
	let res = this.findById( editedRecord.id );
	//console.log( __file, __func, __line, ">>> id:\n", res.record.id, "\n");
	if ( !res.record || res.hasOwnProperty('error') ) {
		//console.log( __file, __func, __line, ">>> Message: ", res.error, "\n");
		return res;
	}

	const dt = new Date().toISOString()
								.replace(/T/, ' ')      // replace T with a space
								.replace(/\..+/, '');   // delete the dot and everything after
	editedRecord.last_update = dt;

	const inventory = arrOps.removeArrayElement( res.obj, res.record );
	inventory.push( editedRecord );

	fs.writeFileSync( jsonDB, JSON.stringify(inventory, null, 2) );
	// check again to make sure it was saved
	res = this.findById( editedRecord.id );
	return res;
}



/**
 * @summary Delete course record with given id
 */
var deleteRecord = function ( id ) {
	// 1st make sure its exists
	let res = this.findById( id );

	if ( !res.record || res.hasOwnProperty('error') ) {
		//console.log( __file, __func, __line, ">>> Message: ", res.error, "\n");
		return { statusCode: 400, message: res.error };
	}

	const inventory = arrOps.removeArrayElement( res.obj, res.record );

	fs.writeFileSync( jsonDB, JSON.stringify(inventory, null, 2) );
	// check again to make sure it was saved
	res = this.findById( id );
	if ( !res.record ) {
		// if record with that id was not found, then it was deleted
		// for deleteRecord it is success
		//console.log( __file, __func, __line, ">>> Record was deleted." );
		return { statusCode: 200, message: "Record was deleted." };
	}
	//console.log( __file, __func, __line, ">>> Message: ", res.error );
	return { statusCode: 400, message: res.error };
}



/**
 * that could be useful for search functionality
 */
//var propertyNames = Object.keys(result).filter(
//	function (propertyName) {
//		//return propertyName.indexOf("meta") === 0;
//		return propertyName.indexOf("results") === 0;
//});
//console.log( propertyNames, "\n" );





module.exports = {
	createRecord,    // Crud
	getAll,          // cRud
	findById,        // cRud
	updateRecord,    // crUd
	deleteRecord     // cruD
};
