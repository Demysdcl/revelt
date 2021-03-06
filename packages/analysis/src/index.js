"use strict";

const getSize = require("get-folder-size");
const { exec } = require("child_process");
const rimraf = require("rimraf");
const fs = require("fs");
const handler = require("serve-handler");
const http = require("http");

const object = { svelte: {}, react: {}, vue: {} };

const createBuildFolder = () => {
  if (fs.existsSync("build")) {
    rimraf.sync("build");
  }
  fs.mkdirSync("build");
};

const copyPublic = () => {
  if (fs.existsSync("build/assets")) {
    rimraf.sync("build/assets");
  }
  fs.mkdirSync("build/assets");

  fs.copyFileSync("public/assets/react.svg", "build/assets/react.svg");
  fs.copyFileSync("public/assets/svelte.svg", "build/assets/svelte.svg");
  fs.copyFileSync("public/assets/vue.svg", "build/assets/vue.svg");
  fs.copyFileSync("public/global.css", "build/global.css");
  fs.copyFileSync("public/script.js", "build/script.js");
  fs.copyFileSync("public/favicon.ico", "build/favicon.ico");
  fs.copyFileSync("public/_redirects", "build/_redirects");
  fs.copyFileSync("public/index.html", "build/index.html");
};

const getAvailable = () => {
  const serverSvelte = http.createServer((request, response) => {
    return handler(request, response, {
      public: "../../build/svelte",
      rewrites: [{ source: "/svelte/**", destination: "index.html" }]
    });
  });

  serverSvelte.listen(3000, () => {
    exec(
      'lighthouse http://localhost:3000/svelte --output=json --output-path=build/perfSvelte.json --chrome-flags="--headless"',
      () => {
        const file = fs.readFileSync("./build/perfSvelte.json");
        object.svelte.time = JSON.parse(file.toString()).audits.metrics;
        serverSvelte.close();
      }
    );
  });

  const serverReact = http.createServer((request, response) => {
    return handler(request, response, {
      public: "../../build/react",
      rewrites: [{ source: "/react/**", destination: "index.html" }]
    });
  });

  serverReact.listen(3001, () => {
    exec(
      'lighthouse http://localhost:3001/react --output=json --output-path=build/perfReact.json --chrome-flags="--headless"',
      () => {
        const file = fs.readFileSync("./build/perfReact.json");
        object.react.time = JSON.parse(file.toString()).audits.metrics;
        serverReact.close();
      }
    );
  });

  const serverVue = http.createServer((request, response) => {
    return handler(request, response, {
      public: "../../build/vue",
      rewrites: [{ source: "/vue/**", destination: "index.html" }]
    });
  });

  serverVue.listen(3002, () => {
    exec(
      'lighthouse http://localhost:3002/vue --output=json --output-path=build/perfVue.json --chrome-flags="--headless"',
      () => {
        const file = fs.readFileSync("./build/perfVue.json");
        object.vue.time = JSON.parse(file.toString()).audits.metrics;
        serverVue.close();
      }
    );
  });
};

const getSizes = () => {
  getSize("../../build/svelte/build", (err, size) => {
    if (err) {
      throw err;
    }
    object.svelte.size = {
      format: (size / 1024 / 1024).toFixed(2) + " MB",
      bytes: size
    };
  });

  getSize("../../build/react/static", (err, size) => {
    if (err) {
      throw err;
    }
    object.react.size = {
      format: (size / 1024 / 1024).toFixed(2) + " MB",
      bytes: size
    };
  });

  getSize("../../build/vue/js", (err, sizeJs) => {
    if (err) {
      throw err;
    }
    getSize("../../build/vue/css", (err, sizeCss) => {
      if (err) {
        throw err;
      }
      object.vue.size = {
        format: ((sizeJs + sizeCss) / 1024 / 1024).toFixed(2) + " MB",
        bytes: sizeJs + sizeCss
      };
    });
  });
};

const getCountLines = () => {
  exec(
    "cloc ../svelte-app/src --json --force-lang-def=cloc_definitions.txt",
    (error, stdout) => {
      let data = JSON.parse(stdout);
      delete data.header;

      object.svelte.countLine = data;
    }
  );

  exec(
    "cloc ../react-app/src --json --force-lang-def=cloc_definitions.txt",
    (error, stdout) => {
      let data = JSON.parse(stdout);
      delete data.header;

      object.react.countLine = data;
    }
  );

  exec(
    "cloc ../vue-app/src --json --force-lang-def=cloc_definitions.txt",
    (error, stdout) => {
      let data = JSON.parse(stdout);
      delete data.header;

      object.vue.countLine = data;
    }
  );
};

const getTimeBundle = () => {
  const startDateReact = new Date();
  exec("cd ../react-app && yarn build", () => {
    const time = new Date().getTime() - startDateReact.getTime();

    object.react.buildTime = {
      miliseconds: time,
      format: `${(time / 1000).toFixed(2)}s`
    };
  });

  const startDateSvelte = new Date();
  exec("cd ../svelte-app && yarn build", () => {
    const time = new Date().getTime() - startDateSvelte.getTime();

    object.svelte.buildTime = {
      miliseconds: time,
      format: `${(time / 1000).toFixed(2)}s`
    };
  });

  const startDateVue = new Date();
  exec("cd ../vue-app && yarn build", () => {
    const time = new Date().getTime() - startDateVue.getTime();

    object.vue.buildTime = {
      miliseconds: time,
      format: `${(time / 1000).toFixed(2)}s`
    };
  });
};

createBuildFolder();
copyPublic();
getSizes();
getCountLines();
getAvailable();
getTimeBundle();

process.on("exit", () => {
  fs.unlinkSync("build/perfReact.json");
  fs.unlinkSync("build/perfSvelte.json");
  fs.unlinkSync("build/perfVue.json");
  fs.appendFileSync("build/data.json", JSON.stringify(object));
});
