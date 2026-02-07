module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
