const { merge } = require('webpack-merge');
const webpack = require('webpack');

const commonCfg = require('./webpack.common');

module.exports = merge(commonCfg, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      DEBUG: false,
    }),
  ],
});
