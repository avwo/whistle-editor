const { merge } = require('webpack-merge');
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
    new HtmlWebpackPlugin({
      filename: 'test.html',
      title: 'Test',
      template: path.resolve(rootDir, 'test/test.html'),
      chunks: ['test'],
    }),
    new webpack.DefinePlugin({
      DEBUG: false,
    }),
  ],
});
