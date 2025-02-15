export default [
  {
    files: ['src/**/*.ts', 'src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      }
    },
    rules: {
      semi: 'error',
      'no-console': 'warn',
    }
  }
];
