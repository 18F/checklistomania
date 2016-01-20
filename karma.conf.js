module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'public/bower_components/angular/angular.js',
      'public/bower_components/angular-mocks/angular-mocks.js',
      'public/bower_components/angular-material/angular-material.js',
      "public/bower_components/angular-animate/angular-animate.min.js",
      "public/bower_components/angular-aria/angular-aria.min.js",
      "public/bower_components/angular-messages/angular-messages.min.js",
      'public/components/**/*.js',
      'private/js/app.js',
      'spec/frontEndSpec.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};