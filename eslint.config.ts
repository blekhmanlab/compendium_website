import js from "@eslint/js";
import tailwind from "eslint-plugin-better-tailwindcss";
import a11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "public"]),
  {
    name: "TypeScript",
    extends: tslint.configs.recommended,
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
    ...js.configs.recommended,
    rules: {
      "prefer-const": ["error", { destructuring: "all" }],
    },
  },
  {
    name: "React Hooks",
    ...reactHooks.configs.flat.recommended,
  },
  {
    name: "JSX Accessibility",
    ...a11y.flatConfigs.recommended,
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
    ...prettier,
    rules: {
      "prettier/prettier": "warn",
    },
  },
  {
    name: "Tailwind",
    extends: [tailwind.configs.recommended],
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
