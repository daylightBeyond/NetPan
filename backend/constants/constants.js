const ZERO = 0;
const LENGTH_4 = 4;
const LENGTH_6 = 6;
const LENGTH_10 = 10;
const LENGTH_15 = 15;
const LENGTH_50 = 50;
const LENGTH_150 = 150;

const CHECK_CODE_KEY = 'check_code_key';
const CHECK_CODE_KEY_EMAIL = 'check_code_key_email';

// linux服务器资源存放目录
const PROJECT_FOLDER = '/app/netpan/' // 项目资源目录
const FILE_FOLDER_FILE = 'staticfile/'; // 上传的文件所在主文件夹
const FILE_FOLDER_AVATAR_NAME = 'avatar/';  // 上传的头像资源存放目录

const UPLOAD_TEMP_FOLDER = '/app/netpan/temp_uploads/'; // 前端上传到后端时存放的临时文件目录
const USER_FILE_FOLDER = '/app/netpan/file/'; // 用户上传的文件最终存储的目录

const AVATAR_SUFFIX = '.jpg';
const IMAGE_PNG_SUFFIX = '.png';
const AVATAR_DEFAULT = 'default_avatar.png';
const DEFAULT_AVATAR_TYPE = 'image/png';

const MB = 1024 * 1024; // 1 MB
const INIT_TOTAL_SPACE = 1024; // 网盘初始的分配空间 1024 MB，用的话需要 * MB
const REDIS_KEY_EXPIRE_ONE_MIN = 60; // 60s 即 1 min
const REDIS_KEY_EXPIRE_SIX_MIN = REDIS_KEY_EXPIRE_ONE_MIN * 6; // 6 min
const REDIS_KEY_EXPIRE_THIRTY_MIN = REDIS_KEY_EXPIRE_ONE_MIN * 30; // 30 min
const REDIS_KEY_EXPIRE_DAY = REDIS_KEY_EXPIRE_ONE_MIN * 60 * 24; // 1 day
const REDIS_KEY_EXPIRE_SEVEN_DAY = REDIS_KEY_EXPIRE_ONE_MIN * 60 * 24 * 7; // 1 day


const REDIS_PROJECT = 'netpan';
const REDIS_USER_FOLDER = 'netpan:user';
const REDIS_TEMP_FOLDER = 'netpan:temp';
const REDIS_EMAIL_FOLDER = 'netpan:email';
const REDIS_KEY_DOWNLOAD = 'netpan:download';


const TS_NAME = 'index.ts';
const M3U8_NAME = 'index.m3u8';

module.exports = {
  ZERO,
  LENGTH_4,
  LENGTH_6,
  LENGTH_10,
  LENGTH_15,
  LENGTH_50,
  LENGTH_150,
  CHECK_CODE_KEY,
  CHECK_CODE_KEY_EMAIL,
  PROJECT_FOLDER,
  FILE_FOLDER_FILE,
  FILE_FOLDER_AVATAR_NAME,
  AVATAR_SUFFIX,
  IMAGE_PNG_SUFFIX,
  AVATAR_DEFAULT,
  DEFAULT_AVATAR_TYPE,
  UPLOAD_TEMP_FOLDER,
  USER_FILE_FOLDER,
  MB,
  INIT_TOTAL_SPACE,
  REDIS_KEY_EXPIRE_ONE_MIN,
  REDIS_KEY_EXPIRE_SIX_MIN,
  REDIS_KEY_EXPIRE_THIRTY_MIN,
  REDIS_KEY_EXPIRE_DAY,
  REDIS_KEY_EXPIRE_SEVEN_DAY,
  REDIS_PROJECT,
  REDIS_USER_FOLDER,
  REDIS_TEMP_FOLDER,
  REDIS_EMAIL_FOLDER,
  REDIS_KEY_DOWNLOAD,
  TS_NAME,
  M3U8_NAME,
}
