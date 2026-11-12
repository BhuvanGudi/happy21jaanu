# Our story — timed birthday experience

A plain HTML/CSS/JavaScript site. No build step is required. The earlier `config/story.js` file is retained as an unused draft; the current page loads `config/schedule.js` instead.

## Current features

- Chapters unlock by schedule using India Standard Time (IST), regardless of the visitor's local time zone.
- The opening chapter is scheduled for 00:00 on 13 November.
- A new chapter is added when its release time arrives; earlier chapters remain available to revisit.
- A toast announces a new release without forcing the visitor to leave the section they are reading.
- A countdown shows the next release.
- The final letter unlocks at 00:00 on 14 November and supports a translucent background photograph.
- A preview mode lets you test releases without waiting for the real time.
- The existing photo/video effects CSS is retained; hourly media can be added in the schedule configuration.

## Where to edit later

| What | Where |
|---|---|
| Release date, hourly chapters, birthday chapter at 12:00, post-departure chapters, final background opacity | `config/schedule.js` |
| Final letter text, heading, signature, optional fallback photo | `config/letter.js` |
| Photos and videos | put files in `media/`, then reference them from `config/schedule.js` |
| Visual styling | `css/style.css` |
| Timed unlock behavior | `js/main.js` |

Each hourly chapter can later include a `message`, media items, short notes, or poems. Example configuration shape:

```js
{
  hour: 1,
  title: "A memory from us",
  kind: "memory",
  message: "A longer reflection about this moment.",
  items: [
    { file: "01-photo.jpg", caption: "A little note about this photo." },
    { file: "02-video.mp4", caption: "The moment on video.", controls: true },
    { type: "note", title: "A random message", text: "Something just for her." },
    { type: "poem", title: "A little poem", text: "Four or eight lines go here." }
  ]
}
```

For multiple photos in one item, use `files: ["a.jpg", "b.jpg"]` instead of `file`.

## Preview mode

Use a local server, then open one of these URLs:

- `http://localhost:8000/?preview=1&hour=0` — opening chapter
- `http://localhost:8000/?preview=1&hour=12` — through the birthday-creations chapter
- `http://localhost:8000/?preview=1&hour=22` — through the post-departure chapters
- `http://localhost:8000/?preview=1&hour=24` — includes the final letter

A preview selector appears on screen to switch between releases. Before publishing, set `allowPreview: false` in `config/schedule.js`; merely removing the query from your own URL is not enough.

## Run locally

From this folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Important privacy limitation

This version uses client-side scheduling on a static website. It controls when chapters appear in the normal visitor experience, but it cannot securely hide future content from someone who inspects the source or changes the URL/device. Preview mode is enabled for development; set `allowPreview: false` before publishing. For genuinely private, tamper-resistant timed releases, the content must be stored behind a server/backend that releases it only when allowed. Do not upload sensitive unreleased content until that privacy choice is settled.
