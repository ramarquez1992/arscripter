module.exports = function(grunt) {
  grunt.initConfig({
    jade: {
      compile: {
        options: {
          pretty: true,
        },
        files: {
          'build/index.html': 'views/index.jade'
        }
      }
    },

    watch: {
      grunt: { files: ['gruntfile.js'] },
      jade: {
        files: 'views/*.jade',
        tasks: ['jade']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.registerTask('build', 'html -> jade', ['jade']);

  grunt.registerTask('default', 'html -> jade', ['jade', 'watch']);
  grunt.loadNpmTasks('grunt-contrib-watch');
};

