var gulp = require('gulp');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var browserSync = require('browser-sync');
var reload =  browserSync.reload;
var config = require('./config');
var gutil = require('gulp-util');
var runSequence = require('gulp-run-sequence');

var DIST_DIR = './dist';

//sync
gulp.task('clean', function(cb)
{
    gutil.log("started clean procedure for " + DIST_DIR);
    return gulp.src(DIST_DIR).pipe(clean());
});

gulp.task('css', function ()
{
    return gulp.src
    ([
        './frontend/bower_components/bootstrap/dist/css/bootstrap.min.css',
        './frontend/css/*.css'
    ])
    .pipe(concat("style.css"))
    /*
    .pipe(sourcemaps.init())
    .pipe(cssnano())
    .pipe(sourcemaps.write('.'))
    */
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

gulp.task('js-app', function()
{
    return gulp.src
    ([
        './frontend/js/frontend/frontend.js',
        "./frontend/js/modules/app.js",
        "./frontend/js/**/*.js"
    ])
    .pipe(concat("app.js"))
    .pipe(sourcemaps.init())
    .pipe(uglify({mangle: false}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(DIST_DIR + '/js'));
});

gulp.task('move', function()
{
    gutil.log("started moving");

    return gulp.src
    ([
        './frontend/assets/**/*.*',
        './frontend/templates/**/*.*',
    ], { base: './frontend' })
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('browser-sync', function()
{
    gutil.log("Starting browser sync in SSL mode");

    var privateKey = config.sslPrivateKeyPath;
    var certificate = config.sslCertificate;
    var ca = config.sslCa;
    var ssl_object = {
        key: privateKey,
        cert: certificate,
        ca: [ ca ]
    };

    browserSync.init(null,
    {
        port: 7777,
        proxy: {
            target: "https://d1303.de:3000",
            ws: true
        },
        https: ssl_object
    });
});

gulp.task('watch', ['browser-sync'], function()
{
    //watch static assets
    gulp.watch([
        "./frontend/assets/**/*.*",
        "./frontend/templates/**/*.*"
    ], ['default', reload]);

    //watch css
    gulp.watch([
        './frontend/css/*.css'
    ], ['default', reload]);

    //watch js
    gulp.watch([
        "./frontend/js/**/*.js"
    ], ['default', reload]);
});

gulp.task('default', function(cb)
{
    //let clean and move run in sequence. The others run in parallel
    runSequence('clean', 'move', ['css', 'js-libs', 'js-app'], cb);
});

