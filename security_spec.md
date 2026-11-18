# Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. Only the known document `/siteContent/main` is publicly readable via `get` (no public `list` scraping).
2. Writes (`create`, `update`, `delete`) to `/siteContent/main` and `/admins/{adminUid}` are strictly restricted to verified administrators (`request.auth.token.email == "taroret134@gmail.com" && request.auth.token.email_verified == true` or registered in `/admins/{uid}`).
3. All incoming `SiteContent` payloads must strictly match required keys (`hasAll` + `hasOnly`), enforce string `.size()` limits, enforce `updatedByUid == request.auth.uid`, enforce `updatedAt == request.time`, and enforce bounded array sizes (`heroPillars.size() <= 6`, `galleryItems.size() <= 50`, `approachItems.size() <= 10`).
4. Video URLs must begin with `http://` or `https://`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated `create`/`update` on `/siteContent/main`.
2. Authenticated non-admin (`other@example.com`, `email_verified: true`) attempting `update` on `/siteContent/main`.
3. Spoofed admin (`taroret134@gmail.com`, `email_verified: false`) attempting `update` on `/siteContent/main`.
4. Admin writing a ghost field `isVerified: true` (shadow update test).
5. Admin writing `updatedByUid: "someone_else"` instead of `request.auth.uid`.
6. Admin writing a client-forged `updatedAt` timestamp instead of `request.time`.
7. Admin writing `brandName` as a number (`123`) or exceeding 80 chars.
8. Admin writing `videoUrl: "javascript:alert(1)"` (fails regex `^https?://.+`).
9. Admin writing `galleryItems` with > 50 elements (Denial of Wallet array guard).
10. Admin writing `galleryItems: ["not-a-map"]` (fails `galleryItems[0] is map` guard).
11. Unauthenticated or non-admin user attempting `list` on `/siteContent` or `get` on `/admins/{uid}`.
12. Poisoned document ID `contentId` exceeding 128 chars or containing invalid characters on `/siteContent/{contentId}`.
