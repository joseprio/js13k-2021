import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import html2 from "rollup-plugin-html2";
import serve from "rollup-plugin-serve";
import compiler from "@ampproject/rollup-plugin-closure-compiler";
import replace from "@rollup/plugin-replace";
import { Packer } from "roadroller";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;
const useClosureCompiler = process.env.CLOSURE_COMPILER;

// Should be safe enough; saves ~60 bytes
const transformConstToLet = {
  renderChunk(chunk) {
    return chunk.replace(/\bconst\b/g, "let");
  },
};

/*
const patchMinified = {
  renderChunk(chunk) {
    let processedChunk = chunk.trim();
    if (processedChunk.endsWith(";")) {
      processedChunk = processedChunk.slice(0, -1);
    }
    return processedChunk;
  },
};
*/

const roadroller = {
  renderChunk(data) {
    const inputs = [
      {
        data,
        type: "js",
        action: "eval",
      },
    ];

    const options = {
      maxMemoryMB: 150,
    };

    const packer = new Packer(inputs, options);

    // packer.optimize(2) for extra compression
    packer.optimize();

    const { firstLine, secondLine } = packer.makeDecoder();
    return firstLine + secondLine;
  },
};

export default {
  input: "src/index.js",
  output: {
    file: "dist/bundle.js",
    format: "cjs",
    preferConst: true,
    sourcemap: false,
  },
  plugins: [
    html2({
      template: "src/index.html",
    }),
    resolve(),
    transformConstToLet,
    replace({
      preventAssignment: true,
      values: {
        "process.env.DEBUG": JSON.stringify(!production),
      },
    }),
    production &&
      !useClosureCompiler &&
      terser({
        ecma: 2019,
        module: true,
        toplevel: true,
        compress: {
          passes: 5,
          keep_fargs: false,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_methods: true,
          unsafe_symbols: true,
          toplevel: true,
          booleans_as_integers: true,
        },
        format: {
          wrap_func_args: false,
          semicolons: true,
          ecma: 2019,
          ascii_only: true,
        },
      }),
    production &&
      useClosureCompiler &&
      compiler({
        compilation_level: "ADVANCED",
      }),
    //patchMinified,
    process.env.ROADROLLER && roadroller,
    !production &&
      serve({
        open: true,
        contentBase: "dist",
        host: "localhost",
        port: 8080,
      }),
  ],
};
