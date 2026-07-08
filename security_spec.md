# Security Specification

## 1. Data Invariants
- A User profile document must have its document ID equal to the authenticated user's UID (`request.auth.uid`).
- A User profile can only be read or written by the owner (whose UID matches the document ID) or an administrator.
- School settings are publicly readable but can only be modified by administrators.

## 2. The "Dirty Dozen" Payloads (Designed to break safety rules)
1. Creating a user profile for UID "victim123" while authenticated as "attacker456".
2. Modifying school settings as an unauthenticated user.
3. Reading another user's private data profile as a standard authenticated user.
4. Setting a user role to 'admin' during registration by a self-assigned value.
5. Updating a profile with an extremely large (1MB+) name string to cause exhaustion.
6. Deleting the school settings document as a standard operator or user.
7. Injecting special characters or poison patterns in a user ID.
8. Writing to `/users/someId` without being logged in.
9. Modifying the `createdAt` timestamp after user creation.
10. Fetching lists of users without any owner constraints.
11. Modifying settings with empty, incomplete, or malformed fields.
12. Creating a user document with "email_verified" spoofed to true without a verified token.

## 3. Rules Test Runner Specification (`firestore.rules.test.ts`)
The test runner ensures that all of the above dirty payloads are securely blocked (returning `PERMISSION_DENIED`).
