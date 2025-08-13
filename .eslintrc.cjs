/* eslint-env node */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  extends: ["eslint:recommended", "prettier"],
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  rules: {
    "no-console": "error",
    "dot-notation": "error",
  },
};
