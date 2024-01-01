import React, { memo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Checkbox, Button, Popover, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import useMergeState from "@/hooks/useMergeState";
import verify from "@/utils/verify";
import { getCheckCode, sendEmailCode, register, login, resetPassword } from '../../servers/common.js';
import './style.less';

const FormItem = Form.Item;
const context = (
  <div>
    <p>1、在垃圾箱中查找邮箱验证码</p>
    <p>2、在邮箱中头像->设置->反垃圾->设置邮箱地址白名单</p>
  </div>
);

const rules = {
  email: [
    { required: true, message: '请输入邮箱' },
    // { validator: verify.email, message: '请输入正确的邮箱' }
    { type: 'email', message: '请输入有效的邮箱' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { validator: verify.password, message: '密码只能是数字，字母，特殊字符8-18位' }
  ],
  emailCode: [{ required: true, message: '请输入邮箱验证码' }],
  username: [{ required: true, message: '请输入用户名' }],
  checkCode: [{ required: true, message: '请输入图片验证码' }],
};

const Login = () => {
  const navigate = useNavigate();
  const [state, setState] = useMergeState({
    operateType: 1, // 操作类型 0-注册，1-登录，2-重置密码, 默认是1，登录
    checkCodeUrl: null, // 验证码的url
    codeUid: null, // 验证码的临时uid
    rememberme: false, // 记住我
  });
  const { operateType, checkCodeUrl, codeUid } = state;

  const [form] = Form.useForm();

  useEffect(() => {
    changeCheckCode();

    const remembermeJson = localStorage.getItem('rememberme');
    if (remembermeJson) {
      const rememberme = JSON.parse(remembermeJson);
      form.setFieldValue('username', rememberme.username);
      form.setFieldValue('password', rememberme.password);
      form.setFieldValue('rememberme', rememberme.rememberme);
    }
  }, []);

  // 切换面板
  const showPanel = (type) => {
    setState({ operateType: type });
    resetForm();
  };

  const getEmailCode = async () => {
    try {
      await form.validateFields(['email']);
      const params  = {
        email: form.getFieldValue('email'),
        type: operateType == 0 ? 0 : 1, // 0: 注册 1: 找回密码
      }
      console.log('params', params);
      sendEmailCode(params).then(res => {
        console.log('获取邮箱', res);
        if (res.success) {
          message.success(res.message || '邮箱发送成功，请登录邮箱查看');
        }
      });
    } catch (err) {
      console.error('校验邮箱失败', err);
    }
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    changeCheckCode(); // 验证码更新
  }

  // 注册，登录，重置密码 提交表单
  const onFinish = (values) => {
    console.log('values', values);
    const params = values;
    params.uid = codeUid;

    // 注册 找回密码
    if (operateType === 0 || operateType === 2) {
      params.password = params.confirmPassword;
    }
    //
    // // 登录
    // if (operateType === 1) {
    //
    // }
    console.log('params', params);
    // let res = null;
    // 注册
    if (operateType === 0) {
      register(params).then(res => {
        console.log('注册请求', res);
        if (res.success) {
          message.success('注册成功，请登录');
        }
      }).catch(err => {
        console.log('注册异常', err);
      });
    } else if (operateType === 1) { // 登录
      // sessionStorage.setItem('userInfo', )
      const rememberme = params.rememberme;

      if (rememberme) {
        const remembermeObj = {
          password: params.password,
          username: params.username,
          rememberme: true,
        };
        localStorage.setItem('rememberme', JSON.stringify(remembermeObj));
      } else if (localStorage.getItem('rememberme')){
        localStorage.removeItem('rememberme');
      }
      // navigate('/main/all',{
      //   // 这里加上state是因为使用useLocation解析匹配动态路由展示页面
      //   state: {
      //     needLogin: true,
      //     menuCode: "main",
      //   },
      // });
      // return;
      login(params).then(res => {
        if (res.success) {
          message.success(res.message || '登录成功');
          sessionStorage.setItem('userInfo', JSON.stringify(res.data));
          sessionStorage.setItem('token', res.data.token);
          navigate('/main/all', {
            // 这里加上state是因为使用useLocation解析匹配动态路由展示页面
            state: {
              needLogin: true,
              menuCode: "main",
            },
          });
        }
      }).catch(err => {
        console.log('登录异常', err);
      });
    } else { // 重置密码
      resetPassword().then(res => {
        console.log('重置密码返回', res);
      }).catch(err => {
        console.log('重置密码异常', err);
      })
    }
  };

  // 获取图片验证码
  const changeCheckCode = useCallback(() => {
    getCheckCode().then(res => {
      setState({
        checkCodeUrl: `data:image/svg+xml;utf8,${encodeURIComponent((res?.data))}`,
        codeUid: res.uid
      });
    });
  }, []);

  return (
    <div className="login-body">
      <div className="bg"></div>
      <div className="login-panel">
        <Form form={form} className="login-register" onFinish={onFinish} autoComplete="off">
          <div className="login-title">NetPan云盘</div>
          {/***** 注册 *****/}
          {operateType !== 1 && (
            <>
              <FormItem
                name="email"
                rules={rules.email}
              >
                <Input
                  placeholder="请输入邮箱"
                  prefix={<MailOutlined className="site-form-item-icon"/>}
                  maxLength="150"
                />
              </FormItem>

              <div className="send-email-panel">
                <FormItem
                  style={{ width: '100%' }}
                  name="emailCode"
                  rules={rules.emailCode}
                >
                  <Input
                    placeholder="请输入邮箱验证码"
                    prefix={<i className="iconfont icon-password"/>}
                  />
                </FormItem>
                <Button type="primary" className="send-email-btn" onClick={() => getEmailCode()}>获取验证码</Button>
              </div>
              <Popover placement="left" content={context} className="a-link">未收到邮箱验证码？</Popover>
            </>
          )}

          {/***** 登录 *****/}
          <FormItem
            name="username"
            rules={rules.username}
          >
            <Input
              placeholder="请输入用户名"
              prefix={<i className="iconfont icon-account"/>}
              maxLength="150"
            />
          </FormItem>
          {/* 找回密码，重置密码 */}
          <FormItem
            name="password"
            rules={rules.password}
            hasFeedback
          >
            <Input.Password
              placeholder="请输入密码"
              prefix={<i className="iconfont icon-password"/>}
            />
          </FormItem>

          {operateType !== 1 && (
            <FormItem
              name="confirmPassword"
              rules={[
                { required: true, message: "请再次输入密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次密码不一致!'));
                  },
                }),
              ]}
              dependencies={['password']}
              hasFeedback
            >
              <Input.Password
                placeholder="请再次输入密码"
                prefix={<i className="iconfont icon-password"/>}
              />
            </FormItem>
          )}
          <div className="checkCode-panel">
            <FormItem
              name="checkCode"
              rules={rules.checkCode}
              style={{ width: '100%' }}
            >
              <Input
                placeholder="请输入验证码"
                prefix={<i className="iconfont icon-checkcode"/>}
              />
            </FormItem>
            <img className="checkCode-image" src={checkCodeUrl} onClick={changeCheckCode}/>
          </div>

          {/* 登录 */}
          {operateType === 1 && (
            <div className="rememberme-panel">
              <FormItem>
                <FormItem  name="rememberme" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </FormItem>
                <div className="no-account">
                  <a className="a-link" onClick={() => showPanel(2)}>忘记密码?</a>
                  <a className="a-link" onClick={() => showPanel(0)}>没有账号?</a>
                </div>
              </FormItem>
            </div>
          )}
          {/* 找回密码 */}
          {operateType === 2 && (
            <div className="no-account">
              <a className="a-link" onClick={() => showPanel(1)}>去登录?</a>
            </div>
          )}
          {operateType === 0 && (
            <div className="no-account">
              <a className="a-link" onClick={() => showPanel(1)}>已有账号?</a>
            </div>
          )}

          <FormItem>
            <Button type="primary" htmlType="submit" className="op-btn">
              {operateType === 0 && (<span>注册</span>)}
              {operateType === 1 && (<span>登录</span>)}
              {operateType === 2 && (<span>重置密码</span>)}
            </Button>
          </FormItem>
        </Form>
      </div>
    </div>
  );
};

export default memo(Login);
