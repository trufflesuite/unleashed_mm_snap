const webpack = require("webpack");

exports.onCreateWebpackConfig = ({ actions }) => {
    actions.setWebpackConfig({
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: [require.resolve("buffer/"), "Buffer"],
            }),
        ],
        resolve: {
            fallback: {
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'), 
                assert: require.resolve('assert'), 
                http: require.resolve('stream-http'), 
                https: require.resolve('https-browserify'), 
                os: require.resolve('os-browserify'),
                url: require.resolve('url'), 
            },
        }
    })
};