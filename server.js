/**
 * @author Alex Pandre
 * @copyright 2018-Present, Alex Pandre
 */


'use strict';

//const Bcrypt = require('bcrypt');
const Hapi = require('hapi');
const Vision = require('vision');
const Handlebars = require('handlebars');

// I like to use variables __file, __func, __line in my debugging logs
require('magic-globals');

const CoursesRoutes = require('./routes/routes.courses');

// I'll come back for AAA implementation'
/*
const users = {
	john: {
		username: 'john',
		password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
		name: 'John Doe',
		id: '2133d32a'
	}
};*/


/*
const validate = async (request, username, password, h) => {

	if (username === 'help') {
		return { response: h.redirect('https://hapijs.com/help') };     // custom response
	}

	const user = users[username];
	if (!user) {
		return { credentials: null, isValid: false };
	}

	const isValid = await Bcrypt.compare(password, user.password);
	const credentials = { id: user.id, name: user.name };

	return { isValid, credentials };
};*/



const start = async function () {

	const server = Hapi.server({ host: 'localhost', port: 8000 });

	const pgntnOptions = {
		query: {
			page: {
				name: 'page',
				default: 1
			},
			limit: {
				name: 'limit',
				default: 3
			},
			pagination: {
				name: 'pagination',
				default: true,
				active: true
			},
			invalid: 'defaults'
		},

		meta: {
			location: 'body',
			successStatusCode: undefined,
			name: 'meta',
			count: {
				active: true,
				name: 'count'
			},
			totalCount: {
				active: true,
				name: 'totalCount'
			},
			pageCount: {
				active: true,
				name: 'pageCount'
			},
			self: {
				active: true,
				name: 'self'
			},
			previous: {
				active: true,
				name: 'previous'
			},
			next: {
				active: true,
				name: 'next'
			},
			hasNext: {
				active: true,
				name: 'hasNext'
			},
			hasPrevious: {
				active: true,
				name: 'hasPrevious'
			},
			first: {
				active: true,
				name: 'first'
			},
			last: {
				active: true,
				name: 'last'
			},
			page: {
				active: true,
				// name == default.query.page.name
			},
			limit: {
				active: true
				// name == default.query.limit.name
			}
		},

		results: {
			name: 'results'
		},

		// reply: {
		// 	paginate: 'paginate',
		// 	results: {
		// 		name: 'results'
		// 	},
		// 	totalCount:{
		// 		name: 'totalCount'
		// 	}
		// },

		routes: {
			include: ['/api/courses'],
			exclude: ['*']
		}
	};



	/**
	 * @summary Plugins registration
	 */
	await server.register([
		/*
		{
			plugin: require('hapi-auth-basic')
		},
		*/
		{
			plugin: require('hapi-pagination'),
			options: pgntnOptions
		},
		{
			plugin: Vision
		}
	]);



	server.views({
		engines: {
			html: Handlebars
		},
		isCached: false,
		relativeTo: __dirname,
		path: 'views',
		//helpersPath: 'helpers'
	});



	/*
	server.auth.strategy('simple', 'basic', { validate });
	server.auth.default('simple');*/


	server.route(CoursesRoutes);


	await server.start();

	console.log('Server running at: ', server.info.uri);

	server.events.on('response', function (request) {
		//console.log(__file, __func, __line, ">>> request.path: ", request.path, "\n");
		//console.log(__file, __func, __line, ">>> request.route.method: ", request.route.method, "\n");
		//console.log(__file, __func, __line, ">>> request.route.path: ", request.route.path, "\n");
		console.log(
			request.info.remoteAddress + ': ' + request.method.toUpperCase()
			+ ' ' + request.url.path + ' --> ' + request.response.statusCode, "\n"
		);
	});
};



process.on('unhandledRejection', (err) => {
	console.log(err);
	process.exit(1);
});

start();
