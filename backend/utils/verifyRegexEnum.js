// 正则

// 校验IPv4地址
exports.ipv4Pattern = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
// 校验手机号
const phonePattern = /^1\d{10}$/;
// 校验空字符串
const emptyPatter = /^\s*$/;
// 校验邮箱

// 校验密码强度
exports.passwordPattern = /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*_]{8,}$/;
// 校验整数
// 校验正整数（不包含0）
// 校验日期


