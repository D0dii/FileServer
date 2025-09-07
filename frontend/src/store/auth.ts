import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Atom to store the user's entered password in localStorage
export const storedPasswordAtom = atomWithStorage("userPassword", "");

// Atom for the secret key input
export const secretKeyAtom = atom("");

// Atom for authentication error messages
export const authErrorAtom = atom("");

// Derived atom to check if user is authenticated by comparing stored password with env
export const isAuthenticatedAtom = atom((get) => {
  const storedPassword = get(storedPasswordAtom);
  const correctPassword = import.meta.env.VITE_SECRET_PASSWORD || "password";
  return storedPassword === correctPassword && storedPassword !== "";
});

// Derived atom for authentication action
export const authenticateAtom = atom(null, (get, set, secretKey: string) => {
  const correctPassword = import.meta.env.VITE_SECRET_PASSWORD || "password";

  if (secretKey === correctPassword) {
    set(storedPasswordAtom, secretKey);
    set(authErrorAtom, "");
    set(secretKeyAtom, "");
    return true;
  } else {
    set(authErrorAtom, "Invalid secret key");
    return false;
  }
});

// Atom for logout action
export const logoutAtom = atom(null, (get, set) => {
  set(storedPasswordAtom, "");
  set(secretKeyAtom, "");
  set(authErrorAtom, "");
});
