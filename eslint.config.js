export default [
  {
    files: ['src/**/*.ts', 'src/**/*.vue'],
    parserOptions: {
      parser: '@typescript-eslint/parser',
    },
    rules: {
      semi: 'error',
      'no-console': 'warn',
    }
  }
];
