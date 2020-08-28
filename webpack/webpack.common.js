const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rootDir = path.join(__dirname, '../');

module.exports = {
  entry: {
    index: path.resolve(rootDir, 'src/index.js'),
    test: path.resolve(rootDir, 'test/test.js'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(rootDir, './dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx', 'json'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          'babel-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 3,
              sourceMap: false,
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader',
        ],
      },
    ],
  },
  devtool: 'none',
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'test.html',
      title: 'Test',
      template: path.resolve(rootDir, 'test/test.html'),
      chunks: ['test'],
    }),
  ],
};
