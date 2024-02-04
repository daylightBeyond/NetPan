export const menus = [
  {
    icon: "cloude",
    name: "首页",
    path: "/home/all",
    menuCode: "home",
    allShow: true,
    children: [
      {
        icon: "all",
        name: "全部",
        category: "al1",
        path: "/home/all",
      },
      {
        icon: "video",
        name: "视频",
        category: "video",
        path: "/home/video",
      },
      {
        icon: "music",
        name: "音频",
        category: "music",
        path: "/home/music",
      },
      {
        icon: "image",
        name: "图片",
        category: "image",
        path: "/home/image",
      },
      {
        icon: "doc",
        name: "文档",
        category: "doc",
        path: "/home/doc",
      },
      {
        icon: "more",
        name: "其他",
        category: "others",
        path: "/home/others",
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
  // {
  //   path: "/settings/fileList",
  //   icon: "settings",
  //   name: "设置",
  //   menuCode: "settings",
  //   allShow: true,
  //   children: [
  //     {
  //       name: "用户文件",
  //       path: "/settings/fileList",
  //     },
  //     {
  //       name: "用户管理",
  //       path: "/settings/userList",
  //     },
  //     {
  //       name: "系统设置",
  //       path: "/settings/sysSetting",
  //     },
  //   ],
  // },
];

export const subMenus = {
  home: [
    {
      icon: "all",
      name: "全部",
      category: "al1",
      path: "/home/all",
    },
    {
      icon: "video",
      name: "视频",
      category: "video",
      path: "/home/video",
    },
    {
      icon: "music",
      name: "音频",
      category: "music",
      path: "/home/music",
    },
    {
      icon: "image",
      name: "图片",
      category: "image",
      path: "/home/image",
    },
    {
      icon: "doc",
      name: "文档",
      category: "doc",
      path: "/home/doc",
    },
    {
      icon: "more",
      name: "其他",
      category: "others",
      path: "/home/others",
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

