'use strict';

var shell = require('shelljs');
var path = require('path');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var cwd = process.cwd();
var { CleanWebpackPlugin } = require('clean-webpack-plugin');

var packageName = '';
var jsFiles = {};
var scssFiles = {};
process.argv.forEach((val, index) => {
    if (val === 'entryPackageName') {
        packageName = process.argv[index + 1];
        var cssFilesTmp = shell.ls(path.join(cwd, `./cartridges/${packageName}/cartridge/client/**/scss/**/*.scss`));
        cssFilesTmp.forEach(filePath => {
            var name = path.basename(filePath, '.scss');
            if (name.indexOf('_') !== 0) {
                let location = path.relative(path.join(cwd, `./cartridges/${packageName}/cartridge/client`), filePath);
                location = location.substr(0, location.length - 5).replace('scss', 'css');
                scssFiles[location] = filePath;
            }
        });

        var jsFilesTmp = shell.ls(path.join(cwd, `./cartridges/${packageName}/cartridge/client/**/js/*.js`));
        jsFilesTmp.forEach(filePath => {
            let location = path.relative(path.join(cwd, `./cartridges/${packageName}/cartridge/client`), filePath);
            location = location.substr(0, location.length - 3);
            jsFiles[location] = filePath;
        });
    }
});

var outputPath = './cartridges/' + packageName + '/cartridge/static';
console.log("scssFiles: ", scssFiles);
console.log("jsFiles: ", jsFiles);

module.exports = [{
    mode: 'production',
    name: 'js',
    entry: jsFiles,
    output: {
        path: path.resolve(outputPath),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /bootstrap(.)*\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env'],
                        plugins: ['@babel/plugin-proposal-object-rest-spread'],
                        cacheDirectory: true
                    }
                }
            }
        ]
    },
    resolve: {
        alias: {
            jquery: path.resolve(__dirname, '../storefront-reference-architecture/node_modules/jquery')
        }
    }
},
{
    mode: 'production',
    name: 'scss',
    entry: scssFiles,
    output: {
        path: path.resolve(outputPath),
        filename: '[name].tmp'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        url: false
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: [
                                ['autoprefixer', {}]
                            ]
                        }
                    }
                },
                {
                    loader: 'sass-loader',
                    options: {
                        includePaths: [
                            path.resolve(
                                process.cwd(),
                                '../storefront-reference-architecture/node_modules/'
                            ),
                            path.resolve('node_modules')
                        ]
                    }
                }
            ]
        }]
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: '[name].css' }),
        new CleanWebpackPlugin(
            {
                cleanOnceBeforeBuildPatterns: ['js/*.js', 'css/*.css'],
                cleanAfterEveryBuildPatterns: ['**/*.tmp'],
                protectWebpackAssets: false,
                verbose: true,
                dry: false
            },
        )
    ]
}];
