'use strict';

var gulp = require('gulp');
var jasmine = require('gulp-jasmine');

gulp.task('default', function () {
	return gulp.src('src/*Tests.js')
		.pipe(jasmine());
});