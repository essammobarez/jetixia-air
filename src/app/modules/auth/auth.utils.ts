import jwt from "jsonwebtoken";

export const createToken = (
  payload: any,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret);
};







