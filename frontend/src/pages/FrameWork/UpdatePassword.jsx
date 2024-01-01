import React from 'react';
import { Modal, Form, message, Input } from 'antd';
import { updatePassword } from '@/servers/home.js'
import verify from "@/utils/verify";

const { Item } = Form;
const layoutCol = {
  labelCol: {
    span: 5,
  },
  wrapperCol:{
    span: 16,
  },
};
const rules = {
  password: [
    { required: true, message: '请输入密码' },
    { validator: verify.password, message: '密码只能是数字，字母，特殊字符8-18位' }
  ],
};
const UpdatePassword = (props) => {
  const { changeState, open, userId } = props;
  const [form] = Form.useForm();

  const handleOk = () => {
    handleCancel();
  };

  const handleCancel = () => {
    changeState({ passwordVisible: false });
  };

  return (
    <Modal
      title="更新头像"
      width="25%"
      // confirmLoading={loading}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      autoComplete="off"
    >
      <Form
        {...layoutCol}
        form={form}
      >
        <Item
          label="新密码"
          name="password"
          rules={rules.password}
          hasFeedback
        >
          <Input.Password
            placeholder="请输入密码"
            prefix={<i className="iconfont icon-password"/>}
          />
        </Item>

        <Item
          label="确认新密码"
          name="comfirmPassword"
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
            placeholder="请确认密码"
            prefix={<i className="iconfont icon-password"/>}
          />
        </Item>
      </Form>
    </Modal>
  );
};

export default UpdatePassword;
