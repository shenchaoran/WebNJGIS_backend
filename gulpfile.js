var gulp = require('gulp'),
    // gutil = require('gulp-util'),
    // jshint = require('gulp-jshint'),
    // uglify = require('gulp-uglifyes'),
    // rename = require('gulp-rename'),
    // concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    // cache = require('gulp-cache'),
    // stylish = require('jshint-stylish'),
    del = require('del');

var jsSrc = 'src/child-process/**',
    jsDest = 'dist/child-process'
    publicSrc = 'src/public/**',
    publicDest = 'dist/public';

gulp.task('child-process', () => {
    gulp.src(jsSrc)
        .pipe(gulp.dest(jsDest))
        .pipe(notify({
            message: 'copy child-process file succeed!',
            templateOptions: {
                date: new Date()
            }
        }));
});

gulp.task('public', () => {
    gulp.src(publicSrc)
        .pipe(gulp.dest(publicDest))
        .pipe(notify({
            message: 'copy public file succeed!',
            templateOptions: {
                date: new Date()
            }
        }));
})

gulp.task('watch', () => {
    gulp.watch(jsSrc, ['child-process'])
        .on('change', (eventType, filename) => {
            console.log(`${filename} changed`);
        });
    gulp.watch(publicSrc, ['public'])
        .on('change', (eventType, filename) => {
            console.log(`${filename} changed`);
        });
})

// gulp.task('default', () => {
//     // gulp.start('public', 'child-process', 'watch')
    
// })

gulp.series(
    gulp.parallel(
        gulp.task('public'), 
        gulp.task('child-process'),
    ),
    gulp.task('watch'),
)