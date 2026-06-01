import instance from "./instance";

// 회원가입 API
export const signin = async (form) => {
  await instance.post("/users/signin", form);
};

export const login = async (form) => {
  const response = await instance.post("/users/login", form);
  return response.data;
};

export const googleLogin = async (token) => {
  const response = await instance.post("/users/google-login", { token });
  return response.data;
};

export const logout = async () => {
  const response = await instance.post("/users/logout");
  return response.data;
};

// 내 정보 조회 API
export const getMe = async () => {
  const response = await instance.get("/users/me");
  return response.data;
};

// 이메일 인증 코드 발송 API
export const sendEmailCode = async (email) => {
  const response = await instance.post("/users/send-email-code", { email });
  return response.data;
};

// 이메일 인증 코드 확인 API
export const verifyEmailCode = async (email, code) => {
  const response = await instance.post("/users/verify-email-code", {
    email,
    code,
  });
  return response.data;
};

// 임시 비밀번호 발송 API
export const sendTempPassword = async (email) => {
  const response = await instance.post("/users/send-temp-password", { email });
  return response.data;
};

// 알림 조회 API
export const getNotifications = async (userId) => {
  const response = await instance.get(`/users/${userId}/notifications`);
  return response.data;
};

// 알림 읽음 처리 API
export const markNotificationRead = async (userId, notifId) => {
  const response = await instance.put(
    `/users/${userId}/notifications/${notifId}/read`,
  );
  return response.data;
};

// 모든 알림 읽음 처리 API
export const markAllNotificationsRead = async (userId) => {
  const response = await instance.put(
    `/users/${userId}/notifications/read-all`,
  );
  return response.data;
};

// 프로필 수정 API (이미지 포함 시 FormData 사용)
export const updateProfile = async (userId, data) => {
  const response = await instance.put(`/users/profile/${userId}`, data);
  return response.data;
};

// 프로필 테두리 변경 API
export const updateBorder = async (userId, border) => {
  const response = await instance.put(`/users/border/${userId}`, { border });
  return response.data;
};

// 로그인 기록 조회 API
export const getLoginHistory = async (userId) => {
  const response = await instance.get(`/users/login-history/${userId}`);
  return response.data;
};

// 비밀번호 변경 API
export const changePassword = async (data) => {
  const response = await instance.post("/users/change-password", data);
  return response.data;
};
