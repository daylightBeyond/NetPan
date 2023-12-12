export const getToken = () => {
  return sessionStorage.getItem('token');
};

export const setToken = (token) => {
  return sessionStorage.setItem('token', token);
};

export const removeToken = () => {
  return sessionStorage.removeItem('token');
}