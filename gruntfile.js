module.exports = function(grunt) {
  grunt.initConfig({
    jade: {
      compile: {
        options: {
          pretty: true
        },
        files: [{
          expand: true,
          cwd: 'views/',
          src: ['*.jade'],
          dest: 'build/',
          ext: '.html'
        }]
      }
    },

    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: 'styles/',
          src: ['*.sass'],
          dest: 'build/',
          ext: '.css'
        }]
      }
    },

    jshint: {
      src: ['*.js', 'js/*.js']
    },

    watch: {
      grunt: { files: ['gruntfile.js'] },
      jade: {
        files: 'views/*.jade',
        tasks: ['jade']
      },

      sass: {
        files: 'styles/*.sass',
        tasks: ['sass']
      },

      jshint: {
        files: ['*.js', 'js/*.js'],
        tasks: ['jshint']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('build', 'jade->html, sass->css', ['jade', 'sass', 'jshint']);

  grunt.registerTask('default', 'jade->html, sass->css', ['jade', 'sass', 'jshint', 'watch']);
  grunt.loadNpmTasks('grunt-contrib-watch');
};

