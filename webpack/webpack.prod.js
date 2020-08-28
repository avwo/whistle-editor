const { merge } = require('webpack-merge');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.DefinePlugin({
      DEBUG: false,
    }),
  ],
  stats: {
    warnings: false,
    timings: true,
    performance: true,
    reasons: true,
  },
});
