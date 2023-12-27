export const menus = [
  {
    icon: "cloude",
    name: "首页",
    path: "/main/all",
    menuCode: "main",
    allShow: true,
    children: [
      {
        icon: "all",
        name: "全部",
        category: "al1",
        path: "/main/all",
      },
      {
        icon: "video",
        name: "视频",
        category: "video",
        path: "/main/video",
      },
      {
        icon: "music",
        name: "音频",
        category: "music",
        path: "/main/music",
      },
      {
        icon: "image",
        name: "图片",
        category: "image",
        path: "/main/image",
      },
      {
        icon: "doc",
        name: "文档",
        category: "doc",
        path: "/main/doc",
      },
      {
        icon: "more",
        name: "其他",
        category: "others",
        path: "/main/others",
      },
    ],
  },
  {
    path: "/myshare",
    icon: "share",
    name: "分享",
    menuCode: "share",
    allShow: true,
    children: [
      {
        name: "分享记录",
        path: "/myshare",
      },
    ],
  },
  {
    path: "/recycle",
    icon: "del",
    name: "回收站",
    menuCode: "recycle",
    tips: "回收站为你保存10天内剩余的文件",
    allShow: true,
    children: [
      {
        name: "删除的文件",
        path: "/recycle",
      },
    ],
  },
  {
    path: "/settings/fileList",
    icon: "settings",
    name: "设置",
    menuCode: "settings",
    allShow: true,
    children: [
      {
        name: "用户文件",
        path: "/settings/fileList",
      },
      {
        name: "用户管理",
        path: "/settings/userList",
      },
      {
        name: "系统设置",
        path: "/settings/sysSetting",
      },
    ],
  },
];

export const subMenus = {
  main: [
    {
      icon: "all",
      name: "全部",
      category: "al1",
      path: "/main/all",
    },
    {
      icon: "video",
      name: "视频",
      category: "video",
      path: "/main/video",
    },
    {
      icon: "music",
      name: "音频",
      category: "music",
      path: "/main/music",
    },
    {
      icon: "image",
      name: "图片",
      category: "image",
      path: "/main/image",
    },
    {
      icon: "doc",
      name: "文档",
      category: "doc",
      path: "/main/doc",
    },
    {
      icon: "more",
      name: "其他",
      category: "others",
      path: "/main/others",
    },
  ],
  share: [
    {
      name: "分享记录",
      path: "/myshare",
    },
  ],
  recycle: [
    {
      name: "删除的文件",
      path: "/recycle",
    },
  ],
  settings: [
    {
      name: "用户文件",
      path: "/settings/fileList",
    },
    {
      name: "用户管理",
      path: "/settings/userList",
    },
    {
      name: "系统设置",
      path: "/settings/sysSetting",
    },
  ]
}

