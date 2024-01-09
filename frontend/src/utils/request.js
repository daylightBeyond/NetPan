import axios from 'axios';
import { Spin, message } from 'antd';
import { getToken } from '@/utils/auth.js';

const env = process.env.NODE_ENV || 'development';

// 配置接口请求环境
const urlEnv = {
  development: '/api',
  production: 'http://192.168.136.130:7090'
};

const baseURL = urlEnv[env] || '/api';


const contentTypeForm = 'applocaiton/x-www-form-urlencoded;charset=UTF-8';
const contentTypeJson = 'application/json';
// blob Blob对象
const responseTypeJson = 'json';


let loading = null;
const instance = axios.create({
  // 公共的请求地址前缀
  baseURL,
  timeout: 10 * 1000, // 10s 就会超时
  headers: {
    isToken: true,
    'Content-Type': contentTypeJson
  }
});

instance.interceptors.request.use(
  (config) => {
    // 是否需要设置 token
    const isToken = (config.headers || {}).isToken === false;

    if(getToken() && !isToken) {
      config.headers['Authorization'] = 'Bearer ' + getToken(); // 可以携带自定义token
    }

    return config;
  },
  (error) => {
    if(loading) {
      loading.close();
    }
    message.error(error || '请求发送失败');
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    console.log('响应拦截器返回', response);
    const { errorCallback, showError = true, responseType } = response.config;
    if(loading) {
      loading.close();
    }
    const responseData = response.data;

    // 未设置状态码则默认为成功状态
    const code = responseData.code || 200;
    // 获取错误信息
    // const msg = codeMessage[code] || responseData.msg || '未知错误';
    // 二进制数据直接返回
    if(response.responseType === 'blob' || response.responseType === 'arraybuffer') {
      return responseData;
    }
    if(code === 200) {
      return responseData;
    } else if(code === 901) {
      // 登录超时
      // router.push('/Login?redirectUrl=' + encodeURI(router.currentRoute.value.path));
      return Promise.reject({ showError: false, msg: '登录超时' });
    } else {
      // 其他错误
      if(errorCallback) {
        errorCallback(responseData.info);
      }
      return Promise.reject({ showError: showError, msg: responseData.info });
    }
  },
  (error) => {
    console.log('响应返回的错误', error);
    try {
      const { response } = error;
      const { data } = response || {};
      const errorMsg = data?.err?.message || data.errorMsg || data.msg;
      if (!data.success && errorMsg) {
        message.error(errorMsg);
      }
      return Promise.reject(error);

      let { message: msg } = error;
      if (msg == "Network Error") {
        msg = "后端接口连接异常";
      } else if (msg.includes("timeout")) {
        msg = "系统接口请求超时";
      } else if (msg.includes("Request failed with status code")) {
        msg = "系统接口" + msg.substr(msg.length - 3) + "异常";
      }
      message.error(msg, 5);
      return Promise.reject(error);
    } catch (e) {
      console.log('捕获异常', e);
    }
  }
);
export default instance;
