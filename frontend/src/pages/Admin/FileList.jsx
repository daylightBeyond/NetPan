import React from 'react';
import { Button, Input } from "antd";
import useMergeState from "../../hooks/useMergeState";
import Navigation from "../../components/Navigation/Navigation.jsx";
import NPTable from "../../components/Table/NPTable.jsx";
import '@/assets/file.list.less';
import './style.less';

const FileList = () => {
  const [state, setState] = useMergeState({
    dataSource: [],
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });

  const { dataSource, pageNum, pageSize, total } = state;
  const preview = () => {

  };

  const columns = [

  ];

  const tableOptions = {
    extHeight: 50,
    selectType: 'checkbox'
  };

  const selectChange = (selectedRowKeys, selectedRows) => {
    console.log('selectedRowKeys', selectedRowKeys);
    console.log('selectedRows', selectedRows);
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
            <Navigation preview={preview} />
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
            rowSelection={{
              width: 60,
              onChange: selectChange
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FileList;
