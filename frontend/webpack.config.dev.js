const path = require('path');
const { HotModuleReplacementPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 入口文件
  entry: './src/index.js',
  mode: 'development',
  // 输出文件
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, 'src'),
    }
  },
  devtool: 'source-map',
  // loader
  module: {
    // rules 必须包含两个属性：test 和 use
    rules: [
      {
        test: /\.jsx?$/, // 识别哪些文件会被转换
        exclude: /node_modules/,
        use: { // 定义出在进行转换时，应该使用哪个 loader
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
        }
      },
      {
        test: /\.less/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
      {
        test: /\.css/,
        use: ['style-loader', 'css-loader'],
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
        // use: [{
        //   loader: 'url-loader',
        //   options: {
        //     publicPath: '/src/assets',
        //     outputPath: 'images',
        //     limit: 1024 * 30,
        //     fallback: 'file-loader'
        //   }
        // }]
      }
    ]
  },
  // plugin
  plugins: [
    new HtmlWebpackPlugin({
      // 新的
      filename: 'index.html',
      // 以 public/index.html 为模板创建文件
      // 新的html文件有两个特点：1. 内容和源文件一致 2. 自动引入打包生成的js等资源
      template: path.resolve(__dirname, './public/index.html')
    }),
    new HotModuleReplacementPlugin(),
  ],
  devServer: {
    static: path.join(__dirname, './public'),
    port: 3002,
    open: true,
    hot: true,
    proxy: {
      '/api': {
        target: 'http://192.168.136.130:7090',
        // target: 'http://119.91.45.47:7090',
        // 如果不希望传递/api，则需要重写路径
        // pathRewrite: { '^/api': '/api' },
        changeOrigin: true, // 控制请求头中的 host 域，默认为 false
      }
    }
  }
}
