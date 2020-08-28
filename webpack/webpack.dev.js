const { merge } = require('webpack-merge');
const webpack = require('webpack');
const path = require('path');

const rootDir = path.join(__dirname, '../');

const commonCfg = require('./webpack.common');

module.exports = merge(commonCfg, {
  mode: 'development',
  entry: {
    test: path.resolve(rootDir, 'test/test.js'),
  },
  output: {
    filename: '[name].js',
    path: path.join(rootDir, 'dist'),
  },
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      DEBUG: false,
    }),
  ],
});
