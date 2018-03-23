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
const browser = require("browser-sync");
const path = require("path");
const fs = require("fs");
const rename = require("gulp-rename");

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

gulp.task("copy-lib", copy("./src/lib-ext/**/*.*", "./public/lib-ext"));

gulp.task("del-lib", del(["./public/lib-ext"]));

gulp.task("copy-html", gulp.parallel(
	copy([
		"./src/web/**/*.html", "!./src/web/index.html", "./src/web/**/*.png", "./src/web/**/*.jpg", "./src/web/**/*.gif", "./src/web/**/*.svg" ],
		"./public/templates"),
	copy("./src/web/index.html", "./public"),
	copy("./src/web/storage/saving-applet/index.html", "./public/saving-applet")
));

gulp.task("del-html", del([
	"./public/templates", "./public/index.html", "./public/saving-applet/index.html" ])
);

gulp.task("styles", function() {
	return gulp.src("./src/web/**/*.scss")
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("./temp"));
});

gulp.task("concat-css", function () {
	return gulp.src('./temp/**/*.css')
		.pipe(concatCss("index.css"))
		.pipe(gulp.dest('./public/'));
});

gulp.task("del-css", del(["./public/index.css"]));

gulp.task("del-temp", del(["./temp/"]));

gulp.task("del-all", del(["./public"]));


gulp.task("tsc", function() {
	var tsProject = ts.createProject("tsconfig.json");
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject());
	return tsResult.js
		.pipe(sourcemaps.write())
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
			.pipe(sourcemaps.init({loadMaps: true}))
			.pipe(sourcemaps.write(''))
			.pipe(gulp.dest(destFolder))
	);
}

gulp.task("browserify-app", browserifySubTask("./temp/index.js", "./public"));
gulp.task("browserify-storage-applet", browserifySubTask(
	"./temp/storage/saving-applet/index.js", "./public/saving-applet"));

gulp.task("browserify", gulp.parallel(
	"browserify-app", "browserify-storage-applet"));

gulp.task("browser", function() {
 browser({
	 server: {
		 baseDir: "./public"
	 },
	 port: 9000,
	 open: true,
	 notify: false
 });
});


gulp.task("create-lib", gulp.series("del-lib", "copy-lib"));
gulp.task("create-html", gulp.series("del-html", "copy-html"));
gulp.task("create-css", gulp.series("del-css", "styles", "concat-css"));
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

gulp.task("watcher", function() {
	gulp.watch("./src/web/**/*.scss", gulp.series("create-css"));
	gulp.watch(["./src/**/*.ts", "!./src/typings/*.ts"], gulp.series("create-js"));
	gulp.watch(["./src/web/**/*.html", "./src/web/**/*.png", "./src/web/**/*.jpg", "./src/web/**/*.gif", "./src/web/**/*.svg"], gulp.series("create-html"));
});

gulp.task("watcher-electron", function() {
	gulp.watch("./src/web/**/*.scss", gulp.series("create-css", "to-electron"));
	gulp.watch(["./src/**/*.ts", "!./src/typings/*.ts"], gulp.series("create-js", "to-electron"));
	gulp.watch(["./src/web/**/*.html", "./src/web/**/*.png", "./src/web/**/*.jpg", "./src/web/**/*.gif", "./src/web/**/*.svg"], gulp.series("create-html", "to-electron"));
});

gulp.task("help", function(callback) {
	var h = '\nПомощь:\n'+
		'1) "build"  - компилирует необходимые файлы из папки SRC в папку PUBLIC и затем переносит все в папку BUILD/APPS/CLIENT в ELECTRON.\n'+
		'2) "browser" - "поднимает" локальный сервер (LOCALHOST:9000)) и открывает web-страницу приложения в браузере.\n'+
		'3) "run-app" - компилирует необходимые файлы из папки SRC, переносит все в папку PUBLIC, "поднимает" локальный сервер (LOCALHOST:9000) и открывает web-страницу приложения в браузере.\n'+
		'4) "run-dev" - запускает задачу RUN-APP и затем отслеживает изменения, вносимые в рабочие файлы.\n'+
		'5) "build-watch" - BUILD + WATCHER.\n'+
		'6) "default" ("help") - выводит это сообщение\n';
	console.log(h);
	callback();
});

gulp.task("build", gulp.series("del-all", gulp.parallel("create-lib", "create-html", "create-css", "create-js"), "del-temp", "to-electron"));
gulp.task("run-app", gulp.series("build", "browser"));
gulp.task("run-dev", gulp.series("build", gulp.parallel("browser", "watcher")));
gulp.task("build-watch", gulp.series("build", "watcher-electron"));
gulp.task("default", gulp.series("help"));

