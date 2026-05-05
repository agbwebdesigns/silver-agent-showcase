import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";
import url from "@rollup/plugin-url";

export default {
  input: "src/index.jsx", // your widget entry
  output: {
    file: "dist-widget/widget.js",
    format: "iife",
    name: "MyWidget", // global variable
    sourcemap: true,
    inlineDynamicImports: true,
  },
  treeshake: { moduleSideEffects: false },
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ["react", "react-dom", "react-dom/client"],
      extensions: [".mjs", ".js", ".jsx", ".ts", ".tsx", ".json"],
    }),
    commonjs(),
    postcss({
      extract: false, // no <head> injection
      inject: false, // return CSS string for manual injection
      modules: false,
      minimize: true,
    }),
    babel({
      babelrc: false,
      configFile: false,
      babelHelpers: "bundled",
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      presets: [
        ["@babel/preset-react", { runtime: "automatic" }],
        ["@babel/preset-env", { targets: ">0.25%, not dead" }],
      ],
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    terser({
      mangle: false, // 👈 prevents Terser from renaming internal React symbols
    }),
    url({
      include: [
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.gif",
        "**/*.svg",
        "**/*.webp",
      ],
      limit: 0,
      fileName: "assets/[name][extname]",
      publicPath: "https://apublicpath.net/",
    }),
  ],
};
