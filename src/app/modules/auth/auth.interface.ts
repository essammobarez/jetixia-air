export type TLoginUser = {
  email: string;
  password: string;
};

export type TLoginAdminUser = {
  userId: string;
  password: string;
};

export type TAuthUser = {
  userId: string;
  email: string;
  role: string;
  adminUserId?: string; // For admin users
};
