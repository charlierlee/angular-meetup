"use strict";
/// <binding ProjectOpened='test' />
// gulpfile.js


var gulp = require("gulp"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    mainNPMFiles = require('npmfiles'),
    babel = require('gulp-babel'),
    pump = require('pump'),
    gutil = require('gulp-util'),
    flatten = require('gulp-flatten'),
    gulpFilter = require('gulp-filter'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    debug = require('gulp-debug'),
    staticHash = require('gulp-static-hash');


// Define paths variables
var legacy_dest_path = 'dist'
// grab libraries files from bower_components, minify and push in /public

gulp.task('publish-npm-components', gulp.series(function(done) {
    var jsFilter = gulpFilter('**/*.js', { restore: true }),
        cssFilter = gulpFilter('**/*.css', { restore: true }),
        fontFilter = gulpFilter(['**/*.eot', '**/*.woff', '**/*.woff2', '**/*.svg', '**/*.ttf'], { restore: true });
    gutil.log(mainNPMFiles());
    gulp.src(mainNPMFiles())
        // grab vendor js files from bower_components, minify and push in /public
        .pipe(jsFilter)
        .pipe(gulp.dest(legacy_dest_path + '/js/'))
        /*.pipe(babel({
            presets: ['es2015']
        }))*/
        //.pipe(uglify())
        .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(legacy_dest_path + '/js/'))
        .pipe(jsFilter.restore)

        // grab vendor css files from bower_components, minify and push in /public
        .pipe(cssFilter)
        .pipe(gulp.dest(legacy_dest_path + '/css'))
        .pipe(minifycss())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(legacy_dest_path + '/css'))
        .pipe(cssFilter.restore)

        // grab vendor font files from bower_components and push in /public
        .pipe(fontFilter)
        .pipe(flatten())
        .pipe(gulp.dest(legacy_dest_path + '/fonts'));
    gutil.log('publish components complete');
    done();
}));
var templateCache = require('gulp-angular-templatecache');
 
gulp.task('template-cache', function () {
  return gulp.src('./component/app/templates/*.html')
    .pipe(templateCache({root:'component/templates', module:'rmMeetup'}))
    .pipe(gulp.dest('./component/app/templates/'));
});
gulp.task('js', gulp.series(function(done) {
    pump([
        gulp.src([
            './component/app/app/app.js',
            './component/app/**/*.js',
            '!./component/app/**/*_test*.js',
            './component/app/**/**/*.js',
            '!./component/app/**/**/*_test*.js',
            '!./component/app/bower_components/**/*',
            '!./component/app/css/*',
            '!./component/app/js/*',
            '!./component/app/fonts/*',
            '!./component/app/app.js',
            '!./component/app/app.min.js'
            // '/src/**/!(foobar)*.js', // all files that end in .js EXCEPT foobar*.js
            // '/src/js/foobar.js'
        ]),
        concat('angular-meetup.js'),
        flatten(),
        gulp.dest('./dist/'),
        uglify(),
        rename({
            suffix: ".min"
        }),
        gulp.dest('./dist/')
    ], function(err){
        console.log(err + 'js done');
        done();
    });
    // run deploy afterwards
}));
gulp.task('deploy',
  gulp.series(function(done) {
    gulp.src(['./dist/angular-meetup.js'])
    .pipe(debug())
    .pipe(staticHash({ asset: 'dist/', exts: ['html'] }))
    .pipe(gulp.dest('./dist'))
    .on('end', function(){ console.log('step 1 complete');
      gulp.src(['./dist/angular-meetup.min.js'])
      .pipe(debug())
      .pipe(staticHash({ asset: 'dist/', exts: ['html'] }))
      .pipe(gulp.dest('.'))
      .on('end', function(){ console.log('step 2 complete');
        gulp.src(['./dist/index.html'])
        .pipe(debug())
        .pipe(staticHash({ asset: 'dist/', exts: ['js','html','png'] }))
        .pipe(gulp.dest('.'))
        .on('end', function(){
            console.log('deploy complete');
            done()
        });
      });
    });
  })
);
