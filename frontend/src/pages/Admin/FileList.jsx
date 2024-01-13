import React, { useEffect, useRef } from 'react';
import { Modal, Button, Input, message } from "antd";
import { delFile, createDownloadUrl, download } from '@/servers/admin';
import useMergeState from "../../hooks/useMergeState";
import Navigation from "../../components/Navigation/Navigation.jsx";
import NPTable from "../../components/Table/NPTable.jsx";
import '@/assets/file.list.less';
import './style.less';
import Icon from "../../components/Icon/Icon.jsx";
import dayjs from "dayjs";
import { sizeToStr } from "../../utils/utils";

const FileList = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [state, setState] = useMergeState({
    dataSource: [],
    pageNum: 1,
    pageSize: 10,
    total: 0,

    showLoading: false,
    selectedRowKeys: [],
    selectedRows: [],

    currentFolder: { fileId: '0' }, // 当前目录
  });

  const {
    dataSource, pageNum, pageSize, total,
    showLoading, selectedRowKeys, selectedRows,
    currentFolder,
  } = state;

  const navigationRef = useRef(null);
  const previewRef = useRef(null);

  // 查询文件列表
  const loadDataList = (params = {}) => {
    const queryParam = {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
    };
  };

  // 监听路由导航
  const navChange = (data) => {
    const { curFolder } = data;
    setState({
      currentFolder: curFolder,
      showLoading: true,
    });
    loadDataList();
  };

  // 预览
  const preview = (data) => {
    // 目录
    if (data.folderType == 1) {
      navigationRef.current.openFolder(data);
      return;
    }
    // 文件
    if (data.status != 2) {
      message.warning('文件未完成转码，无法预览');
      return;
    }
    previewRef.current.showPreview(data, 1);
  };

  const search = () => {
    setState({ showLoading: true });
    loadDataList();
  };

  // 显示操作项
  const handleShowOp = (record, index) => {

  };

  // 不显示操作项
  const handleCancelShowOp = (index) => {

  };

  // 保存名字
  const saveNameEdit = (index) => {

  };

  const cancelNameEdit = (index) => {

  };

  // 下载文件
  const downloadFile = (row) => {
    const param = row.userId + '/' + row.fileId;
    createDownloadUrl(param).then(res => {
      if (res.success) {
        window.location.href = download + '/' + res.data;
      }
    });
  };

  // 删除文件
  const deleteFile = (row) => {
    modal.confirm({
      title: '删除',
      content: `你确定要删除【${row.fileName}】吗？删除的文件可在10天内通过回收站还原`,
      onOk: () => deleteOk(row),
    });
  };

  const deleteOk = (row) => {
    const params = { fileIdAndUserIds: row.fileId + '_' + row.fileId };
    delFile(params).then(res => {
      if (res.success) {
        message.success('删除文件成功');
        loadDataList();
      }
    });
  };

  // 批量删除文件
  const deleteFileBatch = () => {
    modal.confirm({
      title: '删除',
      content: `你确定要删除这些文件吗？删除后无法恢复`,
      onOk: () => deleteOk(),
    });
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
                <span ref={previewRef} onClick={() => preview(record)}>{text}</span>
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
                <span className="iconfont icon-download" onClick={() => downloadFile(row)}>下载</span>
                <span className="iconfont icon-del" onClick={() => deleteFile(row)}>删除</span>
              </span>
            )}
          </div>
        )
      }
    },
    {
      title: "发布人",
      key: "userName",
      dataIndex: "userName",
      width: 250,
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

  const onSelectChange = (rowKeys, rows) => {
    console.log('rowKeys', rowKeys);
    console.log('rows', rows);
    const newRowKeys = [];
    rows.forEach(item => {
      newRowKeys.push(item.userId + '_' + item.fileId);
    });
    setState({
      selectedRowKeys: newRowKeys,
      selectedRows: rows
    });
  };

  const rowSelection = {
    width: 60,
    selectedRowKeys,
    selectedRows,
    onChange: onSelectChange
  };

  return (
    <div>
      <div className="top">
        <div className="top-op">
          <div className="search-panel">
            <Input placeholder="输入文件名搜索"/>
          </div>
          <div className="iconfont icon-refresh"></div>
        </div>
        {/* 导航 */}
        <div className="top-navigation">
          <span className="all-file">
            <Navigation ref={navigationRef} navChange={navChange} />
          </span>
        </div>

        {/* 文件列表 */}
        <div className="file-list">
          <NPTable
            dataSource={dataSource}
            columns={columns}
            total={total}
            rowKey="fileId"
            options={tableOptions}
            rowSelection={rowSelection}
          />
        </div>
      </div>
      {contextHolder}
    </div>
  );
};

export default FileList;
