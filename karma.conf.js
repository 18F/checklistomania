module.exports = function configKarma(config) {
  config.set({

    basePath: './',

    files: [
      'public/bower_components/angular/angular.js',
      'public/bower_components/angular-mocks/angular-mocks.js',
      'public/bower_components/angular-material/angular-material.js',
      'public/bower_components/angular-animate/angular-animate.min.js',
      'public/bower_components/angular-aria/angular-aria.min.js',
      'public/bower_components/angular-messages/angular-messages.min.js',
      'private/js/app.js',
      'spec/frontend/frontEndSpec.js'
    ],

    autoWatch: true,

    frameworks: ['jasmine'],

    browsers: ['PhantomJS'],

    reporters: ['progress', 'coverage'],

    preprocessors: {
      'private/js/app.js': ['coverage']
    },

    coverageReporter: {
      type: 'lcov',
      dir: './coverage',
      subdir: 'phantomjs'
    },

    plugins: [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-junit-reporter',
      'karma-coverage'
    ],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
