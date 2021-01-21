module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      openui5_preload: {
        component: {
          options: {
            resources: {
              cwd: '',
              prefix: '',
              src: [
                'webapp/**/*.js',
                'webapp/**/*.fragment.html',
                'webapp/**/*.fragment.json',
                'webapp/**/*.fragment.xml',
                'webapp/**/*.view.html',
                'webapp/**/*.view.json',
                'webapp/**/*.view.xml',
                'webapp/**/*.properties'
              ]
            },
            dest: '',
            compress: true
          },
          components: true
        }
      }
    });
  
    grunt.loadNpmTasks('grunt-openui5');
    grunt.registerTask( 'build', [ 'openui5_preload' ] );
  }