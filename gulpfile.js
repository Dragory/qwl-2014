var gulp   = require('gulp'),
    coffee = require('gulp-coffee'),
    clean  = require('gulp-clean');

gulp.task('clear-compiled', function() {
	gulp.src('compiled/**/*', {read: false})
		.pipe(clean());
});

gulp.task('compile', function() {
	gulp.src('src/**/*.coffee', {base: 'src'})
		.pipe(coffee())
		.pipe(gulp.dest('compiled'));
});