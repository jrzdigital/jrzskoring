import { UserAccount } from "../types";
import { signInWithPopup } from "firebase/auth";
import {
  app,
  auth,
  db,
  googleProvider,
  ref,
  get,
  sanitizeForFirebase,
  assertOnlineForFirebase,
  isCloudConnectionReady,
  getLocalUsersSnapshot,
  saveLocalUsersSnapshot,
  saveUserToFirebase,
  updateUserInFirebase,
  deleteUserFromFirebase
} from "./firebase";

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr-admin-1",
    username: "superadmin",
    name: "Ketua Dewan & Pertandingan",
    fullName: "Ketua Dewan & Pertandingan",
    role: "superadmin",
    arenaAccess: "SEMUA",
    isApproved: true,
    status: "APPROVED",
    isIpLocked: false
  },
  {
    id: "usr-sekretaris-1",
    username: "sekretaris",
    name: "Sekretaris Pertandingan",
    fullName: "Sekretaris Pertandingan",
    role: "sekretaris",
    arenaAccess: "SEMUA",
    isApproved: true,
    status: "APPROVED",
    isIpLocked: false
  },
  {
    id: "usr-dewan-1",
    username: "dewan",
    name: "Ketua Pertandingan Arena A",
    fullName: "Ketua Pertandingan Arena A",
    role: "dewan",
    arenaAccess: "ARENA A",
    isApproved: true,
    status: "APPROVED",
    isIpLocked: false
  },
  {
    id: "usr-juri-1",
    username: "juri1",
    name: "Juri 1 Arena A",
    fullName: "Juri 1 Arena A",
    role: "juri",
    arenaAccess: "ARENA A",
    isApproved: true,
    status: "APPROVED",
    isIpLocked: false
  },
  {
    id: "usr-operator-1",
    username: "operator",
    name: "Operator Tanding",
    fullName: "Operator Tanding",
    role: "operator",
    arenaAccess: "ARENA A",
    isApproved: true,
    status: "APPROVED",
    isIpLocked: false
  },
  {
    id: "usr-monitor-1",
    username: "monitor",
    name: "Layar Scoreboard Arena",
    fullName: "Layar Scoreboard Arena",
    role: "monitor",
    arenaAccess: "ARENA A",
    isApproved: true,
    status: "APPROVED",
    isIpLocked: false
  }
];

const STORAGE_KEY = "ipsi_current_user";

function safeKey(raw: string): string {
  return String(raw || `usr-${Date.now()}`).replace(/[.#$/[\]]/g, "_");
}

class AuthService {
  private currentUser: UserAccount | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch {
          this.currentUser = DEFAULT_USERS[0];
        }
      } else {
        this.currentUser = DEFAULT_USERS[0];
      }
    }
  }

  getFirebaseApp() {
    return app;
  }

  getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  setCurrentUser(user: UserAccount | null): void {
    this.currentUser = user;
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      window.dispatchEvent(new Event("ipsi_auth_user_changed"));
    }
  }

  saveSession(user: UserAccount | null): void {
    this.setCurrentUser(user);
  }

  saveUserToStorage(user: UserAccount | null): void {
    this.setCurrentUser(user);
  }

  logout(): void {
    this.setCurrentUser(null);
  }

  async getAllUsers(): Promise<UserAccount[]> {
    const cached = getLocalUsersSnapshot();
    if (!isCloudConnectionReady()) {
      return cached && cached.length > 0 ? cached : [...DEFAULT_USERS];
    }

    try {
      const snap = await Promise.race([
        get(ref(db, "users")),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Firebase users read timeout")), 4000))
      ]);
      if (snap.exists()) {
        const val = snap.val();
        const list = Array.isArray(val)
          ? val.filter(Boolean)
          : (Object.values(val || {}).filter(Boolean) as UserAccount[]);
        if (list.length > 0) {
          saveLocalUsersSnapshot(list);
          return list;
        }
      }

      // Seed default users to Firebase RTDB if node is empty
      for (const def of DEFAULT_USERS) {
        await saveUserToFirebase(def);
      }
      saveLocalUsersSnapshot([...DEFAULT_USERS]);
      return [...DEFAULT_USERS];
    } catch (err) {
      console.warn("Gagal mengambil daftar pengguna dari Firebase, memakai cache lokal:", err);
      return cached && cached.length > 0 ? cached : [...DEFAULT_USERS];
    }
  }

  async login(
    username: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: UserAccount;
    error?: string;
    ipMismatch?: boolean;
    boundIp?: string;
    currentIp?: string;
    username?: string;
    userId?: string;
    fullName?: string;
  }> {
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: "Username dan kata sandi wajib diisi." };
    }

    // Built-in Super Admin check
    if (cleanUser === "jakaoktorian" && cleanPass === "Abuyaku21*") {
      const sa: UserAccount = {
        id: "superadmin-jaka",
        username: "jakaoktorian",
        name: "Jaka Oktorian (Super Admin)",
        fullName: "Jaka Oktorian (Super Admin)",
        role: "superadmin",
        arenaAccess: "SEMUA",
        isApproved: true,
        status: "APPROVED",
        isIpLocked: false
      };
      this.setCurrentUser(sa);
      return { success: true, user: sa };
    }

    const users = await this.getAllUsers();
    const found = users.find(
      (u) =>
        (u.username || "").toLowerCase() === cleanUser ||
        (u.email || "").toLowerCase() === cleanUser
    );

    if (!found) {
      return { success: false, error: "Akun tidak ditemukan di database." };
    }

    if (found.password && found.password !== cleanPass) {
      return { success: false, error: "Kata sandi salah." };
    }

    const approved = found.isApproved !== false && found.status !== "PENDING" && found.status !== "REJECTED";
    if (!approved) {
      return {
        success: false,
        error: "Akun Anda sedang menunggu persetujuan Super Admin."
      };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  }

  async register(payload: Partial<UserAccount> & { username?: string; password?: string; fullName?: string; email?: string }): Promise<{
    success: boolean;
    user?: UserAccount;
    message?: string;
    error?: string;
  }> {
    const cleanUsername = (payload.username || payload.email?.split("@")[0] || `user_${Date.now()}`).trim();
    const users = await this.getAllUsers();

    const duplicate = users.find(
      (u) =>
        (u.username || "").toLowerCase() === cleanUsername.toLowerCase() ||
        (payload.email && (u.email || "").toLowerCase() === payload.email.toLowerCase())
    );
    if (duplicate) {
      return { success: false, error: "Username atau Email sudah terdaftar." };
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      name: payload.fullName || payload.name || cleanUsername,
      fullName: payload.fullName || payload.name || cleanUsername,
      email: payload.email || "",
      password: payload.password || "",
      role: (payload.role as any) || "juri",
      arenaAccess: payload.arenaAccess || "SEMUA",
      isApproved: payload.isApproved ?? false,
      status: payload.isApproved ? "APPROVED" : "PENDING",
      isIpLocked: false,
      createdAt: Date.now()
    };

    await saveUserToFirebase(newUser);
    return {
      success: true,
      user: newUser,
      message: isCloudConnectionReady()
        ? "Pendaftaran berhasil disimpan ke Firebase dan menunggu aktivasi Admin."
        : "Pendaftaran disimpan lokal dan akan otomatis tersinkron ke Firebase saat koneksi stabil."
    };
  }

  async createUser(payload: Partial<UserAccount>): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const cleanUsername = (payload.username || `usr_${Date.now()}`).trim();
    const id = payload.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newUser: UserAccount = {
      id,
      username: cleanUsername,
      name: payload.fullName || payload.name || cleanUsername,
      fullName: payload.fullName || payload.name || cleanUsername,
      email: payload.email || "",
      password: payload.password || "123456",
      role: (payload.role as any) || "juri",
      arenaAccess: payload.arenaAccess || "SEMUA",
      isApproved: payload.isApproved ?? true,
      status: payload.status || "APPROVED",
      isIpLocked: Boolean(payload.isIpLocked),
      boundIp: payload.boundIp || "",
      createdAt: Date.now()
    };
    await saveUserToFirebase(newUser);
    return { success: true, user: newUser };
  }

  async createUserByAdmin(payload: Partial<UserAccount>): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    return this.createUser({ ...payload, isApproved: true, status: "APPROVED" });
  }

  async updateUser(payload: Partial<UserAccount> & { id?: string }): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const id = payload.id || payload.username;
    if (!id) return { success: false, error: "ID pengguna diperlukan." };
    const key = safeKey(id);
    const updates = sanitizeForFirebase({
      ...payload,
      ...(payload.fullName && !payload.name ? { name: payload.fullName } : {}),
      ...(payload.name && !payload.fullName ? { fullName: payload.name } : {})
    });
    await updateUserInFirebase(key, updates);

    if (this.currentUser && (this.currentUser.id === id || this.currentUser.username === payload.username)) {
      this.setCurrentUser({ ...this.currentUser, ...updates } as UserAccount);
    }
    return { success: true, user: updates as UserAccount };
  }

  async deleteUser(userId: string, username?: string): Promise<{ success: boolean; error?: string }> {
    const id = userId || username;
    if (!id) return { success: false, error: "ID pengguna diperlukan." };
    await deleteUserFromFirebase(safeKey(id));
    return { success: true };
  }

  async resetPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    await updateUserInFirebase(safeKey(userId), { password: newPassword });
    return { success: true };
  }

  async approveUser(userIdOrUsername: string, approvedBy: string): Promise<{ success: boolean; error?: string }> {
    const users = await this.getAllUsers();
    const target = users.find((u) => u.id === userIdOrUsername || u.username === userIdOrUsername);
    const key = safeKey(target?.id || userIdOrUsername);
    await updateUserInFirebase(key, {
      isApproved: true,
      status: "APPROVED",
      approvedBy,
      approvedAt: Date.now()
    });
    return { success: true };
  }

  async signInWithGoogle(): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    assertOnlineForFirebase();
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const email = fbUser.email || "";
      const users = await this.getAllUsers();
      const existing = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
      if (existing) {
        this.setCurrentUser(existing);
        return { success: true, user: existing };
      }
      const created = await this.createUser({
        id: fbUser.uid,
        username: email.split("@")[0] || `google_${Date.now()}`,
        name: fbUser.displayName || email,
        fullName: fbUser.displayName || email,
        email,
        avatarUrl: fbUser.photoURL || "",
        role: "juri",
        isApproved: true,
        status: "APPROVED"
      });
      if (created.user) {
        this.setCurrentUser(created.user);
        return { success: true, user: created.user };
      }
      return { success: false, error: "Gagal menyimpan akun Google ke Firebase." };
    } catch (err: any) {
      return { success: false, error: err?.message || "Gagal login menggunakan Google Auth." };
    }
  }

  async signInWithGmail(email: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: "Alamat Gmail tidak valid." };
    const users = await this.getAllUsers();
    const existing = users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
    if (existing) {
      this.setCurrentUser(existing);
      return { success: true, user: existing };
    }
    const reg = await this.register({
      username: cleanEmail.split("@")[0],
      email: cleanEmail,
      fullName: cleanEmail.split("@")[0],
      role: "juri",
      isApproved: true
    });
    if (reg.user) {
      this.setCurrentUser(reg.user);
      return { success: true, user: reg.user };
    }
    return { success: false, error: reg.error || "Gagal masuk dengan Gmail." };
  }
}

export const authService = new AuthService();
