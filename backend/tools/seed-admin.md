# Seeding the first user

There's no self-service signup. To create the first (admin) login:

1. Open the Apps Script project in the editor (script.google.com), open `Auth.js`.
2. In the function dropdown at the top, select `hashPasswordForSeed`.
3. Temporarily edit the last line of the file to call it directly, e.g. add:
   `hashPasswordForSeed('choose-a-strong-password');`
4. Click **Run**. Open **View → Logs** (or the Execution log) to see the printed `salt` and `passwordHash`.
5. Remove the temporary call you added in step 3.
6. In the `Users` sheet tab, add a row:
   `username | passwordHash | salt | displayName | role | active | createdAt`
   Paste the `passwordHash` and `salt` values from the log, set `role` to `admin`, `active` to `TRUE`, and `createdAt` to the current ISO timestamp.
7. Repeat for any additional users up front (role `member` for non-admins), or have an admin log in later and add more users the same way.
