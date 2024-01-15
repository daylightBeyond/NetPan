import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { Modal } from "antd";
import Icon from "../Icon/Icon.jsx";
import useMergeState from "@/hooks/useMergeState";
import { loadAllFolder } from '@/servers/home';
import './style.less';

const FolderSelect = forwardRef((props, ref) => {
  const { folderSelect } = props;
  const [state, setState] = useMergeState({
    open: false,

    filePid: '0',
    folderList: [],
    currentFileIds: '0',
    currentFolder: {},
  });

  const { open, filePid, folderList, currentFileIds, currentFolder } = state;

  useImperativeHandle(ref, () => {
    return {
      showFolder,
      close: onCancel,
    }
  });

  const showFolder = (currentFolder) => {
    setState({
      open: true,
      currentFileIds: currentFolder
    });
    getAllFolder();
  };

  const getAllFolder = () => {
    const params = {
      filePid,
      fileIds: currentFileIds
    };
    loadAllFolder(params).then(res => {
      console.log('加载所有目录', res);
      if (res.success) {
        setState({
          folderList: res.data
        })
      }
    }).catch(e => {
      console.log('加载文件目录异常', e);
    })
  };

  // 确定选择目录
  const onOk = () => {
    // onCancel();
    folderSelect && folderSelect(filePid);
  };

  const onCancel = () => {
    setState({ open: false });
  };

  // 选择文件进行导航跳转
  const selectFolder = (data) => {

  };

  return (
    <Modal
      open={open}
      title="移动到"
      okText="移动到此"
      width={600}
      onOk={onOk}
      onCancel={onCancel}
      className="folder-select"
    >
      <div className="navigation-panel"></div>
      {
        folderList.length ? (
          <div className="folder-list">
            {folderList.map(item => (
              <div
                key={item.fileId}
                className="folder-item"
                onClick={() => selectFolder(item)}
              >
                <Icon folderType={0} />
                <span className="file-name">{item.fileName}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            移动<span>{currentFolder.fileName}</span>
          </>
        )
      }
    </Modal>
  );
});

export default FolderSelect;
