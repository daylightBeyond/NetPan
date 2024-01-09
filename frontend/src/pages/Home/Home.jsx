import React, { memo, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Button, Input, message } from 'antd';
import dayjs from 'dayjs';
import Navigation from "../../components/Navigation/Navigation.jsx";
import NPTable from "../../components/Table/NPTable.jsx";
import ShareFile from "./ShareFile.jsx";
import useMergeState from "@/hooks/useMergeState";
import useUploadFileStore from "@/store/uploadFileStore.js";
import { queryFile } from '../../servers/home';
import { sizeToStr } from "../../utils/utils";
import '@/assets/file.list.less';
import Icon from "../../components/Icon/Icon.jsx";

const Home = () => {
  const routeParams = useParams();
  console.log('routeParams', routeParams);

  const [state, setState] = useMergeState({
    currentFolder: { fileId: 0 },
    shareVisible: false, // 分享弹窗是否显示
    dataSource: [],
    pageNum: 1,
    pageSize: 10,
    total: 1,
    loading: false, // 查询数据加载
  });

  const { currentFolder, shareVisible, dataSource, pageNum, pageSize, total } = state;

  const shareFileRef = useRef(null);

  // store的变量和方法
  const addFile = useUploadFileStore(state => state.addFile);
  const setShowUploader = useUploadFileStore(state => state.setShowUploader);

  useEffect(() => {
    queryFileList({ pageNum: 1, pageSize: 10 });
  }, [routeParams]);

  const queryFileList = (params = {}) => {
    const queryParams = {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
      category: routeParams.category,
      fileName: params.fileName
    };
    queryFile(queryParams).then(res => {
      console.log('查询文件列表', res);

      if (res.success) {
        const { list, pageNum, pageSize, total } = res.data || {};
        setState({
          dataSource: list,
          pageNum,
          pageSize,
          total
        });
      }
    })
  };

  /*
   * 由于Home组件和Uploader组件无任何关联，但是又需要点上传的时候触发 Uploader组件的方法，
   * 单靠组件间传值不方便处理，最好的方法是用状态管理
   */
  const customRequest = (options) => {
    console.log('options', options);
    const { file } = options;
    addFile({ file, filePid: currentFolder.fileId });
    setShowUploader(true);
  };

  const uploadProps = {
    multiple: true,
    showUploadList: false,
    customRequest
  };

  const saveNameEdit = (index) => {

  };

  const cancelNameEdit = (index) => {

  };

  const columns = [
    {
      title: "文件名",
      key: "fileName",
      dataIndex: "fileName",
      render: (text, record, index) => {
        const { fileType, folderType, status, fileCover, showEdit, fileNameReal, showOp, fileId, fileSuffix } = record;
        return (
          <div
            className="file-item"
            onMouseEnter={() => handleShowOp(record, index)}
            onMouseLeave={() => handleCancelShowOp(record)}
          >
            {/* status: 0:转码中 1:转码失败 2:转码成功 */}
            {(fileType == 3 || fileType == 1) && status == 2 ? (
              <Icon cover={fileCover} width={32}/>
            ) : (
              <>
                {folderType == 0 && <Icon fileType={fileType} />}
                {folderType == 1 && <Icon fileType={0} />}
              </>
            )}

            {!showEdit && (
              <span className="file-name">
                <span onClick={() => preview(record)}>{text}</span>
                {status == 0 && <span className="transfer-status">转码中</span>}
                {status == 1 && <span className="transfer-status transfer-fail">转码失败</span>}
              </span>
            )}
            {showEdit && (
              <div className="edit-panel">
                <Input maxLength={190} />
                <span className={`iconfont icon-right1 ${fileNameReal ? '' : 'not-allow'}`} onClick={() => saveNameEdit(index)}></span>
                <span className="iconfont icon-error" onClick={() => cancelNameEdit(index)}></span>
              </div>
            )}
            {showOp && fileId && status === 2 && (
              <span className="op">
                <span className="iconfont icon-share1" onClick={() => share(record)}>分享</span>
                <span className="iconfont icon-download">下载</span>
                <span className="iconfont icon-del">删除</span>
                <span className="iconfont icon-edit">重命名</span>
                <span className="iconfont icon-move">移动</span>
              </span>
            )}
          </div>
        )
      }
    },
    {
      title: "修改时间",
      key: "lastUpdateTime",
      dataIndex: "lastUpdateTime",
      width: 200,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : ''
    },
    {
      title: "大小",
      key: "fileSize",
      dataIndex: "fileSize",
      width: 200,
      render: (text) => text ? sizeToStr(text) : '-',
    },
  ];

  const tableOptions = {
    extHeight: 50,
    selectType: 'checkbox'
  };

  const rowSelection = {

  };

  // 展示操作按钮
  const handleShowOp = useCallback((row, index) => {
    dataSource.map(item => {
      item.showOp = false;
    })
    row.showOp = true;
    // 更新state，不然页面是不会出现或消失操作项
    setState(() => {});
  }, []);

  const handleCancelShowOp = useCallback((row) => {
    row.showOp = false;
    // 更新state，不然页面是不会出现或消失操作项
    setState(() => {});
  }, []);

  const selectChange = (selectedRowKeys, selectedRows) => {
    console.log('selectedRowKeys', selectedRowKeys);
    console.log('selectedRows', selectedRows);
  };

  // 预览
   const preview = (data) => {
     if (data.folderType == 1) { // 目录

     }
   };

   // 分享
   const share = (row) => {
     console.log('share--row', row);
     console.log('shareFileRef', shareFileRef);
     shareFileRef.current.show(row);
   };

  return (
    <>
      <div className="top">
        <div className="top-op">
          <div className="btn">
            <Upload {...uploadProps}>
              <Button style={{ backgroundColor: '#409eff' }}>
                <span className="iconfont icon-upload">
                  上传
                </span>
              </Button>
            </Upload>
          </div>
          <Button style={{ backgroundColor: '#67c23a' }}>
            <span className="iconfont icon-folder-add">
              新建文件夹
            </span>
          </Button>
          <Button style={{ backgroundColor: '#fab6b6' }}>
            <span className="iconfont icon-del">
              批量删除
            </span>
          </Button>
          <Button style={{ backgroundColor: '#f3d19e' }}>
            <span className="iconfont icon-move">
              批量移动
            </span>
          </Button>
          <div className="search-panel">
            <Input placeholder="输入文件名搜索"/>
          </div>
          <div className="iconfont icon-refresh"></div>
        </div>
        {/* 导航 */}
        <div className="top-navigation">
          <span className="all-file">
            <Navigation preview={preview} />
          </span>
        </div>
      </div>
      {/* 文件列表 */}
      <div className="file-list">
        {routeParams.category}
        <NPTable
          dataSource={dataSource}
          columns={columns}
          total={total}
          rowKey="fileId"
          options={tableOptions}
          rowSelection={{
            width: 60,
            onChange: selectChange
          }}
        />
      </div>

      {/* 分享 */}
      <ShareFile
        ref={shareFileRef}
        open={shareVisible}
        changeState={(data) => setState(data)}
      />
    </>
  );
};

export default memo(Home);
