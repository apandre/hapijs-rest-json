/**
 *
 */

const ctrlCourses = require('../controllers/controllers.courses');



module.exports = [

	/**
	 * @summary This route could be used for nice first page
	 */
	{
		method: 'GET',
		path: '/',
		//options: {
		//	auth: 'simple'
		//},
		handler: ctrlCourses.home
	},
	{
		method: 'GET',
		path: '/course',
		handler: ctrlCourses.home
	},


	/**
	 * @summary Web UI call to get Courses paginated list
	 * @returns HTML Handlebars view
	 */
	{
		method: 'GET',
		path: '/courses',
		//options: {
		//	auth: 'simple'
		//},
		handler: ctrlCourses.getCourses
	},


	/**
	 * @summary API call to get courses list (paginated)
	 * @returns JSON
	 * For explanation why two different APIs,
	 * look into comments in controllers.courses.js
	 */
	{
		method: 'GET',
		path: '/api/courses',
		//options: {
		//	auth: 'simple'
		//},
		handler: ctrlCourses.getCoursesAPI
	},


	/**
	 * @summary API call to get one course by id
	 * @returns JSON
	 */
	{
		method: 'GET',
		path: '/api/course/{id}',
		//options: {
		//	auth: 'simple'
		//},
		handler: ctrlCourses.getCourseByIdAPI
	},


	/**
	 * @summary Web UI call to get one course by id
	 * @returns HTML Handlebars view
	 */
	{
		method: 'GET',
		path: '/course/{id}',
		//options: {
		//	auth: 'simple',
		//},
		handler: ctrlCourses.getCourseById
	},


	/**
	 * @summary Web UI call to be used for course record update.
	 * @description Web API for form action to accept edited course data
	 *              for Update API. Just because web form only can accept
	 *              only GET or POST methods for action.
	 *              Also, because I need response after form submission.
	 * @returns HTML Handlebars view
	 */
	{
		method: 'POST',
		path: '/course', // /{id}',
		handler: ctrlCourses.updateAction
	},


	/**
	 * @summary API call to UPDATE Course with given id
	 */
	{
		method: 'PUT',
		path: '/api/course',   // TODO remove /{id}
		//options: {
		//	auth: 'simple',
		//},
		handler: ctrlCourses.updateAPI
	},


	/**
	 * @summary API call to create new course record
	 * @description header: 'Content-Type': 'application/json'
	 *              data must be posted in form of JSON representation of record
	 * @returns JSON
	 */
	{
		method:  'POST',
		path:    '/api/course/create',
		//options: {
		//	auth: 'simple',
		//},
		handler: ctrlCourses.createAPI
	},


	/**
	 * @summary Web UI call to get form for creation of new course record
	 * @description To be used as form action for this task
	 * @returns HTML Handlebars view
	 */
	{
		method:  'GET',
		path:    '/course/create',
		handler: ctrlCourses.createActionGetForm
	},


	/**
	 * @summary Web UI call to be use as form action to create new course record
	 * @returns HTML Handlebars view
	 */
	{
		method:  'POST',
		path:    '/course/create',
		handler: ctrlCourses.createActionPostForm
	},


	/**
	 * @summary API call to delete course record with given id
	 */
	{
		method: 'DELETE',
		path: '/api/course',   //  /{id}
		//options: {
		//	auth: 'simple',
		//},
		handler: ctrlCourses.deleteAPI
	},


	/**
	 * @summary Web UI call to be used as form action to delete Course record
	 * @returns HTML Handlebars view
	 */
	{
		method: 'POST',
		path: '/course/delete',
		handler: ctrlCourses.deleteAction
	},




];
