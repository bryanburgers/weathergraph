"use strict";

module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-jshint');

	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: ['index.js', 'forecast-fetch.js', 'forecast-parse.js'],
			options: {
				node: true,
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				onecase: true
			}
		}
	});

	// Default task.
	grunt.registerTask('default', 'jshint');
};
