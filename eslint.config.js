import eslintJs from "@eslint/js";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["build", "public", "playwright-report", "test-results"]),
  {
    name: "TypeScript",
    extends: typescriptEslint.configs.recommended,
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { caughtErrors: "none" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: false,
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
    },
  },
  {
    name: "JavaScript",
    ...eslintJs.configs.recommended,
    rules: {
      "prefer-const": ["error", { destructuring: "all" }],
    },
  },
  {
    name: "React Hooks",
    ...eslintPluginReactHooks.configs.flat.recommended,
  },
  {
    name: "JSX Accessibility",
    ...eslintPluginJsxA11y.flatConfigs.recommended,
    rules: {
      /** https://github.com/dequelabs/axe-core/issues/4566 */
      "jsx-a11y/no-noninteractive-tabindex": ["off"],
      /**
       * allow <label>some text<AnyComponent/></label> but still catch
       * <label>just text</label>
       */
      "jsx-a11y/label-has-associated-control": [
        "error",
        { controlComponents: ["*"] },
      ],
    },
  },
  {
    name: "Prettier",
    ...eslintPluginPrettierRecommended,
    rules: {
      "prettier/prettier": "warn",
    },
  },
  {
    name: "Tailwind",
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    rules: {
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { strictness: "loose" },
      ],
      "better-tailwindcss/no-unknown-classes": ["warn"],
    },
    settings: {
      "better-tailwindcss": { entryPoint: "src/styles.css" },
    },
  },
  {
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2020,
    },
  },
]);
