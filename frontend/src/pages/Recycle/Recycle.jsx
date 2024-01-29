import React, { useEffect, useCallback } from 'react';
import { Button, Modal, message } from 'antd';
import dayjs from "dayjs";
import useMergeState from "../../hooks/useMergeState";
import NPTable from "../../components/Table/NPTable.jsx";
import Icon from "../../components/Icon/Icon.jsx";
import useHomeStore from "../../store/homeStore";
import { queryRecycleList, recoveryFile, delFile } from '@/servers/recycle';
import { sizeToStr } from '@/utils/utils';
import '@/assets/file.list.less';
import './style.less';

const Recycle = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [state, setState] = useMergeState({
    dataSource: [],
    pageNum: 1,
    pageSize: 10,
    total: 0,

    selectedRowKeys: [],
    selectedRows: [],
  });

  const {
    dataSource, pageNum, pageSize, total,
    selectedRowKeys, selectedRows
  } = state;

  const getUserSpace = useHomeStore(state => state.getUserSpace);

  useEffect(() => {
    queryFileList();
  }, []);

  const queryFileList = useCallback((params = {}) => {
    const queryParams = {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
    };
    queryRecycleList(queryParams).then(res => {
      if (res.success) {
        const { list, total } = res.data;
        setState(({
          dataSource: list,
          total,
          pageNum,
          pageSize
        }))
      }
    })
  }, []);

  // 恢复
  const revert = (row) => {
    console.log('--row--', row);
    modal.confirm({
      title: '还原',
      content: `你确定要还原【${row.fileName}】吗？`,
      onOk: () => revertOk(row),
    });
  };

  const revertOk = () => {
    const fileIds = selectedRowKeys.toString();
    const params = { fileIds };
    recoveryFile(params).then(res => {
      if (res.success) {
        message.success('还原成功');
        queryFileList();
      }
    });
  };

  // 批量恢复
  const revertBatch = () => {
    modal.confirm({
      title: '还原',
      content: `你确定要还原这些文件吗？`,
      onOk: () => revertOk(),
    });
  };

  // 删除文件
  const deleteFile = (row) => {
    modal.confirm({
      title: '删除',
      content: `你确定要删除【${row.fileName}】吗？`,
      onOk: () => deleteOk(),
    });
  };

  const deleteOk = () => {
    const fileIds = selectedRowKeys.toString();
    const params = { fileIds };
    delFile(params).then(res => {
      if (res.success) {
        message.success('删除文件成功');
        queryFileList();
        // 调恢复空间接口，其实就是重新调取获取空间的接口
        getUserSpace();
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

  const onSelectChange = (rowKeys, rows) => {
    setState({
      selectedRowKeys: rowKeys,
      selectedRows: rows
    })
  };

  const rowSelection = {
    width: 60,
    selectedRowKeys,
    selectedRows,
    onChange: onSelectChange,
  };

  // 展示操作按钮
  const handleShowOp = useCallback((row) => {
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

  const columns = [
    {
      title: '文件名',
      key: 'fileName',
      dataIndex: 'fileName',
      render: (text, row, index) => {
        const { fileType, status, fileCover, folderType, fileName, showOp } = row;
        return (
          <div
            className="file-item"
            onMouseEnter={() => handleShowOp(row)}
            onMouseLeave={() => handleCancelShowOp(row)}
          >
            {(fileType == 3 || fileType == 1) && status != 0 ? (
              <Icon cover={fileCover} />
            ): (
              <>
                {folderType == 0 && <Icon fileType={fileType} />}
                {folderType == 1 && <Icon fileType={0} />}
              </>
            )}
            <div className="file-name">
              {fileName}
            </div>
            <span className="op">
              {showOp && (
                <>
                  <span className="iconfont icon-revert" onClick={() => revert(row)}>还原</span>
                  <span className="iconfont icon-cancel" onClick={() => deleteFile(row)}>删除</span>
                </>
              )}
            </span>
          </div>
        )
      }
    },
    {
      title: '删除时间',
      key: 'recoveryTime',
      dataIndex: 'recoveryTime',
      width: 200,
      render: (text) => text && dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '大小',
      key: 'fileSize',
      dataIndex: 'fileSize',
      width: 200,
      render: (text, record) => text ? sizeToStr(text) : ''
    },
  ];

  return (
    <div className="recycle">
      <div className="top">
        <Button type="primary" disabled={!selectedRowKeys.length} onClick={revertBatch}>
          <span>
            <span className="iconfont icon-revert"></span>
            还原
          </span>
        </Button>
        <Button type="primary" danger disabled={!selectedRowKeys.length} onClick={deleteFileBatch}>
          <span>
            <span className="iconfont icon-del"></span>
            批量删除
          </span>
        </Button>
      </div>

      <div className="file-list">
        <NPTable
          dataSource={dataSource}
          columns={columns}
          total={total}
          rowSelection={rowSelection}
        />
      </div>
      {contextHolder}
    </div>
  );
};

export default Recycle;
