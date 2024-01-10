import React from 'react';
import { Table, Pagination } from "antd";
import './style.less';

/**
 * 基于 antd 的 Table 组件二次封装
 * 没有用 Table 内置的 Pagination 组件
 * @returns {JSX.Element}
 * @constructor
 */
const NPTable = (props) => {
  // console.log('自定义Table组件', props);
  const {
    dataSource,
    columns,
    loading,
    rowSelection,
    onRow,
    showPagination,
    className,
    scroll,
    showPageSize,
    pagination,
    options,
    total,
    rowKey,
    style,
    ...rest
  } = props;

  // console.log('props--options', options);
  // console.log('props--total', total);

  // 顶部 60，内容区域距离顶部 20， 内容上下间距 15 * 2， 分页区域高度 46
  const topHeight = 60 + 20 + 30 + 46;
  const tableHeight = options.tableHeight ? options.tableHeight : window.innerHeight - topHeight - options.extHeight;
  // console.log('tableHeight', tableHeight);

  const getNewColumns = () => {
    let newColumns = columns;
    if (options.showIndex) {
       newColumns = [
        {
          title: '序号',
          key: 'index',
          width: 60,
          render: (text, record, index) => index + 1,
        },
        ...columns
      ]
    }
    return newColumns;
  }

  return (
    <div className="NPTable-wrapper">
      <Table
        className={`NPTable-index ${className}`}
        dataSource={dataSource}
        columns={getNewColumns()}
        loading={loading}
        pagination={false}
        rowSelection={rowSelection}
        onRow={onRow}
        rowKey={rowKey ? rowKey : 'fileId'}
        scroll={{
          y: window.document.body.clientHeight - 280,
          ...scroll
        }}
        // style={style ? { height: tableHeight, ...style } : { height: tableHeight }}
        {...rest}
      />
      {showPagination && total ? (
        <div className="pagination">
          <Pagination
            total={total}
            showQuickJumper
            showSizeChanger
            showTotal={(total) => `共 ${pagination?.total || total} 条`}
            pageSizeOptions={['10', '20', '30', '50', '100']}
            style={{ textAlign: "right" }}
            {...pagination}
          />
        </div>
      ) : ''}
    </div>
  );
};

NPTable.defaultProps = {
  // 数据源
  dataSource: [],
  // 数据行
  columns: [],
  loading: false,
  total: 0,
  showPagination: true,
  showPageSize: true,
  options: {
    extHeight: 0,
    showIndex: false,
  },
  onRow () {},
  fetch () {},
  initFetch: true,
  className: ''
}
export default NPTable;
