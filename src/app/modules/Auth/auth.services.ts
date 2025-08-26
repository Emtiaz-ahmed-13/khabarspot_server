import bcrypt from "bcrypt";
import { Secret } from "jsonwebtoken";
import prisma from "../../shared/prisma";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { findUserByEmail } from "../../../helpers/userHelpers";
import ApiError from "../../errors/ApiError";
import { TLogin, TRegister } from "./auth.interface";

const SALT_ROUNDS = 10;

const login = async (payload: TLogin) => {
  const { email, password } = payload;
  const user = await findUserByEmail(email);
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid Credentials.");
  const { password: _, ...userWithoutPassword } = user;
  const accessToken = jwtHelpers.generateToken(
    userWithoutPassword,
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );
  const refreshToken = jwtHelpers.generateToken(
    userWithoutPassword,
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );
  return {
    accessToken,
    refreshToken,
    userWithoutPassword,
  };
};

const register = async (payload: TRegister) => {
  const { name, email, password } = payload;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, "Email already in use");
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "USER" as any },
  });
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const registerAdmin = async (payload: TRegister) => {
  const { name, email, password } = payload;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, "Email already in use");
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "ADMIN" as any },
  });
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const AuthServices = {
  login,
  register,
  registerAdmin,
};
