'use strict';
let path = require('path');

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        config: {
            script: 'src/child-process',
            dist: 'dist/child-process'
        },
        copy: {
            script: {
                files: [{
                    expand: true,
                    cwd: '<%= config.script %>',
                    src: ['**/*.py'],
                    dest: '<%= config.dist %>'
                }]
            }
        },
        watch: {
            options: {
                livereload: 2345
            },
            python: {
                files: ['<%= config.script %>/*.py'],
                tasks: ['copy']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', [
        'watch'
    ]);
};