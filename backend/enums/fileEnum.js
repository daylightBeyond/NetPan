/**
 * 文件信息的枚举
 */
// 文件类型枚举
const fileCategoryEnums = {
  VIDEO: { category: 1, code: 'video', desc: '视频' },
  MUSIC: { category: 2, code: 'music', desc: '音频' },
  IMAGE: { category: 3, code: 'image', desc: '图片' },
  DOC: { category: 4, code: 'doc', desc: '文档' },
  OTHERS: { category: 5, code: 'others', desc: '其他' },
};

// 菜单类型
const fileFolderTypeEnum = {
  FILE: { code: 0, desc: '文件' },
  FOLDER: { code: 1, desc: '目录' }
};

// 文件类型
const fileTypeEnums = {
  // 1:视频
  VIDEO: { category: fileCategoryEnums.VIDEO.code, type: 1, suffix: ['.mp4', '.avi', '.rmbv', '.mkv', '.mov'], desc: '视频' },
  MUSIC: { category: fileCategoryEnums.MUSIC.code, type: 2, suffix: ['.mp3', '.wav', '.wma', '.mp2', '.flac', '.midi', '.ra', '.ape', '.aac', '.cda'], desc: '音频' },
  IMAGE: { category: fileCategoryEnums.IMAGE.code, type: 3, suffix: ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.dds', '.psd', '.pdt', '.webp', '.xmp', '.svg'], desc: '图片' },
  PDF: { category: fileCategoryEnums.DOC.code, type: 4, suffix: ['.pdf'], desc: 'pdf' },
  WORD: { category: fileCategoryEnums.DOC.code, type: 5, suffix: ['.docx'], desc: 'word' },
  EXCEL: { category: fileCategoryEnums.DOC.code, type: 6, suffix: ['.xlsx'], desc: 'excel' },
  TXT: { category: fileCategoryEnums.DOC.code, type: 7, suffix: ['.txt'], desc: 'txt' },
  PROGRAM: { category: fileCategoryEnums.OTHERS.code, type: 8, suffix: ['.h', '.c', '.hpp', '.hxx', '.cpp', '.cc', '.c++', '.m', '.o', '.s', '.dll',
      '.java', '.class', '.js', '.ts', '.css', '.scss', '.less', '.vue', '.jsx', '.sql', '.md', '.json', '.html', '.xml'], desc: 'code' },
  ZIP: { category: fileCategoryEnums.OTHERS.code, type: 9, suffix: ['.rar', '.zip', '.7z', '.cba', '.arj', '.lzh', '.tar', '.gz', '.ace', '.uue', '.jar', '.bz', '.mpq'], desc: '压缩包' },
  OTHERS: { category: fileCategoryEnums.OTHERS.code, type: 10, suffix: [], desc: '其他' },
};

// 文件删除状态枚举
const fileDelFlagEnum = {
  DEL: { code: 0, desc: '删除' },
  RECYCLE: { code: 1, desc: '回收站' },
  USING: { code: 2, desc: '使用中' },
};

const fileTypeEnum = {
  0: '文件',
  1: '目录',
};

// 文件状态
const fileStatusEnum = {
  TRANSFER: { code: 0, desc: '转码中' },
  TRANSFER_FAIL: { code: 1, desc: '转码失败' },
  USING: { code: 2, desc: '使用中' },
};

// 上传状态
const uploadStatusEnum = {
  UPLOAD_SECONDS: { value: 'upload_seconds', desc: '秒传' },
  UPLOADING: { value: 'uploading', desc: '上传中' },
  UPLOAD_FINISH: { value: 'upload_finish', desc: '上传完成' },
};

module.exports = {
  fileCategoryEnums,
  fileFolderTypeEnum,
  fileTypeEnums,
  fileDelFlagEnum,
  fileTypeEnum,
  fileStatusEnum,
  uploadStatusEnum,
}
