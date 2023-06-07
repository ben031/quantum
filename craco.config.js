// eslint-disable-next-line import/no-extraneous-dependencies
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          webpackConfig.resolve.plugins.push(new TsconfigPathsPlugin({}));
          return webpackConfig;
        },
      },
    },
  ],
};
