import React, { memo, useEffect } from 'react';
import { Form, Input, Checkbox, Button, Popover } from 'antd';
import { MailOutlined} from '@ant-design/icons';
import useMergeState from "@/hooks/useMergeState";
import verify from "@/utils/verify";
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
    { validator: verify.email, message: '请输入正确的邮箱' }
  ],
  password: [{ required: true, message: '请输入密码' }],
  emailCode: [{ required: true, message: '请输入邮箱验证码' }],
  username: [{ required: true, message: '请输入用户名' }],
  registerPassword: [
    { required: true, message: '请输入注册密码' },
    { validator: verify.password, message: '密码只能是数字，字母，特殊字符8-18位' }
  ],
  reRegisterPassword: [
    { required: true, message: '请再次输入注册密码' },
    // { validator: checkPassword, message: '两次输入的密码不一致' }
  ],
  checkCode: [{ required: true, message: '请输入图片验证码' }],
}
const Login = () => {
  const [state, setState] = useMergeState({
    operateType: 1, // 操作类型 0-注册，1-登录，2-重置密码, 默认是1，登录
  });
  const { operateType } = state;

  const [form] = Form.useForm();

  const showPanel = (type) => {
    setState({ operateType: type });
    resetForm();
  };

  const getEmailCode = () => {
    form.validateFields(['email']).then((value) => {
      if (!value) {
        return;
      }
      const params  = {
        email: value,
        type: operateType == 0 ? 0 : 1, // 0: 注册 1: 找回密码
      }
    }).catch((err) => {
      console.log('err', err)
    })
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
  }

  // 注册，登录，重置密码 提交表单
  const onFinish = (values) => {
    console.log('values', values);
  };

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
                  rules={[
                    { required: true, message: "请输入邮箱验证码" }
                  ]}
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
              name="registerPassword"
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
              name="checkcode"
              rules={[
                { required: true, message: "请输入验证码" }
              ]}
              style={{ width: '100%' }}
            >
              <Input
                placeholder="请输入验证码"
                prefix={<i className="iconfont icon-checkcode"/>}
              />
            </FormItem>
            <img className="checkCode-image" src="@/assests/avatar/01cfd95d145660a8012051cdb52093.png@1280w_1l_2o_100sh.png" />
          </div>

          {/* 登录 */}
          {operateType === 1 && (
            <div className="rememberme-panel">
              <FormItem name="remenberme">
                <Checkbox>记住我</Checkbox>
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