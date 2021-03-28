const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, "./dist/app.js"),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ["ts-loader"],
      },
    ],
  },
  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "bundle.js",
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],

  devServer: {
    contentBase: path.resolve(__dirname, "./build"),
    hot: true,
  },
  mode: "development",
};
