# Firestore episode catalogue

The static site stores episode metadata in Cloud Firestore and embeds the actual video from YouTube. The frontend does not upload or store video files in this repository.

## Episode document

Create documents in the `episodes` collection with this shape:

```text
showId: "morning-rise"
seasonNumber: 1
episodeNumber: 1
title: "Community News Roundup"
description: "The latest news from Bweyale and Kiryandongo."
videoProvider: "youtube"
videoId: "YOUR_11_CHARACTER_YOUTUBE_ID"
status: "published"
publishedAt: Firestore Timestamp
```

Open `episodes.html` to browse published records. The page reads at most 50 records, filters by `status == published`, and orders by `publishedAt` descending. Firestore may ask you to create a composite index for `status` and `publishedAt`; use the link in the browser console to create it.

The existing `content.js` Firebase configuration is reused. It is safe for a browser app only when Firestore and Authentication Security Rules protect writes.

## Firestore rules

Deploy the rules in `firestore.rules` from the repository root using the Firebase CLI:

```sh
firebase deploy --only firestore:rules
```

The Firebase project must be selected for this repository and the CLI must be signed in with an account authorized to deploy rules. The rules allow admin writes only for the verified email listed below; make sure it matches the Firebase Authentication admin account before deploying.

Current admin email configured in the repository:

- bwetv.ug@gmail.com
