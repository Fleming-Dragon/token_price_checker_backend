module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
    mongo: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "single"],
    semi: ["error", "always"],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-console": "off",
    "no-debugger": "error",
    "no-duplicate-imports": "error",
    "no-unreachable": "error",
    "consistent-return": "off",
    "default-case": "error",
    eqeqeq: ["error", "always"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-magic-numbers": "off",
    "no-multi-spaces": "error",
    "no-redeclare": "error",
    "no-return-assign": "error",
    "no-return-await": "error",
    "no-self-compare": "error",
    "no-throw-literal": "error",
    "no-unmodified-loop-condition": "error",
    "no-unused-expressions": "error",
    "no-useless-call": "error",
    "no-useless-return": "error",
    "prefer-promise-reject-errors": "error",
    "require-await": "off",
    "array-bracket-spacing": ["error", "never"],
    "block-spacing": ["error", "always"],
    "brace-style": ["error", "1tbs"],
    camelcase: "off",
    "comma-dangle": ["error", "never"],
    "comma-spacing": ["error", { before: false, after: true }],
    "comma-style": ["error", "last"],
    "computed-property-spacing": ["error", "never"],
    "func-call-spacing": ["error", "never"],
    "key-spacing": ["error", { beforeColon: false, afterColon: true }],
    "keyword-spacing": ["error", { before: true, after: true }],
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
    "no-trailing-spaces": "error",
    "object-curly-spacing": ["error", "always"],
    "padded-blocks": ["error", "never"],
    "space-before-blocks": ["error", "always"],
    "space-before-function-paren": ["error", "never"],
    "space-in-parens": ["error", "never"],
    "space-infix-ops": "error",
  },
};
