# Netpan
这是前端基于react，后端基于nodejs的仿照百度网盘的全栈项目，
由于时间原因，目前实现了
登录，修改密码，更新头像，大文件切片上传，断点续传，批量删除文件，移动文件，递归删除文件，视频切割，在线预览等功能，前端webpack打包配置优化

## 后端 nodejs koa
### 1 环境安装
现在 backend 目录下新建一个 `npmrc` 文件

```bash
sharp_binary_host="https://npm.taobao.org/mirrors/sharp"
sharp_libvips_binary_host="https://npm.taobao.org/mirrors/sharp-libvips"
```
然后用nrm切换 taobao 镜像源，也可以自行切换镜像

`npm i` 安装依赖

注意对于 `redis` 依赖包最好使用跟我这个相同的版本

### 2 mysql 建表
```sql
CREATE TABLE `email_code` (
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '邮箱',
  `code` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '编号',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `status` tinyint(1) DEFAULT NULL COMMENT '0:未使用 1:已使用',
  PRIMARY KEY (`email`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

```sql
CREATE TABLE `file_info` (
  `file_id` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文件ID',
  `user_id` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户ID',
  `file_md5` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件MD5值',
  `file_pid` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件父级ID',
  `file_size` bigint DEFAULT NULL COMMENT '文件大小',
  `file_name` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件名',
  `file_cover` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件封面',
  `file_path` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件路径',
  `create_time` datetime DEFAULT NULL COMMENT '文件创建时间',
  `last_update_time` datetime DEFAULT NULL COMMENT '最后更新时间',
  `folder_type` tinyint(1) DEFAULT NULL COMMENT '0:文件 1:目录',
  `file_category` tinyint(1) DEFAULT NULL COMMENT '文件分类 1:视频 2:音频 3:图片 4:文档 5:其他',
  `file_type` tinyint(1) DEFAULT NULL COMMENT '1:视频 2:音频 3:图片 4:pdf 5:doc 6:excel 7:txt 8:code 9:zip 10:其他',
  `status` tinyint(1) DEFAULT NULL COMMENT '0:转码中 1:转码失败 2:转码成功',
  `recovery_time` datetime DEFAULT NULL COMMENT '进入回收站时间',
  `del_flag` tinyint(1) DEFAULT NULL COMMENT '标记删除 0:删除 1:回收站 2:正常',
  PRIMARY KEY (`file_id`,`user_id`),
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_md5` (`file_md5`) USING BTREE,
  KEY `idx_file_pid` (`file_pid`) USING BTREE,
  KEY `idx_del_flag` (`del_flag`) USING BTREE,
  KEY `idx_recover_time` (`recovery_time`) USING BTREE,
  KEY `dix_status` (`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='文件信息';
```

```sql
CREATE TABLE `user_info` (
  `user_id` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户ID',
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '昵称',
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '邮箱',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '密码',
  `join_time` datetime DEFAULT NULL COMMENT '注册时间',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `status` tinyint(1) DEFAULT NULL COMMENT '0:禁用 1:启用',
  `use_space` bigint DEFAULT NULL COMMENT '使用空间单位 byte',
  `total_space` bigint DEFAULT NULL COMMENT '网盘总空间',
  `admin` bigint DEFAULT NULL COMMENT '是否为超级管理员账号 0:否 1:是',
  `avatar_path` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户上传的头像',
  `avatar_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户头像类型',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```


### 配置qq邮箱授权码发送验证码
此处可自动百度

## 前端 react react-router6 zustand antd
前端大部分功能实现了，分享，管理员页面还没完善
