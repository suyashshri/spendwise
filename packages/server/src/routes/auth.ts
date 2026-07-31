import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User";
import { config } from "../config/config";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { registerSchema, loginSchema, googleAuthSchema, refreshSchema } from "../utils/schemas";
import { issueTokenPair, verifyRefreshToken, signAccessToken } from "../services/tokenService";

const router = Router();
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body as { email: string; password: string; name: string };

    const existing = await User.findOne({ email });
    if (existing) {
      throw AppError.conflict("An account with this email already exists", "EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, name, passwordHash, authProvider: "email" });

    const tokens = issueTokenPair(user);
    res.status(201).json({ user: user.toJSON(), ...tokens });
  })
);

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const tokens = issueTokenPair(user);
    res.json({ user: user.toJSON(), ...tokens });
  })
);

router.post(
  "/google",
  validateBody(googleAuthSchema),
  asyncHandler(async (req, res) => {
    if (!googleClient) {
      throw AppError.internal("Google OAuth is not configured on this server", "GOOGLE_OAUTH_DISABLED");
    }

    const { idToken } = req.body as { idToken: string };
    const ticket = await googleClient.verifyIdToken({ idToken, audience: config.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw AppError.unauthorized("Invalid Google token", "INVALID_GOOGLE_TOKEN");
    }

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name ?? payload.email,
        authProvider: "google",
        googleId: payload.sub,
      });
    }

    const tokens = issueTokenPair(user);
    res.json({ user: user.toJSON(), ...tokens });
  })
);

router.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken: string };

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshTokenVersion !== decoded.tokenVersion) {
      throw AppError.unauthorized("Refresh token has been revoked", "REFRESH_TOKEN_REVOKED");
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    res.json({ user: user.toJSON() });
  })
);

export default router;
