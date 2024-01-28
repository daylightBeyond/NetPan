import React, { memo, useState, useImperativeHandle, forwardRef } from 'react';
import { Modal, Form, Radio, Input, Button, message } from 'antd';
import useMergeState from "../../hooks/useMergeState";
import { shareFile } from '@/servers/share';
import verify from "@/utils/verify";

const { Item } = Form;

const rules = {
  validType: [{ required: true, message: '请选择有效期' }],
  codeType: [{ required: true, message: '请选择提取码类型' }],
  code: [
    { required: true, message: '请输入提取码' },
    { validator: verify.shareCode, message: '请输入提取码' },
    { min: 5, message: '至少输入五位提取码' },
  ]
};

const ShareFile = forwardRef((props, ref) => {
  const { changeState, open, fileData } = props;
  const [form] = Form.useForm();

  // 是否展示分享表单，0：分享表单，1：分享结果
  // const [showType, setShowType] = useState(0);
  // const [resultInfo, setResultInfo] = useState({});
  const shareUrl = document.location.origin + '/share/';

  const [state, setState] = useMergeState({
    showType: 0,
    resultInfo: {},
    fileData: {},
  });

  const { showType, resultInfo } = state;

  useImperativeHandle(ref, () => {
    return {
      show,
    }
  });
  const show = (data) => {
    console.log('父组件传入的数据', data);
    setState({
      showType: 0,
      resultInfo: {},

    });
    changeState({ shareVisible: true });
    form.resetFields();
    form.setFieldsValue(data);
  };

  const handleOk = async () => {
    if (Object.keys(resultInfo).length) {
      handleCancel();
      return;
    }
    // 校验
    try {
      const values = await form.validateFields();
      console.log('values', values);
      const res = await shareFile(values);
      console.log('分享文件', res);
      if (res.success) {
        return;
      }
      setState({ showType: 1, resultInfo: res.data });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    changeState({ shareVisible: false });
  };

  const copy = () => {
    const copyText = `链接：${shareUrl}${resultInfo.shareId} 提取码：${resultInfo.code}`;
     navigator.clipboard.writeText(copyText)
      .then(() => message.success('复制成功'))
      .catch((err) => console.error('Failed to copy: ', err));
  };

  // console.log('form', form.getFieldValue('fileName'))

  return (
    <Modal
      title="分享"
      width={600}
      open={open}
      onOk={handleOk}
      okText={showType == 0 ? '确定' : '关闭'}
      onCancel={handleCancel}
      cancelText={showType == 0 ? '取消' : ''}
    >
      <Form form={form}>
        <Item label="文件名">
          文件名
        </Item>

        {showType === 0 ? (
          <>
            <Item label="有效期" name="validType" rules={rules.validType}>
              <Radio.Group>
                <Radio value={1}>1天</Radio>
                <Radio value={2}>7天</Radio>
                <Radio value={3}>30天</Radio>
                <Radio value={4}>永久有效</Radio>
              </Radio.Group>
            </Item>

            <Item label="提取码" name="codeType" rules={rules.codeType}>
              <Radio.Group>
                <Radio value={1}>自定义</Radio>
                <Radio value={2}>自动生成</Radio>
              </Radio.Group>
            </Item>

            {form.getFieldValue('codeType') == 0 && (
              <Item label="分享码" name="code" rules={rules.code}>
                <Input palceholder="请输入五位提取码" maxLength={5} />
              </Item>
            )}
          </>
        ) : (
          <>
            <Item label="分享链接">
              {shareUrl}{resultInfo.shareId}
            </Item>
            <Item label="提取码">
              {resultInfo.code}
            </Item>
            <Item>
              <Button type="primary" onClick={copy}>
                复制链接及提取码
              </Button>
            </Item>
          </>
        )}
      </Form>
    </Modal>
  );
});

ShareFile.defaultProps = {
  open: false,
  changeState () {},
}
export default memo(ShareFile);
