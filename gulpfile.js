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
    publicDest = 'dist/public',
    pySrc = 'src/py-scripts/**.py',
    pyDest = 'dist/py-scripts';

var copyTasks = [
    {
        src: 'src/py-scripts/**.py',
        dist: 'dist/py-scripts',
    },
    {
        src: 'src/refactors/**',
        dist: 'dist/refactors',
    },
    {
        src: 'src/public/**',
        dist: 'dist/public',
    }
]

gulp.task('copy', () => {
    copyTasks.map(copyTask => {
        gulp.src(copyTask.src)
        .pipe(gulp.dest(copyTask.dist))
        .pipe(notify({
            message: `copy ${copyTask.src} file succeed!`,
            templateOptions: { date: new Date() }
        }));
    })
})

gulp.task('watch', () => {
    copyTasks.map(copyTask => {
        gulp.watch(copyTask.src, ['copy'])
            .on('change', (eventType, filename) => {
                console.log(`${filename} changed`);
            });
    })
})

gulp.task('default', () => {
    gulp.start('copy', 'watch')
})