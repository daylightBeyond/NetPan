const path = require('path');
const os = require('os');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

const threads = os.cpus().length;

module.exports = {
  // 入口文件
  entry: './src/index.js',
  mode: 'production',
  // 输出文件
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'js/[name].[contenthash:10].js',
    chunkFilename: "js/[name].[contenthash:10].chunk.js",
    assetModuleFilename: "js/[hash:10][ext][query]",
    clean: true, // 自动清空上次的打包资源
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, 'src'),
    }
  },
  devtool: "source-map",
  module: {
    // rules 必须包含两个属性：test 和 use
    rules: [
      {
        test: /\.jsx?$/, // 识别哪些文件会被转换
        exclude: /node_modules/,
        use: [
          {
            loader: "thread-loader", // 开启多进程
            options: {
              workers: threads, // 数量
            },
          },
          { // 定义出在进行转换时，应该使用哪个 loader
            loader: 'babel-loader',
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
              cacheDirectory: true, // 开启babel变异缓存
              cacheCompression: false, // 缓存文件不好压缩
              plugins: ["@babel/plugin-transform-runtime"], // 减少代码体积
            }
          },
        ]
      },
      {
        test: /\.less/,
        use: ['style-loader', 'css-loader', 'less-loader'],
        generator: {
          filename: 'css/[name][ext]',
        },
      },
      {
        test: /\.css/,
        use: ['style-loader', 'css-loader'],
        generator: {
          filename: 'css/[name][ext]',
        },
      },
      {
        test: /\.html/,
        use: {
          loader: 'html-loader',
        }
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb的图片会被base64处理
          },
        },
        generator: {
          filename: 'images/[name][ext]',
        },
      },
      {
        test: /\.(ttf|woff2?)$/,
        type: "asset/resource",
        generator: {
          filename: 'icon/[name][ext]',
        },
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      // 新的
      filename: 'index.html',
      // 以 public/index.html 为模板创建文件
      // 新的html文件有两个特点：1. 内容和源文件一致 2. 自动引入打包生成的js等资源
      template: path.resolve(__dirname, './public/index.html')
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash:10].css",
      chunkFilename: "css/[name].[contenthash:10].chunk.css",
    }),
  ],
  optimization: {
    // 压缩的操作
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserWebpackPlugin({
        parallel: threads, // 开启多进程
      }),
    ],
    splitChunks: {
      chunks: "all",
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}`,
    },
  }
}
