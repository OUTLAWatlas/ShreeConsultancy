'use client';

import { createContext, useContext } from 'react';

// The signed-in user's role, read once in the protected layout and shared
// with every client component below it. Saves threading a `role` prop
// through four levels of board → card → drawer.
//
// This is a UX affordance only — hiding a button is not access control.
// The real enforcement is server-side, in backend's requireWriteAccess
// middleware, which rejects any mutation from a viewer regardless of what
// the UI shows.
const RoleContext = createContext('admin');

export function RoleProvider({ role, children }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}

export function useCanWrite() {
  return useContext(RoleContext) === 'admin';
}
