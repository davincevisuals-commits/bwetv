# BWE TV

A modern, responsive web platform for BWE TV Live streaming and community engagement.

## Features

- 📺 **Live Streaming** - Watch BWE TV live feeds
- 📅 **Schedule** - View daily programming schedule
- 🎬 **Shows** - Browse all available shows
- 👥 **Community** - Connect with viewers and join discussions
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Built with Tailwind CSS

## Pages

- **index.html** - Home page with live player
- **schedule.html** - Daily TV schedule and programming
- **shows.html** - Show catalog and details
- **community.html** - Community features and engagement
- **live-chat.html** - Dedicated live chat experience
- **about.html / privacy.html / contact.html** - Supporting information pages

## Technologies Used

- HTML5
- Tailwind CSS 2.2.19
- Video.js 7.20.3
- Responsive Design

## Project Structure

```
bwetv/
├── README.md
├── index.html
├── schedule.html
├── shows.html
├── community.html
├── .gitignore
└── video/ (media files)
```

## Getting Started

1. Clone the repository
2. Run `npm start` if you want to launch the Socket.io chat server locally
3. Open any `.html` file in your web browser
4. Navigate using the menu to explore all pages

## Android app (Capacitor)

The Android app packages the existing website pages and assets in a Capacitor WebView. Firebase data, chat, streaming, and third-party links still require an internet connection.

1. Install Node.js, JDK 21, Android Studio, and the Android SDK (API 35 or newer).
2. Install project dependencies with `npm install`.
3. Generate the Android project once with `npm run mobile:add:android`.
4. Build a debug APK with `npm run mobile:build:debug`. The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
5. To install on a connected device, run `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

The source website remains at the repository root. `npm run mobile:copy` stages its pages and runtime assets in the generated, ignored `www/` directory before each Android sync/build. For a Play Store release, configure a production signing key in Android Studio and build a signed Android App Bundle; do not distribute a debug APK as a production release.

Before release, test Firebase sign-in and chat on a physical Android device. The app uses the bundled web origin, so verify Firebase Authentication and email-action links from that origin as well as HLS playback, system back navigation, external links, and poor-network behavior.

The **Build Android APK** GitHub Actions workflow also builds the debug APK on pushes that change app or website files. Download `app-debug.apk` from the `bwetv-android-debug-apk` artifact on the completed workflow run.

## Live Streaming Setup

To connect your streaming server:
1. Replace `http://yourserverip:8080/live/streamkey.m3u8` with your actual stream URL
2. Update in `index.html` and `schedule.html`

## Chat & Firebase Notes

- The shared live chat UI expects Firebase Authentication and Realtime Database access.
- Protect production chat data with Firebase Security Rules so only allowed users can write and read the collections/paths you expose.
- Homepage live stats count active HLS playback sessions and signed-in members currently on the Community page. Publish `database.rules.json` to the `bwetv-ug` Realtime Database for presence tracking to work.

## Admin Content Studio

Sign in at `admin.html` with the verified Firebase admin account (`bwetv.ug@gmail.com`). The Content Studio adds draft/publish page editing for About, Contact, Community, and Privacy; page metadata; homepage announcements and highlight cards; broadcast schedules; stream availability; JSON backup/restore; and shows/episodes CSV import/export.

In **Settings**, add HTTPS profile URLs for Facebook, X, Instagram, YouTube, and TikTok and save them to update the homepage footer. Blank fields retain the footer's default platform links. The TikTok icon is from [Simple Icons](https://simpleicons.org/) (CC0 1.0).

Before deploying, publish the Firestore rules in `firestore.rules` (`firebase deploy --only firestore:rules`). The admin email restriction is enforced by these rules; do not loosen it to make the dashboard appear to work.

Content and metadata are delivered to site visitors by JavaScript from Firestore. This works for browser visitors, but static hosting cannot dynamically rewrite the deployed HTML head, `robots.txt`, or `sitemap.xml`; crawlers that do not execute JavaScript may not see CMS SEO changes. A future backend/rendering step is needed for reliable crawler metadata and automatic timed publishing. Image upload/cropping, chat moderation, role management, analytics, and social publishing also require separate backend or storage integrations and are not enabled by this dashboard.

## Admin Operations (free Firebase Spark plan)

The admin **Operations** tab adds team roles (editor/moderator), chat moderation (remove, mute, ban, pause chat), basic page-view analytics, image upload with crop/resize (stored in Firestore as `media:ID`, no Storage needed) and a social share composer.

Deploy the rules for these to work: `firebase deploy --only firestore:rules,database`.

Not included (need the paid Blaze plan or secret tokens): direct Facebook/Instagram/YouTube posting, Cloud Functions, Firebase Storage, pre-approval of chat messages. Analytics are unverified client counts.

Administrators, editors, and moderators can remove community posts in Operations. The Firestore rules must be deployed before this works. Role changes span Firestore and Realtime Database; if an update reports an incomplete synchronization, retry the same grant or removal.

The Content Studio JSON backup includes shows, episodes, settings, pages, page revisions, and media. It does not include Firebase Authentication accounts, roles, community posts, chat, analytics, newsletter subscriptions, or advertising inquiries. Keep separate backups of those services as appropriate. Restore merges documents and can partially complete if a batch fails.

Schedules use Uganda time (Africa/Kampala). The final program is assumed to last 90 minutes unless another program follows it.

## Advertising inquiries

The `adbooker.html` page lets potential advertisers request information about campaign formats and dates. Requests are saved in the Firestore `adBookings` collection and can be reviewed and moved through New, Contacted, Confirmed, and Declined in the admin Operations tab by verified administrators and editors. A request is not a confirmed booking; the team follows up to agree availability and pricing. Creative files are not uploaded; the form accepts an optional public HTTPS link.

Deploy `firestore.rules` (`firebase deploy --only firestore:rules`) before enabling the form. The collection allows public submissions but restricts reads and status updates to staff; only the super admin can delete requests. Add a CAPTCHA or server-side rate limiting if public form abuse becomes a concern.

## License

© 2026 BWE TV - All rights reserved

## Release signing and Firebase rules (CI)

Add these in GitHub → Settings → Secrets and variables → Actions:

- `ANDROID_KEYSTORE_BASE64` (`base64 -w0 bwetv-release.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` — then run **Build signed Android AAB** to get `app-release.aab` for the Play Console. Back up the keystore; never commit it.
- `FIREBASE_SERVICE_ACCOUNT` (service account JSON with Firebase Rules Admin / Cloud Datastore Owner access on `bwetv-ug`) — **Deploy Firebase rules** then publishes `firestore.rules` and `database.rules.json`.
