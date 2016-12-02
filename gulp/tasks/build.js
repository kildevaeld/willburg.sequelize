'use strict';

const gulp = require('gulp'),
    tsc = require('gulp-typescript'),
    merge = require('merge2'),
    bump = require('gulp-bump');
    
const project = tsc.createProject(process.cwd() + '/tsconfig.json', {
  typescript: require('typescript')
});

gulp.task('bump', () => {
  return gulp.src('./package.json')
  .pipe(bump())
  .pipe(gulp.dest('./'));
})

gulp.task('typescript', () => {
    let result = project.src()
    .pipe(tsc(project));
    
    let js = result.js.pipe(gulp.dest('./lib'))
       
    return merge([
        js, result.dts.pipe(gulp.dest('lib'))
    ]);
    
});

gulp.task('watch', () => {
    gulp.watch('src/**/*.ts', ['typescript']);
});



var fs = require('fs');
var readdir = require('recursive-readdir');


gulp.task('addfiles', (done) => {
  var tsconfigDir = process.cwd() + '/tsconfig.json';
  
  var tsconfig = require(tsconfigDir);
  
  readdir(process.cwd() + '/src', function (e, files) {
    tsconfig.files = files.filter(function (file) {
      var len = file.length;
      //if (file.indexOf('tools') > -1) return false;
      return (file.substr(len - 3) === '.ts' ||  file.substr(len - 3) === '.js') 
        && file.substr(len - 5) !== ".d.ts";
    }).map(function (file) {
      return file.replace(process.cwd() +'/', '');
    });

    //tsconfig.files.unshift('typings/index.d.ts')

    fs.writeFile(tsconfigDir, JSON.stringify(tsconfig,null,2), function () {
      console.log('%s files added',tsconfig.files.length);
      done();
    });
  });
});



