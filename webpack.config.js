require('shelljs/make');
var path = require('path');
var ExtractTextPlugin = require('sgmf-scripts')['extract-text-webpack-plugin'];
var jsFiles = require('sgmf-scripts').createJsPath();
var scssFiles = require('sgmf-scripts').createScssPath();

console.log('js', jsFiles);

module.exports = [
    {
        devtool: 'eval-source-map',
        mode: 'production',
        name: 'js',
        entry: {
          ...jsFiles,
          'default/js/custom_entry': './cartridges/int_bolt_embedded_sfra_custom/cartridge/client/default/js/eventListenerRegistration.js'
        },
        output: {
            path: path.resolve('./cartridges/int_bolt_embedded_sfra/cartridge/static'),
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
        }
    },
    {
        mode: 'none',
        name: 'scss',
        entry: scssFiles,
        output: {
            path: path.resolve('./cartridges/int_bolt_embedded_sfra/cartridge/static'),
            filename: '[name].css'
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                url: false
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: [require('autoprefixer')]
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    includePaths: [path.resolve('node_modules')]
                                }
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new ExtractTextPlugin({
                filename: '[name].css'
            })
        ]
    }
  
];
