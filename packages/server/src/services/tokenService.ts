import jwt from "jsonwebtoken";
import { config } from "../config/config";
import type { UserDocument } from "../models/User";

export interface AccessTokenPayload {
  id: string;
  email: string;
}

export interface RefreshTokenPayload {
  id: string;
  tokenVersion: number;
}

export function signAccessToken(user: Pick<UserDocument, "_id" | "email">): string {
  const payload: AccessTokenPayload = { id: user._id.toString(), email: user.email };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessExpiresIn } as jwt.SignOptions);
}

export function signRefreshToken(user: Pick<UserDocument, "_id" | "refreshTokenVersion">): string {
  const payload: RefreshTokenPayload = { id: user._id.toString(), tokenVersion: user.refreshTokenVersion };
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwtRefreshSecret) as RefreshTokenPayload;
}

export function issueTokenPair(user: UserDocument): { accessToken: string; refreshToken: string } {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}
