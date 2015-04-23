// INCLUDES
var gulp        =   require('gulp');
var async       =   require('async');
var plugin      =   require('gulp-load-plugins')();

var jpegoptim           =   require('imagemin-jpegoptim');
var pngquant            =   require('imagemin-pngquant');
var optipng             =   require('imagemin-optipng');
var imageminGifsicle    =   require('imagemin-gifsicle');

// BASE PATHS
var basePaths = {
    src: './assets/',
    dest: './public/assets/',
    vendor: './assets/vendor/'
};

// PATHS
var paths = {
    images: {
        src: basePaths.src + 'images/',
        dest: basePaths.dest + 'images/'
    },
    js: {
        src: basePaths.src + 'js/',
        dest: basePaths.dest + 'js/'
    },
    css: {
        src: basePaths.src + 'sass/',
        dest: basePaths.dest + 'css/'
    }
};

// FILES
var files = {
    js: {
        footer: [
            paths.js.src + 'combined/**/*.js'
        ],
        header: [
            basePaths.vendor + 'sprint/sprint.min.js'
        ],
        uncombined: [
            paths.js.src + 'uncombined/**/*.js'
        ]
    }
};

// SET ENVIRONMENT VARIABLES
var env = {
    sassStyle : 'compressed',
    sourceMap : false,
    isProduction : true
};

if(plugin.util.env.dev === true) {
    env.sassStyle = 'expanded';
    env.sourceMap = true;
    env.isProduction = false;
}

// ERROR HANDLER
var errorHandler = function (error) {
    console.log(error);
};

// TASKS

// CLEAN ASSETS DIRECTORY
gulp.task('clean', function () {
    return gulp.src([paths.js.dest, paths.css.dest], {read: false})
        .pipe(plugin.clean());
});

/// OPTIMIZE IMAGES
gulp.task('images', function () {
    return gulp.src( paths.images.src + '**/*.*' )
        .pipe(plugin.newer( paths.images.dest ))
        .pipe(plugin.imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [
                pngquant({ quality: '65-80', speed: 4 }),
                optipng({optimizationLevel: 3}),
                jpegoptim({max: 70}),
                imageminGifsicle({interlaced: true})
            ]
        }))
        .pipe(gulp.dest( paths.images.dest ));
});

/// COMPILE SCSS
gulp.task('mainCSS', function () {

    gulp.src( paths.css.src + 'main.scss' )
        .pipe(plugin.plumber({
            errorHandler: errorHandler
        }))
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.init() )
        .pipe( plugin.sass({ style: env.sassStyle }) )
        .pipe( env.isProduction ? plugin.minifyCss() : plugin.util.noop() )
        .pipe( env.isProduction ? plugin.csso() : plugin.util.noop() )
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.write() )
        .pipe(gulp.dest( paths.css.dest ));

});

/// COMPILE HEADER JS
gulp.task('headerJS', function () {
    gulp.src( files.js.header )
        .pipe(plugin.plumber({
            errorHandler: errorHandler
        }))
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.init() )
        .pipe(env.isProduction ? plugin.uglify() : plugin.util.noop())
        .pipe( plugin.concat( 'header.js' ) )
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.write() )
        .pipe( gulp.dest( paths.js.dest ) );
});

/// COMPILE HEADER JS
gulp.task('footerJS', function () {
    gulp.src( files.js.footer )
        .pipe(plugin.plumber({
            errorHandler: errorHandler
        }))
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.init() )
        .pipe(env.isProduction ? plugin.uglify() : plugin.util.noop())
        .pipe( plugin.concat( 'footer.js' ) )
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.write() )
        .pipe( gulp.dest( paths.js.dest ) );
});

/// COMPILE UNCOMBINED JS
gulp.task('uncombinedJS', function() {
    gulp.src( files.js.uncombined )
        .pipe(plugin.plumber({
            errorHandler: errorHandler
        }))
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.init() )
        .pipe(env.isProduction ? plugin.uglify() : plugin.util.noop())
        .pipe( env.isProduction ? plugin.util.noop() : plugin.sourcemaps.write() )
        .pipe( gulp.dest( paths.js.dest ) );
});

// WATCH FILES FOR CHANGES
gulp.task('watch', function () {

    gulp.watch( paths.css.src + '/**/*.scss', ['mainCSS']);
    gulp.watch( paths.images.src + '**/*.*' , ['images']);
    gulp.watch( files.js.footer, ['footerJS']);
    gulp.watch( files.js.uncombined, ['uncombinedJS']);

});

// SYNCHRONOUSLY RUN TASKS
gulp.task('default', function () {

    var tasks = ['clean', 'mainCSS', 'headerJS', 'footerJS', 'uncombinedJS', 'images', 'watch'];

    var sync = tasks.map(function (task) {
        return function (callback) {
            gulp.start(task, function (err) {
                callback(err);
            });
        };
    });

    async.series(sync);
});