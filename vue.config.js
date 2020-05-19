module.exports = {
  configureWebpack: {
    devServer: {
      port: 8080,
      open: true,
      proxy: {
        "/api": {
          target: "http://localhost:8081",
        },
      },
    },
    devtool: "inline-source-map"
  },
};
