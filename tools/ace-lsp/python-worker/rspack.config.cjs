const path = require('path');
const { createRequire } = require('module');
const { tsconfigResolveAliases } = require('../../build/lib/webpack');

const rspack = createRequire(__filename)('@rspack/core');

module.exports = {
    context: __dirname,
    mode: 'production',
    entry: './src/autojs6-python-worker.ts',
    target: 'webworker',
    output: {
        filename: 'autojs6-python-worker.js',
        path: path.resolve(__dirname, 'dist-autojs6-python'),
        clean: true,
    },
    devtool: false,
    stats: { all: false, errors: true, warnings: true, timings: true },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            ...tsconfigResolveAliases('tsconfig.json'),
            worker_threads: path.resolve(__dirname, 'src/autojs6-worker-threads-shim.ts'),
            'vscode-languageserver$': path.resolve(
                __dirname,
                '../pyright-internal/node_modules/vscode-languageserver/lib/browser/main.js'
            ),
        },
        fallback: {
            buffer: require.resolve('buffer/'),
            child_process: false,
            crypto: false,
            fs: false,
            module: false,
            os: false,
            path: require.resolve('path-browserify'),
            stream: false,
            url: false,
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: { configFile: path.resolve(__dirname, 'tsconfig.json') },
            },
        ],
    },
    plugins: [
        new rspack.DefinePlugin({
            process: "{ env: {}, execArgv: [], cwd: () => '/', memoryUsage: () => ({ heapUsed: 0, rss: 1 }) }",
        }),
        new rspack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    ],
    optimization: {
        minimize: true,
        splitChunks: false,
    },
};
