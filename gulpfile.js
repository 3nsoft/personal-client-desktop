"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const concatCss = require('gulp-concat-css');
const sourcemaps = require("gulp-sourcemaps");
const delMod = require("del");
const ts = require("gulp-typescript");
const browserify = require("browserify");
const buffer = require("vinyl-buffer");
const source = require("vinyl-source-stream");
const path = require("path");
const fs = require("fs");
const rename = require("gulp-rename");
const shell = require("gulp-shell");
const gulpif = require("gulp-if");
const uglifyes = require("uglify-es");
const composer = require("gulp-uglify/composer");
const minify = composer(uglifyes, console);
const uglifycss = require("gulp-uglifycss");
const stripDebug = require("gulp-strip-debug");
const LIBS = require("./libs.json");
let env = 'dev';

function folderExists(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch (err) {
		return false;
	}
}

function fileExists(path) {
	try {
		return fs.statSync(path).isFile();
	} catch (err) {
		return false;
	}
}

function copy(src, dst, renameArg) {
	if (renameArg === undefined) {
		return () => gulp.src(src).pipe(gulp.dest(dst));
	} else {
		return () => gulp.src(src).pipe(rename(renameArg)).pipe(gulp.dest(dst));
	}
}

function del(paths) {
	return () => delMod(paths, { force: true });
}

// app manifest
const MANIFEST_FILE = 'manifest.json';
const manifest = require(`./${MANIFEST_FILE}`);

const APP_FOLDER_NAME = manifest.appDomain.split('.').reverse().join('.');
const MOCK_CONF_FILE = 'mock-conf.json';

const BUILD = "./public";
const ELECTRON = "../core-platform-electron";
const APP_FOLDER = `${ELECTRON}/build/all/apps/${APP_FOLDER_NAME}`;
const MOCK_CONFS = `${ELECTRON}/build/all/mock-confs`;
const JASMINE_FOR_APPS = 'build/all/tests/apps-jasmine.js';	// in ELECTRON dir
const THIS_FOLDER_NAME = path.basename(__dirname);
// const TESTS_RELATIVE_PATH = `../${THIS_FOLDER_NAME}/tests`;

gulp.task(
	"pre-prod",
	function (cb) {
		env = 'production';
		cb();
	}
);

gulp.task(
  "create-lib",
  gulp.series(
    copy("./src/libs/**/*.*", "./public/libs"),
    copy("./src/assets/**/*.*", "./public/assets"),
    (cb) => {
      for (let item of LIBS) {
        gulp.src(item.from).pipe(gulp.dest(item.to));
      }
      cb();
    }
  )
);

gulp.task(
  "create-html",
  copy("./src/**/*.html", "./public")
);

gulp.task("styles", function() {
	return gulp.src("./src/**/*.scss")
		.pipe(gulpif(env === 'dev', sourcemaps.init()))
		.pipe(sass())
		.pipe(gulpif(env === 'dev', sourcemaps.write()))
		.pipe(gulp.dest("./temp"));
});

gulp.task("concat-css", function () {
	return gulp.src('./temp/**/*.css')
		.pipe(concatCss("index.css"))
		.pipe(gulpif(env === 'production', uglifycss()))
		.pipe(gulp.dest('./public/'));
});


gulp.task(
	"del-html",
	del(
		[
			"./public/*",
			!"./public/index.js",
      !"./public/index.css",
      !"./public/libs",
      !"./public/assets"
		]
	)
);

gulp.task("del-css", del(["./public/index.css"]));
gulp.task("del-js", del(["./public/index.js"]));

gulp.task("del-temp", del(["./temp/"]));

gulp.task("del-public", del(["./public"]));


gulp.task("tsc", function() {
	var tsProject = ts.createProject("tsconfig.json");
	var tsResult = tsProject.src()
		.pipe(gulpif(env === 'dev', sourcemaps.init()))
		.pipe(tsProject());
	return tsResult.js
		.pipe(gulpif(env === 'dev', sourcemaps.write()))
		.pipe(gulp.dest("./temp"));
});

function browserifySubTask(browserifyEntry, destFolder) {
	const entryFileName = path.basename(browserifyEntry);
	return gulp.series(
		del([ path.join(destFolder, entryFileName) ]),
		() => browserify({
				entries: browserifyEntry,
				debug: true
			}).bundle()
			.pipe(source(entryFileName))
			.pipe(buffer())
			.pipe(gulpif(env === 'dev', sourcemaps.init({loadMaps: true})))
			.pipe(gulpif(env === 'dev', sourcemaps.write('')))
			.pipe(gulpif(env === 'production', stripDebug()))
			.pipe(gulpif(env === 'production', minify({}).on('error', function (err) {
				console.log(err);
			})))
			.pipe(gulp.dest(destFolder))
	);
}

gulp.task(
	"browserify",
	browserifySubTask(
		"./temp/index.js",
		"./public",
	),
);

gulp.task("create-css", gulp.series("styles", "concat-css"));
gulp.task("create-js", gulp.series("tsc", "browserify"));

function moveToElectronTasks() {
	if (!folderExists(ELECTRON)) {
		return done => {
			console.log(`
Can't move build into electron-based core build.
Need ${ELECTRON} setup side-by-side for an automated copying to take place.
Still, you may copy content of folder ${BUILD} manually.
`);
			done();
		}
	}
	let tasks = [];
	if (folderExists(APP_FOLDER)) {
		tasks.push(del(APP_FOLDER));
	}
	tasks.push(
		copy(`${BUILD}/**/*`, `${APP_FOLDER}/app`),
		copy(MANIFEST_FILE, APP_FOLDER));
	if (fileExists(MOCK_CONF_FILE)) {
		tasks.push(copy(MOCK_CONF_FILE, MOCK_CONFS,
			`${APP_FOLDER_NAME}.${MOCK_CONF_FILE}`));
	}
	return gulp.series(...tasks);
}
gulp.task("to-electron", moveToElectronTasks());

gulp.task("help", function(callback) {
	var h = '\nПомощь:\n'+
		'1) "build"  - компилирует необходимые файлы из папки SRC в папку PUBLIC и затем переносит все в папку BUILD/APPS/CLIENT в ELECTRON.\n'+
		'2) "build:prod" - компилирует необходимые файлы из папки SRC в папку PUBLIC, минимизирует код и затем переносит все в папку BUILD/APPS/CLIENT в ELECTRON.\n'+
		'3) "default" ("help") - выводит это сообщение\n';
	console.log(h);
	callback();
});

gulp.task("build", gulp.series("del-public", "create-lib", gulp.parallel("create-html", "create-css", "create-js"), "del-temp", "to-electron"));
gulp.task("build:prod", gulp.series("pre-prod", "build"));
gulp.task("default", gulp.series("help"));
