const path = require("path");
const gulp = require("gulp");
const clear = require("gulp-clean");
const changed = require("gulp-changed");
const less = require("gulp-less");
const cssClean = require("gulp-clean-css");
const rename = require("gulp-rename");
const jsonTransform = require("gulp-json-transform");
const del = require("del");
const mustache = require("gulp-mustache");
const projectConfig = require("./package.json");
const yargs = require("yargs");

//项目路径
const option = {
  base: "src",
  allowEmpty: true,
};

const dist = __dirname + "/dist";

const copyPath = ["src/**/!(_)*.*", "!src/**/*.less"];

const lessPath = ["src/**/*.less", "src/app.less"];

const watchLessPath = ["src/**/*.less", "src/css/**/*.less", "src/app.less"];

//清空目录
gulp.task("clear", () => {
  return gulp.src(dist, { allowEmpty: true }).pipe(clear());
});

//复制不包含less和图片的文件
gulp.task("copy", () => {
  return gulp.src(copyPath, option).pipe(gulp.dest(dist));
});

//复制不包含less和图片的文件(只改动有变动的文件）
gulp.task("copyChange", () => {
  return gulp.src(copyPath, option).pipe(changed(dist)).pipe(gulp.dest(dist));
});

// 增加dependencies
const dependencies = projectConfig && projectConfig.dependencies; // dependencies配置
let nodeModulesCopyPath = [];
for (let d in dependencies) {
  nodeModulesCopyPath.push("node_modules/" + d + "/**/*");
}

//项目路径
const copyNodeModuleOption = {
  base: ".",
  allowEmpty: true,
};

//复制依赖的node_modules文件
gulp.task("copyNodeModules", () => {
  return gulp
    .src(nodeModulesCopyPath, copyNodeModuleOption)
    .pipe(gulp.dest(dist));
});

//复制依赖的node_modules文件(只改动有变动的文件）
gulp.task("copyNodeModulesChange", () => {
  return gulp
    .src(nodeModulesCopyPath, copyNodeModuleOption)
    .pipe(changed(dist))
    .pipe(gulp.dest(dist));
});

// 根据denpende生成package.json
gulp.task("generatePackageJson", () => {
  return gulp
    .src("./package.json")
    .pipe(
      jsonTransform(function (data, file) {
        return {
          dependencies: dependencies,
        };
      })
    )
    .pipe(gulp.dest(dist));
});

//编译less
gulp.task("less", () => {
  return gulp
    .src(lessPath, option)
    .pipe(
      less().on("error", function (e) {
        console.error(e.message);
        this.emit("end");
      })
    )
    .pipe(cssClean())
    .pipe(
      rename(function (path) {
        path.extname = ".acss";
      })
    )
    .pipe(gulp.dest(dist));
});

//编译less(只改动有变动的文件）
gulp.task("lessChange", () => {
  return gulp
    .src(lessPath, option)
    .pipe(changed(dist))
    .pipe(
      less().on("error", function (e) {
        console.error(e.message);
        this.emit("end");
      })
    )
    .pipe(cssClean())
    .pipe(
      rename(function (path) {
        path.extname = ".acss";
      })
    )
    .pipe(gulp.dest(dist));
});

//监听
gulp.task("watch", () => {
  const watcher = gulp.watch(copyPath, gulp.series("copyChange"));
  gulp.watch(nodeModulesCopyPath, gulp.series("copyNodeModulesChange"));
  gulp.watch(watchLessPath, gulp.series("lessChange")); //Change
  watcher.on("change", function (event) {
    if (event.type === "deleted") {
      const filepath = event.path;
      const filePathFromSrc = path.relative(path.resolve("src"), filepath);
      // Concatenating the 'build' absolute path used by gulp.dest in the scripts task
      const destFilePath = path.resolve("dist", filePathFromSrc);
      // console.log({filepath, filePathFromSrc, destFilePath})
      del.sync(destFilePath);
    }
  });
});

gulp.task("autoRouter", () => {
  return gulp
    .src("src/pages/**", { read: false })
    .pipe((res) => {
      console.log(res);
    })
    .pipe(gulp.dest(dist));
});

//开发并监听
gulp.task(
  "default",
  gulp.series(
    // sync
    gulp.parallel("copy", "copyNodeModules", "generatePackageJson", "less"),
    "watch"
  )
);

//上线
gulp.task(
  "build",
  gulp.series(
    // sync
    "clear",
    gulp.parallel(
      // async
      "copy",
      "copyNodeModules",
      "generatePackageJson",
      "less"
    )
  )
);

/**
 * auto 自动创建page or template or component
 *  -s 源目录（默认为_template)
 * @example
 *   gulp auto -p mypage           创建名称为mypage的page文件
 *   gulp auto -t mytpl            创建名称为mytpl的template文件
 *   gulp auto -c mycomponent      创建名称为mycomponent的component文件
 *   gulp auto -s index -p mypage  创建名称为mypage的page文件
 */

const auto = async (done) => {
  yargs
    .example("gulp auto -p mypage", "创建名为mypage的page文件")
    .example("gulp auto -t mytpl", "创建名为mytpl的template文件")
    .example("gulp auto -c mycomponent", "创建名为mycomponent的component文件")
    .example(
      "gulp auto -s index -p mypage",
      "复制pages/index中的文件创建名称为mypage的页面"
    )
    .option({
      s: {
        alias: "src",
        default: "_template",
        describe: "copy的模板",
        type: "string",
      },
      p: {
        alias: "page",
        describe: "生成的page名称",
        conflicts: ["t", "c"],
        type: "string",
      },
      t: {
        alias: "template",
        describe: "生成的template名称",
        type: "string",
        conflicts: ["c"],
      },
      c: {
        alias: "component",
        describe: "生成的component名称",
        type: "string",
      },
      version: { hidden: true },
      help: { hidden: true },
    })
    .fail((msg) => {
      done();
      console.error("创建失败!!!");
      console.error(msg);
      console.error("请按照如下命令执行...");
      yargs.parse(["--msg"]);
      return;
    })
    .help("msg");

  const argv = yargs.argv;
  const source = argv.s;
  const typeEnum = {
    p: "pages",
    t: "templates",
    c: "components",
  };
  let hasParams = false;
  let name, type;
  for (let key in typeEnum) {
    hasParams = hasParams || !!argv[key];
    if (argv[key]) {
      name = argv[key];
      type = typeEnum[key];
    }
  }

  if (!hasParams) {
    done();
    yargs.parse(["--msg"]);
  }

  const root = path.join(__dirname, "src", type);

  //判断文件是否存在
  const fs = require("fs");
  const inquirer = require("inquirer");

  if (fs.existsSync(`${root}/${name}`)) {
    console.log("FILE EXIST");
    await inquirer
      .prompt([
        {
          type: "confirm",
          name: "fileExist",
          message: "发现相同文件名，是否覆盖文件?",
          default: false,
        },
      ])
      .then((answers) => {
        console.log("结果为:");
        console.log(answers);
        if (answers.fileExist) {
          return gulp
            .src(path.join(root, source, "*.*"))
            .pipe(
              mustache({
                name: name,
              })
            )
            .pipe(
              rename({
                dirname: name,
                basename: name,
              })
            )
            .pipe(gulp.dest(path.join(root)));
        }
        return;
      });
  } else {
    console.log("FILE DOES NOT EXIST");
    return gulp
      .src(path.join(root, source, "*.*"))
      .pipe(
        mustache({
          name: name,
        })
      )
      .pipe(
        rename({
          dirname: name,
          basename: name,
        })
      )
      .pipe(gulp.dest(path.join(root)));
  }
};
gulp.task(auto);
