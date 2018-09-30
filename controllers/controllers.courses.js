/**
 * @author Alex Pandre
 * @copyright 2018-Present, Alex Pandre
 */


const Wreck = require('wreck');
const Boom = require('boom');
const uuidv1 = require('uuid/v1');
const Courses = require('../models/model.courses');



/**
 * @summary UI call to Home page
 */
var home = async function (request, h) {
	// Redirect to Courses paginated list
	let limit;
	limit = request.server.registrations['hapi-pagination'].options.query.limit.default;
	return h.redirect( '/courses?page=1&limit=' + limit );
}



/**
 * @summary API call to get courses list (paginated)
 *
 * @description method: 'GET', path: '/api/courses'
 *
 * @param page
 * @param limit
 * @param pagination
 *
 * @returns JSON
 *
 * TODO: review following
 * Reason for 2 routes for get courses list:
 * There is no info on hapi-pagination and vision views to work together.
 * I've tried. Route that configured to work with hapi-pagination plugin
 * will trow error on attempt to return h.view('courses', data);
 */
var getCoursesAPI = async function (request, h) {

	let res = Courses.getAll();
	const inventory = res.collection;
	if ( !inventory ) throw Boom.badRequest( res.error );

	const limit = request.query.limit;
	const page = request.query.page;
	const pagination = request.query.pagination;

	const offset = limit * (page - 1);
	const response = [];

	let top = inventory.length;
	for (let i = offset; i < (offset + limit) && i < top; ++i) {
		let row = {
			id:        inventory[i].id,
			title:     inventory[i].title,
			grSrc:     inventory[i].graphic.src,
			grAlt:     inventory[i].graphic.alt,
			courseURL: request.server.info.uri + '/api/course/' + inventory[i].id,
			description: inventory[i].description
		};
		response.push(row);
	}

	if (pagination) {
		let result = h.paginate(response, inventory.length);
		return result;
	}
	return h.response(inventory);
}
/**
This API could be tested with browser extension like RESTclient for Firefox,
Postman for Chrome or command-line like this:

For getting paginated result:
curl -X GET -i 'http://localhost:8000/api/courses'

For getting not paginated result:
curl -X GET -i 'http://localhost:8000/api/courses?pagination=false'

Note: host and port number must reflect your configuration.
*/



/**
 * @summary Web UI call to get Courses paginated list
 *
 * @description method: 'GET', path: '/courses'
 *
 * @param page
 * @param limit
 * @param pagination
 *
 * @returns Handlebars template html
 */
var getCourses = async function (request, h) {

	let limit;
	if ( request.query.limit ) {
		limit = request.query.limit;
	} else {
		limit = request.server.registrations['hapi-pagination'].options.query.limit.default;
	}

	let page;
	if ( request.query.page ) {
		page = request.query.page;
	} else {
		page = 1;
	}
	// request.query.pagination is set by hapi-pagination plugin
	// const pagination = request.query.pagination;

	// obtain json from /api/courses
	var bodyStr;
	const url = request.server.info.uri + '/api/courses?page=' + page + '&limit=' + limit;
	const { res, payload } = await Wreck.get( url );
	try {
		await Wreck.read(res);
		bodyStr = payload.toString();
	}
	catch (err) {
		console.error(err);
	}

	const bodyObj = JSON.parse(bodyStr);
	const meta = bodyObj.meta;
	const courses = bodyObj.results;

	// process courses elements .courseURL.replace("/api", "")
	for ( const el of courses ) {
		el.courseURL = el.courseURL.replace("/api", "");
	}

	const data = {
		pageTitle:    'Courses',
		Title:        'Courses List',
		// meta
		page:         meta.page,                       // current page #
		perPage:      meta.limit,                      // # of items per page
		pageCount:    meta.pageCount,                  // total number of pages
		totalCount:   meta.totalCount,                 // total numbers of items
		hasNext:      meta.hasNext,                    // boolean,
		hasPrevious:  meta.hasPrevious,                // boolean,
		first:        meta.first.replace("/api", ""),  // link to 1st page
		self:         meta.self.replace("/api", ""),   // link to self
		last:         meta.last.replace("/api", ""),   // link to last page
		// results
		courses:      courses,
	};

	// link to previous page OR null
	if ( data.hasPrevious ) {
		data.previous = meta.previous.replace("/api", "");
	} else {
		data.previous = "";
	}

	// link to next page OR null
	if ( data.hasNext ) {
		data.next = meta.next.replace("/api", "");
	} else {
		data.next = "";
	}

	return h.view('courses', data);
}



/**
 * @summary module internal function
 *
 * @description Used by getCourseByIdAPI() and getCourseById
 */
function getCourseByIdHelper( id ) {
	if ( !id ) {
		throw Boom.badRequest('Unidentified id');
	}

	const result = Courses.findById( id );
	if ( !result.record ) {
		throw Boom.badRequest( result.error );
	}
	return result;
}



/**
 * @summary API call to get one course by id
 * @description route method: 'GET', path: '/api/course/{id}'
 * @returns JSON
 */
var getCourseByIdAPI = async function (request, h) {
	const result = getCourseByIdHelper(request.params.id);
	return h.response(result.record);
}
/**
 * This API could be tested with browser extension like RESTclient for Firefox,
 * Postman for Chrome or command-line like this:
 *
 * curl -X GET -i 'http://localhost:8000/api/course/e3e5efe3-52f9-45da-9bf5-2c469a1c4357'
 *
 * Note: host, port number and id must reflect your configuration.
 */



/**
 * @summary Web UI call to get one course by id
 * @description route method: 'GET', path: '/course/{id}'
 * @param {id} as request.params.id
 * @returns Handlebars template HTML
 */
var getCourseById = async function (request, h) {
	const result = getCourseByIdHelper(request.params.id);
	result.record.formaction = "/course";    // updateAction
	result.record.edit_onclick = "switch2edit();";
	result.record.view_onclick = "location.href='/course/" + result.record.id + "';";
	return h.view('course', result.record);
}



/**
 * @summary API call to delete course record with given id
 * @description route method: 'DELETE', path: '/api/course'
 *              header: 'Content-Type': 'application/json'
 * @returns JSON
 */
var deleteAPI = async function (request, h) {
	if ( !request.payload ) return h.response({
		statusCode: 400,   message: 'There is no payload'
	});

	if ( !request.payload.id ) return h.response({
		statusCode: 400,   message: 'id was not provided'
	});

	//const id = request.payload.id;
	const res = Courses.deleteRecord( request.payload.id );
	return h.response(res);
}
/**
This API could be tested like this:

curl -X DELETE -H 'Content-Type: application/json' \
   -i 'http://localhost:8000/api/course' \
   --data '{ "id": "6503f710-c224-11e8-ad5d-6b29deb8c778" }'
*/



/**
 * @summary Web UI call to support form submission action
 * @description route method: 'POST', path: '/course/delete'
 *    It is also possible to post is as json
 *    and use request as application/json:
 *    header: 'Content-Type': 'application/json'
 * @returns redirect to courses list
 */
var deleteAction = async function (request, h) {
	if ( !request.payload ) throw Boom.badRequest('There is no payload');
	if ( !request.payload.id ) throw Boom.badRequest('id was not provided');
	const id = request.payload.id;

	const res = Courses.deleteRecord( id );
	if ( res.statusCode != 200 ) {
		throw Boom.badRequest( res.message );
	}
	// maybe view later with link to courses list
	return h.redirect("/");
}



/**
 * @summary module internal function
 * @description Used by createAPI(), createActionPostForm() and updateAction()
 */
function prepRecord( request ) {

	if ( !request.payload ) return {
		record:      false,
		statusCode:  400,
		message:     'Payload is empty'
	};

	const record = request.payload;

	if ( request.path != '/api/course/create' ) {
		if ( !record.id ) return {
			record: false, statusCode: 400, message: 'id is empty'
		};
	}

	if ( !record.title ) return {
		record: false, statusCode: 400, message: 'title is empty'
	};

	if ( !record.slug ) return {
		record: false, statusCode: 400, message: 'slug is empty'
	};

	if ( !record.description ) return {
		record: false, statusCode: 400, message: 'description is empty'
	};

	if ( !record.time ) return{
		record: false, statusCode: 400, message: 'time is empty'
	};
	record.time = Number(record.time);

	if ( !record.language ) return {
		record: false, statusCode: 400, message: 'language is empty'
	};

	if ( !record.skill ) return {
		record: false, statusCode: 400, message: 'skill is empty'
	};

	if ( !record.lessons_count ) return {
		record: false, statusCode: 400, message: 'lessons_count is empty'
	};
	record.lessons_count = Number( record.lessons_count );

	if ( !record.graphic ) {
		record.graphic = {};

		if ( !record.graphic_alt ) return {
			record: false, statusCode: 400, message: 'graphic_alt is empty'
		};
		record.graphic.alt = record.graphic_alt;
		delete(record.graphic_alt);

		if ( !record.graphic_src ) return {
			record: false, statusCode: 400, message: 'graphic_src is empty'
		};
		record.graphic.src = record.graphic_src;
		delete(record.graphic_src);
	}

	if ( record.save )   delete(record.save);
	if ( record.delete ) delete(record.delete);

	//console.log(__file, __func, __line, ">>> record:\n", record, "\n");
	return { record: record,  statusCode: 200,  message: 'record prepped' };
}



/**
 * @summary API call to create new course record
 * @description method: 'POST', path: '/api/course/create'
 *              header: 'Content-Type': 'application/json'
 *    posted data must be JSON representation of the future record without id
 */
var createAPI = async function (request, h) {
	// Fields date_created and last_update will be overwritten
	const res = prepRecord( request );

	if ( !res.record ) return h.response({
		statusCode:   res.statusCode,
		message:      res.message
	});

	res.record.id = uuidv1();
	const result = Courses.createRecord( res.record );
	if ( !result.record || result.hasOwnProperty('error') ) return h.response({
		stausCode: 400,   message: result.error
	});
	return h.response({
		stausCode: 200,   message: 'Record created.'
	});
}
/**
This API could be tested with browser extension like RESTclient for Firefox,
Postman for Chrome or command-line like this:

curl -X POST -H 'Content-Type: application/json' \
 -i 'http://localhost:8000/api/course/create' \
 --data '{
	"id": "whatever here will be overwritten",
	"title": "Linux",
	"slug": "linux",
	"description": "Linux Operating System",
	"time": 4444,
	"language": "en",
	"skill": "basic",
	"date_created": "2018-09-27 07:14:35",
	"last_update": "2018-09-27 07:14:57",
	"lessons_count": 22,
	"graphic": {
	"alt": "Linux",
	"src": "https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg"
	}
 }'

*/



/**
 * @summary Web UI call to be used to get the form for Course record creation
 * @description method: 'GET', path: '/course/create'
 */
var createActionGetForm = async function (request, h) {
	const id = uuidv1();
	// display empty record in course view
	const emptyRecord = {
		id:            id,
		title:         '',
		slug:          '',
		description:   '',
		time:          '',
		graphic:       { alt: '', src: '' },
		language:      '',
		skill:         '',
		date_created:  '',   // will be filled in the model method
		last_update:   '',   // will be filled in the model method
		lessons_count: '',
		formaction:    "/course/create",
	};
	//console.log( __file, __func, __line, ">>> emptyRecord:\n", emptyRecord, "\n" );
	return h.view('course', emptyRecord);
}



/**
 * @summary Web UI call to be use as form action to create new course record
 * @description route method: 'POST', path: '/course/create'
 */
var createActionPostForm = async function (request, h) {
	// Fields date_created and last_update will be overwritten
	const result = prepRecord( request );

	if ( !result.record ) throw Boom.badRequest(result.message);

	//const preppedRecord = result.record;
	const res = Courses.createRecord( result.record );

	if ( !res.record || res.hasOwnProperty('error') ) {
		//console.log( __file, __func, __line, ">>> Message: ", res.error, "\n" );
		throw Boom.badRequest( res.error );
	}

	res.record.formaction = "";   /* After record created and displayed back
	                        no formaction attribute is needed, but I can use
	                        empty one to control rendering of Save button. */

	// This property will help to redirect to course view
	res.record.edit_onclick = "location.href='/course'";
	res.record.view_onclick = "switch2view();";
	return h.view( 'course', res.record );
}



/**
 * @summary API call to update Course record.
 * @description route method: 'PUT', path: '/api/course'
 *              header: 'Content-Type': 'application/json'
 */
var updateAPI = async function (request, h) {
	//console.log( __file, __func, __line, ">>> request.payload:\n", request.payload, "\n" );
	const result = prepRecord( request );

	if ( !result.record ) return h.response({
		statusCode: 400,
		message: result.message
	});

	const res = Courses.updateRecord( result.record );

	if ( !res.record || res.hasOwnProperty('error') ) {
		//console.log( __file, __func, __line, ">>> Message: ", res.error, "\n" );
		return h.response({ statusCode: 400, message: res.error });
	}

	return h.response(res.record);
}
/**
This API could be tested with browser extension like RESTclient for Firefox,
Postman for Chrome or command-line like this:

curl -X PUT -H 'Content-Type: application/json' \
 -i 'http://localhost:8000/api/course' \
 --data '{
	"id": "6503f710-c224-11e8-ad5d-6b29deb8c778",
	"title": "Linux",
	"slug": "linux",
	"description": "Linux Operating System",
	"time": 4444,
	"language": "en",
	"skill": "basic",
	"date_created": "2018-09-27 07:14:35",
	"last_update": "2018-09-27 07:14:57",
	"lessons_count": 22,
	"graphic": {
		"alt": "Linux",
		"src": "https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg"
	}
}'

Or with browser extension like RESTclient for Firefox or Postman for Chrome.

Note: host and port number must reflect your configuration.
      Make sure do not include '\' symbol in the end of lines within JSON,
      like it's usually done for multi-line command.
*/



/**
 * @summary Web UI call to edit and update Course record
 * @description Web UI call to be used as form action
 *              to save Course record from the form.
 *              method: 'POST', path: '/course'
 */
var updateAction = async function(request, h) {
	const result = prepRecord( request );

	if ( !result.record ) throw Boom.badRequest(result.message);

	const res = Courses.updateRecord( result.record );

	if ( !res.record || res.hasOwnProperty('error') ) {
		//console.log( __file, __func, __line, ">>> Message: ", res.error, "\n" );
		throw Boom.badRequest( res.error );
	}

	res.record.formaction = "/course"; // /" + res.record.id;
	res.record.edit_onclick = "switch2edit();";
	res.record.view_onclick = "location.href='/course/" + res.record.id + "';";

	return h.view('course', res.record);
}



module.exports = {
	home,                   // method: 'GET',    path: '/' or '/course'
	createAPI,              // method: 'POST',   path: '/api/course/create'
	createActionGetForm,    // method: 'GET',    path: '/course/create'
	createActionPostForm,   // method: 'POST',   path: '/course/create'
	updateAPI,              // method: 'PUT',    path: '/api/course'
	updateAction,           // method: 'POST',   path: '/course'
	deleteAPI,              // method: 'DELETE', path: '/api/course'
	deleteAction,           // method: 'POST',   path: '/course/delete'
	getCoursesAPI,          // method: 'GET',    path: '/api/courses'
	getCourses,             // method: 'GET',    path: '/courses'
	getCourseByIdAPI,       // method: 'GET',    path: '/api/course/{id}'
	getCourseById           // method: 'GET',    path: '/course/{id}'
};
