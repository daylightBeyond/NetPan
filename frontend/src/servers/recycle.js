import request from "@/utils/request";

// 查询删除文件列表
export const queryRecycleList = (param) => {
  return request({
    method: 'post',
    url: '/recycle/queryRecycleList',
    data: param,
  });
};

// 删除文件
export const delFile = (param) => {
  return request({
    method: 'post',
    url: '/recycle/delFile',
    data: param,
  });
};

// 恢复文件
export const recoveryFile = (param) => {
  return request({
    method: 'post',
    url: '/recycle/recoveryFile',
    data: param,
  });
};
