import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/artifacts/**",
      "**/cache/**",
      "**/typechain-types/**",
      "**/deployments/**",
      "**/src/generated/**",
    ],
  },
];
