var gulp = require('gulp');

var watch = require('gulp-watch');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var pug = require('gulp-pug');
var pugBEMify = require('./libs/bemify');

var postcss = require('gulp-postcss');
var stylus = require('gulp-stylus');
var autoprefixer = require('autoprefixer');
var rucksack = require('rucksack-css');
var poststylus = require('poststylus');
var bgSize = require('postcss-image-sizes');
var pxtorem = require('postcss-pxtorem');
var short = require('postcss-short');
var mqpacker = require('css-mqpacker');
var clean = require('postcss-clean');
var sprites = require('postcss-sprites');
var assets = require('postcss-assets');

var uglify = require('gulp-uglify');
var rigger = require('gulp-rigger');
var plumber = require('gulp-plumber');

var imagemin = require('gulp-imagemin');

var rename = require('gulp-rename');

var path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/',
        sprite: 'scr/css/sprites.css'
    },
    src: {
        html: 'src/**/*.pug',
        js: 'src/js/scripts.js',
        css: 'src/css/index.styl',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*',
        sprite: 'scr/css/sprites.postcss'
    },
    watch: {
        html: 'src/**/*.pug',
        js: 'src/js/*.*',
        css: 'src/css/**/*.*',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    }
};

var config = {
    server: {
        baseDir: './build'
    },
    tunnel: false,
    host: 'localhost',
    port: 9000,
    logPrefix: "WATCH_CAT"
};

gulp.task('css', function() {
    return gulp.src(path.src.css)
        .pipe(plumber())
        .pipe(stylus({
            'include css': true,
            use: [
                poststylus([
                    autoprefixer,
                    rucksack,
                    short({
                        "spacing": {
                            "skip": "a"
                        }
                    }),
                    mqpacker,
                    pxtorem
                ])
            ]
        }))
        .pipe(postcss([
            assets({
                loadPaths: [
                    "src/img/",
                    "src/icons/"
                ]
            }),
            bgSize(),
            sprites({
                filterBy: function(image) {
                    if (image.url.indexOf("icons") == -1) {
                        return Promise.reject();
                    }
                    return Promise.resolve();
                },
                spritePath: path.build.css,
                stylesheetPath: path.build.css
            }),
            clean()
        ]))
        .pipe(rename({
            extname: '.css'
        }))
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('pug', function() {
    gulp.src(path.src.html)
        .pipe(plumber())
        .pipe(pug({
            pretty: true,
            plugins : [pugBEMify()]
        }))
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('js', function() {
    gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('img', () =>
    gulp.src(path.src.img)
    .pipe(imagemin([
        imagemin.gifsicle({
            interlaced: true
        }),
        imagemin.jpegtran({
            progressive: true
        }),
        imagemin.optipng({
            optimizationLevel: 5
        }),
        imagemin.svgo({
            plugins: [{
                removeViewBox: true
            }]
        })
    ], {
        verbose: true
    }))
    .pipe(gulp.dest(path.build.img))
);

gulp.task('watch', function() {
    watch([path.watch.html], function(event, cb) {
        gulp.start('pug');
    });
    watch([path.watch.css], function(event, cb) {
        gulp.start('css');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js');
    });
});

gulp.task('webserver', function() {
    browserSync(config);
});

gulp.task('build', [
    'pug',
    'js',
    'css'
]);

gulp.task('default', ['build', 'webserver', 'watch']);
