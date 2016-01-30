var gulp = require('gulp');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var del = require('del');
var browserSync = require('browser-sync');
var reload =  browserSync.reload;

var DIST_DIR = './dist';

//sync
gulp.task('clean', function(cb)
{
    del([DIST_DIR], cb);
});

gulp.task('css', function ()
{
    return gulp.src
    ([
        './frontend/bower_components/bootstrap/dist/css/bootstrap.min.css',
        './frontend/assets/css/*.css'
    ])
    .pipe(concat("style.css"))
    .pipe(sourcemaps.init())
    .pipe(cssnano())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(DIST_DIR + '/css'));
});

gulp.task('js-libs', function ()
{
    return gulp.src
    ([
        "./frontend/bower_components/jquery/dist/jquery.min.js",

        //from framework
        "./frontend/bower_components/bootstrap/dist/js/bootstrap.min.js",
        "./frontend/bower_components/jquery-appear/build/jquery.appear.min.js",
        "./frontend/bower_components/jquery-countTo/jquery.countTo.js",
        "./frontend/bower_components/jquery-placeholder/jquery.placeholder.min.js",
        "./frontend/bower_components/jquery-scrollLock/jquery-scrollLock.min.js",
        "./frontend/bower_components/slimscroll/jquery.slimscroll.min.js",
        "./frontend/bower_components/js-cookie/src/js.cookie.js",

        //for app
        "./frontend/bower_components/socket.io-client/socket.io.js",
        "./frontend/bower_components/Chart.js/Chart.min.js",
        "./frontend/bower_components/moment/min/moment.min.js",
        "./frontend/bower_components/moment/locale/de.js",
        "./frontend/bower_components/angular/angular.min.js",
        "./frontend/bower_components/angular-route/angular-route.min.js"
    ])
    .pipe(concat("libs.js"))
    .pipe(gulp.dest(DIST_DIR + '/js'));
});

gulp.task('js-style', function()
{
    return gulp.src
    ([
        './frontend/assets/js/styling.js'
    ])
    .pipe(concat("style.js"))
    .pipe(sourcemaps.init())
    .pipe(uglify({mangle: false}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(DIST_DIR + '/js'));
});

gulp.task('js-app', function()
{
    return gulp.src
    ([
        "./frontend/app/modules/app.js",
        "./frontend/app/**/*.js"
    ])
    .pipe(concat("app.js"))
    .pipe(sourcemaps.init())
    .pipe(uglify({mangle: false}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(DIST_DIR + '/js'));
});

gulp.task('move', function()
{
    gulp.src
    ([
        './frontend/assets/fonts/*.*',
    ], { base: './frontend/assets' })
    .pipe(gulp.dest(DIST_DIR));

    gulp.src
    ([
        './frontend/index.html',
        './frontend/assets/img/**/*.*',
        './frontend/templates/**/*.*'
    ], { base: './frontend' })
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('browser-sync', function()
{
    browserSync.init(null,
    {
        port: 7777,
        proxy: "https://d1303.de:3000"
    });
});

gulp.task('watch', ['browser-sync'], function()
{
    /*
    gulp.watch("./frontend/app/*.js", ['js-app', reload]);
    gulp.watch("./frontend/assets/js/styling.js", ['js-style', reload]);
    //gulp.watch("./frontend/assets/*.js", ['js-style', reload]);
    */

    gulp.watch("./**/*.*", ['default', reload]);
});

gulp.task('default', ['clean', 'move', 'css', 'js-style', 'js-libs', 'js-app']);