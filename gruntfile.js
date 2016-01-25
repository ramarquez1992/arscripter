module.exports = function(grunt) {
  grunt.initConfig({
    jade: {
      compile: {
        options: {
          pretty: true,
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


    watch: {
      grunt: { files: ['gruntfile.js'] },
      jade: {
        files: 'views/*.jade',
        tasks: ['jade']
      },
      sass: {
        files: 'styles/*.sass',
        tasks: ['sass']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.registerTask('build', 'jade->html, sass->css', ['jade', 'sass']);

  grunt.registerTask('default', 'jade->html, sass->css', ['jade', 'sass', 'watch']);
  grunt.loadNpmTasks('grunt-contrib-watch');
};

