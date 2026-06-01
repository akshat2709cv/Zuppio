const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const usersFile = path.join(__dirname, "..", "data", "users.json");
const keyLength = 64;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "Password must include at least one letter and one number.";
  }
  return "";
}

async function ensureUserFile() {
  await fs.mkdir(path.dirname(usersFile), { recursive: true });
  try {
    await fs.access(usersFile);
  } catch (_error) {
    await fs.writeFile(usersFile, "[]\n", "utf8");
  }
}

async function readUsers() {
  await ensureUserFile();
  const raw = await fs.readFile(usersFile, "utf8");
  try {
    const users = JSON.parse(raw);
    return Array.isArray(users) ? users : [];
  } catch (_error) {
    return [];
  }
}

async function writeUsers(users) {
  await ensureUserFile();
  await fs.writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, keyLength);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function verifyPassword(password, passwordHash) {
  const parts = String(passwordHash || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const [, salt, storedHash] = parts;
  const candidate = await scrypt(String(password || ""), salt, keyLength);
  const stored = Buffer.from(storedHash, "hex");
  if (stored.length !== candidate.length) return false;

  return crypto.timingSafeEqual(stored, candidate);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const users = await readUsers();
  return users.find((user) => user.email === normalizedEmail) || null;
}

async function findUserById(id) {
  const users = await readUsers();
  return users.find((user) => user.id === id) || null;
}

async function createUser({ name, email, password }) {
  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);
  const passwordError = validatePassword(password);

  if (normalizedName.length < 2) {
    const error = new Error("Please enter your full name.");
    error.code = "INVALID_NAME";
    throw error;
  }

  if (!isValidEmail(normalizedEmail)) {
    const error = new Error("Please enter a valid email address.");
    error.code = "INVALID_EMAIL";
    throw error;
  }

  if (passwordError) {
    const error = new Error(passwordError);
    error.code = "WEAK_PASSWORD";
    throw error;
  }

  const users = await readUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    const error = new Error("An account already exists with this email.");
    error.code = "EMAIL_EXISTS";
    throw error;
  }

  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: await hashPassword(String(password)),
    createdAt: now,
    updatedAt: now
  };

  users.push(user);
  await writeUsers(users);
  return user;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  normalizeEmail,
  publicUser,
  validatePassword,
  verifyPassword
};
