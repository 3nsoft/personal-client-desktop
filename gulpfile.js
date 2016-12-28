"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const concatCss = require('gulp-concat-css');
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const ts = require("gulp-typescript");
const shell = require("gulp-shell");
const browserify = require("browserify");
const buffer = require("vinyl-buffer");
const source = require("vinyl-source-stream");
const browser = require("browser-sync");

const BUILD = "./public";
const ELECTRON = "core-platform-electron/build";
const APP_FOLDER_NAME = "client";

gulp.task("copy-json", function() {
	return gulp.src("./src/mock-conf.json")
		.pipe(gulp.dest("./public"));
});

gulp.task("copy-lib", function() {
	return gulp.src("./src/lib-ext/**/*.*")
		.pipe(gulp.dest("./public/lib-ext"));
});

gulp.task("del-lib", function() {
	return del(["./public/lib-ext"]);
});

gulp.task("copy-html", gulp.series(
	function() {
		return gulp.src(["./src/web/**/*.html", "!./src/web/index.html", "./src/web/**/*.png", "./src/web/**/*.jpg", "./src/web/**/*.gif", "./src/web/**/*.svg"])
			.pipe(gulp.dest("./public/templates"));
	},
	function() {
		return gulp.src("./src/web/index.html")
			.pipe(gulp.dest("./public"))
	}
));

gulp.task("del-html", function() {
	return del(["./public/templates", "./public/index.html"]);
});

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

gulp.task("del-css", function() {
	return del(["./public/index.css"]);
});

gulp.task("del-temp", function() {
	return del(["./temp/"]);
});

gulp.task("del-all", function() {
	return del(["./public"]);
});


gulp.task("tsc", function() {
	var tsProject = ts.createProject("tsconfig.json");
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject());
	return tsResult.js
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("./temp"));
});

gulp.task("browserify", gulp.series(
	function() {
		return del(["./public/index.js"]);
	},
	function() {
		let b = browserify({
			entries: "./temp/index.js",
			debug: true
		});

		return b.bundle()
			.pipe(source("index.js"))
			.pipe(buffer())
			.pipe(sourcemaps.init({loadMaps: true}))
			.pipe(sourcemaps.write(''))
			.pipe(gulp.dest("./public/"));
	}
));

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

gulp.task("to-electron", gulp.series(
	"copy-json",
	shell.task(
	`if [ -d ../${ELECTRON} ]; then
		if [ ! -d ../${ELECTRON}/apps ]; then
			mkdir ../${ELECTRON}/apps;
		fi
		if [ -d ../${ELECTRON}/apps/${APP_FOLDER_NAME} ]; then
			rm -rf ../${ELECTRON}/apps/${APP_FOLDER_NAME};
		fi
		cp -r ${BUILD} ../${ELECTRON}/apps/${APP_FOLDER_NAME};
	else
		echo "Need ${ELECTRON} setup side-by-side for an automated copying to take place.";
		echo "Still, you may copy content of folder ${BUILD} manually.";
	fi;`)
));

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

