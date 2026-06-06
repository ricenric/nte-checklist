import js from "@eslint/js";
import globals from "globals";
import vitest from "eslint-plugin-vitest";

export default [
  // 1. Base configuration for all JS files
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Added so it knows what 'module' or 'process' is
      },
    },
  },
  // 2. Specific configuration for test files
  {
    files: ["tests/**/*.js"],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
];