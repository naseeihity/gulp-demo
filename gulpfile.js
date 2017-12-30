var gulp = require('gulp');
var minimist = require('minimist');

// //文件合并
// var concat = require('gulp-concat');
// //文件重命名
// var rename = require('gulp-rename');
// //代码混淆
// var uglify = require('gulp-uglify');
// //代码映射
// var source_map = require('gulp-sourcemaps');
// //css压缩
// var minify_css = require('gulp-clean-css');
// //静态文件MD5后缀
// var rev = require('gulp-rev');
// //文件替换
// var rev_collector = require('gulp-rev-collector');
//本地开发环境
// var connect = require('gulp-connect');
// var watch = require('gulp-watch');

//使用gulp-load-plugins自动命名gulp的相关包，通过package.json映射，驼峰命名
var $ = require('gulp-load-plugins')();

// 代理到远程服务器
var proxy = require('http-proxy-middleware');
// 文件操作
var fs = require('fs');
// 自动打开浏览器
var open = require('open');
//删除文件
var del = require('del');



// 导入配置文件
var cfg = require('./build/gulp_config.json');
var JS = cfg.js;
var CSS = cfg.css;
var HTML = cfg.html;
var REV = cfg.rev;
var js_css_src = [].concat(JS.src, CSS.src);

//默认任务开始入口
gulp.task('default', ['clean'], function() {
    //首先清空dist文件夹，再依次执行任务
    gulp.start('pack-js','pack-css');
});

//清空已有输出
gulp.task('clean', function() {
    return del(['dist/']);
});

//js文件合并压缩
gulp.task('pack-js', function() {
    return gulp.src(JS.src)               //需要合并的js文件
    .pipe($.sourcemaps.init())                //初始化sourcemap
    .pipe($.concat(JS.concat.main))               //合并js文件并命名
    .pipe(gulp.dest(JS.dest))          //将文件写入文件夹
    .pipe($.rename(JS.concat_min.main))           //设置混淆后的文件名
    .pipe($.uglify())                         //代码混淆
    .pipe($.sourcemaps.write('./maps/'))           //输出sourcemap
    .pipe(gulp.dest(JS.dest));         //输出最终的结果
});

//css文件合并压缩并增加md5后缀
gulp.task('pack-css', function() {
    return gulp.src(CSS.src)
        .pipe($.sourcemaps.init())
        .pipe($.concat(CSS.concat.main))
        .pipe($.cleanCss())                 //css代码压缩
        .pipe($.sourcemaps.write('./maps/')) 
        .pipe(gulp.dest(CSS.dest))
        .pipe($.rename(CSS.concat_min.main))
        .pipe($.rev())                        //增加md5后缀
        .pipe(gulp.dest(CSS.dest))
        .pipe($.rev.manifest())               //输出映射表用户替换增加md5后缀文件的引用
        .pipe(gulp.dest(REV.dest));
});

//md5后缀替换
gulp.task('rev', function() {
    return gulp.src([REV.src, HTML.index])    //设置映射表位置，以及需要进行路径名替换的文件
    .pipe(rev_collector())                  //替换
    .pipe(gulp.dest(REV.destH));        //输出
});

var devCfg = require('./build/dev_config.json');
var devLocal = devCfg.local;
var devProxy = devCfg.proxy;
var knownOptions = {
    string: 'host',
    default: { host: ''}//不设置时host默认指为true
};
var optionCL = minimist(process.argv.slice(2), knownOptions);

var proxyHost = optionCL.host || devProxy.host;
var PROXY_TARGET = (devCfg.https ? "https://" : "http://") 
                        + proxyHost + ":" + devProxy.port + devProxy.uri;

//本地服务
gulp.task('webserver', function() {
    $.connect.server({
        port: devLocal.port,
        root: devLocal.root,
        livereload: true,
        // nodev8.8以上版本无法自动开启https[https://github.com/AveVlad/gulp-connect/issues/236]
        https: false,
        // 为true时将采用默认配置
        // https:{
        //     key: fs.readFileSync(devLocal.key),
        //     cert: fs.readFileSync(devLocal.cert)
        // },
        fallback: devLocal.index,   //index重定向
        middleware: function(connect, opt) {
            return [
                proxy(devProxy.uri,  {
                    target: PROXY_TARGET,
                    changeOrigin:true
                }),
                // 可以代理到多个远程服务器
                proxy('/otherServer', {
                    target: 'https://IP:Port',
                    changeOrigin:true
                })
            ]
        }
    });
    // open('http' + devLocal.host + devLocal.port);
});

//将对处理后的文件的watch提出，使得各个任务更加纯粹
gulp.task('livereload', function() {
    gulp.src(js_css_src)
      .pipe($.watch(js_css_src))
      .pipe($.connect.reload());
});

//使用gulp-watch实现只重新编译被更改过的文件
gulp.task('watch', ['webserver', 'livereload'], function() {
    $.watch(JS.src, function() {
        gulp.start('pack-js');
    });
    $.watch(CSS.src, function() {
        gulp.start('pack-css');
    });
    //html文件不做任何处理直接重载
    $.watch(HTML.src).pipe($.connect.reload());
});

//雪碧图生成
gulp.task('sprite', function () {
    var spriteData = gulp.src('./src/imgs/*').pipe($.spritesmith({
      imgName: 'sprite.png',
      cssName: 'sprite.css'
    }));
    return spriteData.pipe(gulp.dest('./dist/sprite/'));
});

//gulp-imagemin未能成功启用
//gulp-imagemin: Couldn't load default plugin "optipng"
// gulp.task('pack-img', function() {
//     return gulp.src('./src/imgs/*')
//         .pipe(imagemin())
//         .pipe(gulp.dest('./dist/images/'));
// });

// Others
//gulp-autoprefixe   css自动加浏览器前缀
//gulp-base64 将图片转为base64，无请求，但会增大css文件大小
//postcss  引入css处理的各种工具
//lazypipe 创建流的工程方法，便于重用