import dotenv from "dotenv"

dotenv.config();

export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;

export const PORT = process.env.PORT || 3001;