import React from 'react';
import { Button } from 'antd';
import NPTable from "../../components/Table/NPTable.jsx";
import useMergeState from "../../hooks/useMergeState";
import './style.less';

const Share = () => {
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

  const cancelShareBatch = () => {

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

  const columns = [
    {
      title: '文件名',
      key: 'fileName',
      dataIndex: 'fileName',
    },
    {
      title: '分享时间',
      key: 'shareTime',
      dataIndex: 'shareTime',
      width: 200,
    },
    {
      title: '失效时间',
      key: 'invalidTime',
      dataIndex: 'invalidTime',
      width: 200,
    },
    {
      title: '浏览次数',
      key: 'count',
      dataIndex: 'count',
      width: 200,
    },
  ];

  return (
    <div className="share-wrapper">
      <div className="top">
        <Button type="primary" disabled={!selectedRowKeys.length} onClick={cancelShareBatch}>
          <span className="iconfont icon-cancel">取消分享</span>
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
    </div>
  );
};

export default Share;
