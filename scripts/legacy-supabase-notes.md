# Legacy Supabase schema notes

This Payload remake intentionally does not mount Payload directly on top of the old Supabase tables.

Reason: Payload manages its own Drizzle/Postgres schema. If Payload collections overlap with existing tables such as `blog_posts`, `projects`, `categories`, or `users`, Payload development push/migrations can try to alter or drop objects that were created outside Payload.

This project avoids that by setting `dbName` on every Payload collection/global:

- `payload_users`
- `payload_media`
- `payload_categories`
- `payload_blog_posts`
- `payload_projects`
- `payload_share_events`
- `payload_site_settings`
- `payload_autoshare_status`

If you want to migrate old rows, export from Supabase first and then import through the Payload REST API or Admin UI.

Old queue objects are not recreated. Autoshare state is represented only by the `autoshare-status` global and historical records by the `share-events` collection.
