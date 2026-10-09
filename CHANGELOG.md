# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.60] - 2026-10-09

### Added

- A topic explanation can walk through the book: each step tells a part, then shows
  the one book page it rests on with the passage underlined or outlined, and the
  next step comes with a button. A question carries this as `sayfa` blocks in
  `anlatim`.

## [0.7.59] - 2026-10-09

### Added

- A button under the source and the K key turn the in-question book page on and
  off during a session, without a trip to the settings.

## [0.7.58] - 2026-10-09

### Added

- A setting opens the book page by itself under the solution, inside the question
  instead of a separate window, so there is nothing to close.
- The book window closes with a swipe or drag that starts anywhere outside the
  page, and with a tap on the dimmed edge.

## [0.7.57] - 2026-10-09

### Changed

- "Soruyu İşaretle" opens a small window with two choices: save the question for
  later, or call it faulty, which asks for a short note first. The question bank
  shows which is which.

## [0.7.56] - 2026-10-09

### Added

- A chapter card with partly understood questions gets a "Solve Partly Known"
  button that starts a session with only those, without waiting for their due date.

### Changed

- A question without choices says "Cevabı Göster" on its button and in the key
  hints, and its bonus badge no longer mentions choices.

## [0.7.55] - 2026-10-09

### Added

- After the right answer, "Explain Wrong Choices" shows why each remaining choice
  is wrong, not only the ones that were picked.
- Questions can carry an optional topic explanation (`anlatim`); when one is
  present an "Explain" button opens it on the question. The guide sample carries
  one on its first question.
- The library opens with "Continue Where You Left Off", which resumes the chapter
  studied last.

### Changed

- Modules in the library are listed by last use instead of by name.
- The highlight in the book viewer blinks for one second; the setting for its
  length is gone.

## [0.7.54] - 2026-10-08

### Changed

- A chapter whose questions are all retired moves to the end of the chapter list.
- The session counter counts down the questions left instead of counting up.
- Cards show how many questions are retired and how many are partly understood,
  as in "35 Retired / 5 Partly"; the session summary lists the partly understood
  ones too. Those come back in later sessions.

## [0.7.53] - 2026-10-08

### Fixed

- In a small desktop window the four tabs in the top bar no longer overlap; the
  version label and the size control step aside to make room.
- Theme names in Settings are no longer split in the middle of a word, and every
  theme tile has the same height.

## [0.7.52] - 2026-10-08

### Added

- Settings has a theme picker with 36 themes, dark and light. Text colours are
  adjusted so every theme stays readable.
- Modules and chapters can be reordered from the card menu with "Move Up" and
  "Move Down"; the order is remembered.
- On a phone the book turns with a swipe left or right, or a tap on either edge,
  so the previous page is as easy to reach as the next.

### Changed

- When a new version is out the update window opens once at launch with two
  buttons, "Update" and "Later"; the separate download choices are gone.

## [0.7.51] - 2026-10-07

### Changed

- Chapters you have studied are listed first, the most recently studied on top.

### Fixed

- The question text no longer loses its last letters on iPhone, iPad and Safari; the
  typing effect is off there.

## [0.7.50] - 2026-10-07

### Added

- A goal can now be a number of questions a day as well as a finish date, and the
  span takes any length in days, weeks or months.
- "Remove Sample Modules" replaces the install button while the samples are installed.

### Changed

- The goal button opens a dialog in place instead of jumping to the Goals tab.
- Installing the sample modules asks for confirmation first.
- Number fields in Settings save when you leave the field, so a value such as 20 can be typed.
- On a phone the question bank opens a question with one tap and shows it full width.

### Fixed

- Enter no longer confirms a dialog while Cancel is focused, and a confirmed action cannot run twice.
- The Android back button closes an open dialog, picture or bank question before leaving the screen.
- Tab stays inside an open dialog.
- A fast double press in a session no longer sends an answer, grade or flag twice.
- Dates follow the app language.

## [0.7.49] - 2026-10-07

### Added

- A chapter can be reset on its own from its card menu; the other chapters of the
  module keep their scores and review plan.

### Fixed

- The "you are up to date" message shown after tapping the version now has an outline
  and a solid background instead of floating as bare text.

## [0.7.48] - 2026-10-07

### Fixed

- Saying you know the answer on an open-ended question now opens the solution instead of
  leaving an empty screen with nothing to press.

### Changed

- Word cards no longer show a source box under the solution.

## [0.7.47] - 2026-10-07

### Changed

- Installing a module counts the questions while it checks and syncs them, so a large
  package no longer looks stuck at one percentage.

## [0.7.46] - 2026-10-07

### Fixed

- The web app starts the new version on the first load after a release instead of
  showing the old one once more from the browser cache.

## [0.7.45] - 2026-10-07

### Fixed

- On a phone the whole screen no longer slides off the right edge once the update
  badge appears in the title bar; the badge now takes the place of the version label.
- An app installed from Google Play announces an update only when Play itself offers
  it, so the notice no longer points at a version the store does not have yet.

## [0.7.44] - 2026-10-07

### Changed

- A package that ships no book no longer shows the open-book button or a page number
  under the source quote; only the source name is shown.

### Fixed

- A long source name wraps inside the source box instead of running off the screen.

## [0.7.43] - 2026-10-07

### Changed

- Book view: the mark on the page appears at once, without waiting for the page to load,
  and the view jumps straight to it instead of scrolling.
- The mark is purple, filled and ringed, and its blink starts fully visible.

## [0.7.42] - 2026-10-06

### Fixed

- Marking questions: after the answer, the picture carries only the letters and the label
  texts are listed under it, so long labels no longer cover each other on a narrow screen.

## [0.7.41] - 2026-10-05

### Added

- A goal can be set for a single chapter from its card on the chapter screen.
- The chapter screen shows the module goal at the top and each chapter goal on its card:
  today's count, a percentage and a progress bar.

## [0.7.40] - 2026-10-05

### Fixed

- Installing a newer copy of a module refreshes its cover and chapter pictures at once; the
  old pictures no longer stay until a restart.

## [0.7.39] - 2026-10-05

### Fixed

- Desktop: installing a module over an older copy no longer fails with `EPERM` when Windows
  holds one of the old folders for a moment; removal retries and leftover empty folders are
  reused.
- A long path inside a message wraps instead of running out of its box.

## [0.7.38] - 2026-10-05

### Changed

- Goals: each module shows its six periods as buttons, each with the questions a day it
  means. Press one to choose it, press the chosen one again to remove the goal.
- Goals: the explanation, reminder and module panels share one width.

### Fixed

- A tall module cover is shown whole; its bottom edge is no longer trimmed.

## [0.7.37] - 2026-10-05

### Fixed

- In the browser version a reload could bring back the previous release, so switching the
  language made the new top bar menu vanish. A waiting update now takes over on the next
  page load instead of waiting for every tab to close.

## [0.7.36] - 2026-10-05

### Added

- On the phone and in the browser the top bar has a three-dot menu with interface size,
  language, Support and the Teknesyum link, which the desktop title bar already showed.

## [0.7.35] - 2026-10-05

### Changed

- Every button, label and short status line is written in title case, in both languages.
- The update status in Settings is a framed note; "up to date" and "ready" are green,
  an error is red.

## [0.7.34] - 2026-10-05

### Added

- Goal reminders on Android. Permission is asked only when you press Turn On Notifications,
  never at startup. The 19:00 reminder is scheduled ahead, so it arrives with the app closed.

### Changed

- Ending a session no longer asks for confirmation; the summary opens at once. If no
  question was graded, the app returns straight to the library.

### Fixed

- In the solution view the text and its table share one left edge; right-to-left solutions
  are centred as one column.

## [0.7.33] - 2026-10-05

### Added

- The Goals tab opens with a plain explanation of how goals work.
- A reminder for daily goals: once a goal is set, Turn On Notifications asks for permission
  and a notification arrives after 19:00 on days the goal is not done, while the app is
  open or running in the background. Desktop and browser only for now.
- A question may end with its own closing question paragraph; it is shown under the text.

### Changed

- The Goal button on a module card opens the Goals tab.
- Card and goal labels are capitalised.
- Covers keep their own shape, so a full portrait book cover is shown whole.

### Fixed

- Right-to-left question text is centred in the whole card, not in a narrow column.

## [0.7.32] - 2026-10-05

### Added

- A Goals tab next to Library. It lists every module with today's count against the daily
  goal, the days left, the end date and the questions remaining, and lets you set, change
  or remove the goal there.

### Fixed

- A goal no longer counts one day too many: a one-month goal starts at 30 days left, not 31.

## [0.7.31] - 2026-10-05

### Added

- A Goal button on each module card. Pick how long you give yourself (1 week to 3 years);
  the menu shows what each choice means per day, and the card then shows today's count
  against the daily goal, for example 40/150. The goal counts retired questions.
- "Retired" is explained: hovering the progress line says what it means, and the
  introduction text says it too.

### Changed

- Installing a newer version of a module no longer asks; it just updates. Going back to
  an older version still asks. The "Update module" menu entry is gone.
- Cover thumbnails are square, so the whole picture shows instead of a narrow strip.
- Card wording is plainer and each fact has its own short line: "Due today", "Unseen",
  "In review". The large number is gone.
- The progress bar spans the full card, starting under the cover.
- List view is redesigned: small cover, title, today's line and goal, a thin progress
  bar, the percent and Start.

## [0.7.30] - 2026-10-05

### Changed

- Library and chapter cards are redesigned. The cover is no longer a background: it sits
  in its own column on the left and all text is on plain black, so nothing needs a
  backing. A card without a cover shows the initials of its name in the same place.
- The title is one line and is cut with an ellipsis when it does not fit; hover shows
  the full name.
- One number leads the card: how many questions are due today. New and learning counts
  share one small line, tags are plain text, and the retired percent moved down to label
  the progress bar it belongs to.
- The menu button sits on the left of the card foot, Mixed and Start session on the right.

## [0.7.29] - 2026-10-05

### Changed

- Cover cards: the black boxes are much smaller. A title that wraps gets one tight box
  per line instead of one large rectangle, counters and the question count use the same
  slim padding as the tags, and the percent is set at the title's size.

## [0.7.28] - 2026-10-05

### Changed

- Cover cards: the shape that hugged each letter is gone. Title, percent, tags, counters
  and the question count now sit in plain black boxes with the same border and corners
  as the menu and Mixed buttons, so text and buttons read as one system. The buttons
  have their boxes back and Start session is filled again.

## [0.7.27] - 2026-10-05

### Changed

- Cover cards: the black backing keeps 6 px from every letter (was 4 px).
- Cover cards: the menu, Mixed and Start session buttons use the same backing as the text:
  no box of their own, a black shape with a blue outline around the label.
- Card counters are capitalised: "0 Due Today", "44 New", "45 Questions".

## [0.7.26] - 2026-10-05

### Changed

- Cover cards: the black backing now keeps a fixed distance of at least 4 px from every
  letter, measured from the glyphs themselves instead of estimated with a blur. Gaps
  between words and between title lines are filled, so each item is one smooth shape,
  and counter rows sit slightly further apart so the shapes still never touch.

## [0.7.25] - 2026-10-05

### Changed

- Cover cards: every piece of text (title, percent, each tag, each counter) has its own
  narrow black backing with a blue outline again, and no backing touches its neighbour.
  The merged shape from 0.7.24 is gone.

## [0.7.24] - 2026-10-05

### Changed

- The title, tags and counters of a cover card now share one black shape with
  one blue outline. Before, each piece drew its own and the outlines crossed
  where pieces sat close together. The shape is also rounder.

## [0.7.23] - 2026-10-05

### Changed

- The black shape behind text on a cover card has a thin blue outline along
  its outer edge.

## [0.7.22] - 2026-10-05

### Changed

- The desktop app looks for a new version every minute, quietly: no "checking"
  flicker, one small request, and the full updater is only asked when the small
  manifest says there is something it cannot apply itself. A release reaches a
  running app within about a minute and restarts it, outside a session.

## [0.7.21] - 2026-10-05

### Changed

- The desktop app looks for a new version whenever its window gets focus (at
  most once a minute) and every 10 minutes, so a fresh release arrives without
  clicking the version label.

## [0.7.20] - 2026-10-05

### Changed

- The black shape behind text on a cover card is wider and rounder, and its
  edge fades over a few pixels instead of ending in a hard line.

## [0.7.19] - 2026-10-05

### Changed

- The backing behind text on a cover card is one flat, deep black shape with a
  smooth rounded edge that follows the letters. The 0.7.18 version was made of
  stacked soft shadows and showed overlapping layers.

## [0.7.18] - 2026-10-04

### Changed

- Answer choices have no outline at rest. The outline appears under the mouse,
  while a choice is pressed, and on keyboard focus; right and wrong answers
  keep their coloured outline.
- The dark backing behind text on a cover card is now a smooth, soft-edged
  shape. The 0.7.17 version was built from hard copies of the letters and
  looked dotted around curves.
- With automatic updates on, the desktop app restarts itself once an update has
  downloaded, instead of waiting for a click. It never does so in the middle of
  a session; it waits until you leave it. It also looks for a new version every
  30 minutes instead of every 4 hours.

## [0.7.17] - 2026-10-04

### Added

- A module can declare its book right-to-left (`source.sagdanSola`). The book
  view then opens like a mushaf: the lower page on the right, pages turn from
  the left, and the arrow keys swap (left arrow goes forward).
- A question can carry the boxes of its answer on the page
  (`source.isaretler`). The book view frames them and scrolls to the first one.
  The memorisation builder computes them from the verse markers in the mushaf
  PDF, so "See in the Qur'an" now shows which line the answer is on. The box is
  narrowed by word position and can be off by a word or two.

### Changed

- Text on a cover card is now backed by a solid dark shape that follows the
  letters, instead of the rectangular plates of 0.7.16. Cards without a cover
  and the list view keep their plain look.

## [0.7.16] - 2026-10-04

### Added

- A browser version at <https://teknesyum.github.io/Quizloop/>. It runs on an
  iPhone or iPad without a store: open it in Safari and choose _Add to Home
  Screen_. It works offline after the first visit, imports `.qlmod` files and
  keeps progress in that browser. It has no in-app update check; a new version
  is picked up the next time the page is opened online. One tab at a time.

### Changed

- Text on a cover card now sits on one flat dark plate everywhere: title,
  percentage, tags, counters and the "Mixed" and "⋯" buttons share the same
  tone, replacing the soft glow behind some and the box behind others.

## [0.7.15] - 2026-10-04

### Added

- Installing a module that is already in the library at a different version
  now asks first: "Version 1.0.1 → 2.0.0". The installed module is untouched
  until you agree, and cancelling leaves it as it was. An older file asks
  whether to roll back instead. The same question appears for a picked file,
  a dropped file, a double-clicked file and on Android.

## [0.7.14] - 2026-10-04

### Changed

- Android looks for a new version once, a few seconds after it starts. When
  one exists the update badge appears, and its link opens the Google Play
  listing for a Play install or the GitHub release page for an APK install.
  The privacy policy describes the new check.
- Tags on cover cards lose their blue outline and sit on a darker backing.

### Fixed

- "You are up to date" and update errors from the version button were hidden
  behind the page on every screen except the Library. They now show on top
  everywhere.

### Added

- `quizforge hafizlik` writes the review round (dönüş) of every segment, and
  whether it sits at the start, middle or end of that round, into the solution
  and into each wrong-choice note. Chapters stay the thirty juz. The package now carries the mushaf pages, so the
  source button opens the printed page.

## [0.7.13] - 2026-10-04

### Changed

- Headings are written in Title Case, every word capitalised, in Turkish and
  English: screen and section headings, dialog titles, the introduction and
  progress titles. A test keeps new headings to the same rule.
- The dark halo behind text and icons on cover cards is wider, so text stays
  readable over busier covers.
- Tables sit centred in both the question and the solution, with tighter rows.
  A narrow table longer than eight rows continues in a second and third column
  beside the first instead of running down the page; on a narrow screen the
  parts wrap below each other.
- Sample modules follow the heading rule: the guide is 1.0.2, general knowledge
  1.0.1.

## [0.7.12] - 2026-10-04

### Changed

- "Install the sample modules" leaves the Library after its first use and stays
  in the About section of Settings. It returns to the Library whenever the
  library is empty.

### Fixed

- On a phone the card menu no longer opens off the left edge of the screen.
- On a phone the introduction and other dialogs sit above the bottom tab bar, so
  their buttons are no longer covered, and the introduction opens at its title
  instead of scrolled to the end.

## [0.7.11] - 2026-10-04

### Added

- A one-time introduction on first launch explains what a module is, how to add
  one, how a session works and where your data stays. It reopens from "How does
  it work?" in the Library and from the About section in Settings.
- Two sample modules replace the old one: "QuizLoop Rehberi" teaches the app by
  quizzing you on it, and "Genel Kültür: Kolaydan Zora" asks original general
  knowledge questions in easy, medium and hard chapters. Both are text only.

### Changed

- Library buttons say what they do: "Add a module file", "Install from a folder"
  and "Install the sample modules", each with a tooltip. The empty library text
  explains what a `.qlmod` file is.
- Sample modules now live in `resources/ornek/`, generated by `npm run ornek`, so
  they update without the installer.

## [0.7.10] - 2026-10-04

### Changed

- Text on a module card with a cover image now carries a dark halo around each
  letter, so titles, the version tag and the counts stay readable on a light cover.
- Every build output now lands under `dist/`: `dist/desktop/`, `dist/android/` and
  `dist/modules/` replace the separate `dist-android/` and `dist-modules/` folders.

## [0.7.9] - 2026-10-04

### Added

- Clicking the percentage in the title bar opens a slider for the interface
  size, with a reset button. The control itself is narrower.

### Changed

- Updates on Windows no longer run the installer. The app downloads a small
  code bundle (about 3 MB instead of the full setup), checks it and switches to
  it on the next start, or at once from the update badge. The installer is
  for the first install, and for the rare release that changes Electron or a
  native dependency. If a bundle fails to start twice, the app goes back to
  the installed code. This release still arrives through the installer; the
  ones after it do not.

## [0.7.8] - 2026-10-04

### Added

- A module card has an "Update module" action: pick the newer `.qlmod`
  package and it replaces the installed one.

### Changed

- Module cards show two buttons, "Mixed" and "Start session". Question bank,
  update, reset and remove moved into a "More actions" menu, which the list
  view has too.

## [0.7.7] - 2026-10-04

### Fixed

- The interface size control in the title bar is drawn in the theme: 0.7.5
  shipped it with a broken style rule and it showed as plain system buttons.
  The buttons now read "−" and "+".

## [0.7.6] - 2026-10-04

### Changed

- Installing an update on Windows no longer shows the setup window: the app
  closes, updates and reopens on its own.

### Fixed

- The update panel has its background, border and padding again, so the
  screen behind it no longer shows through.

### Added

- Right-to-left text. Arabic paragraphs, list items and table cells are laid out
  right to left, set in Scheherazade New and centred in the question and the
  solution.
- `quizforge hafizlik` builds a Qur'an memorisation module on your own machine:
  one question per pause-mark segment, thirty chapters by juz, with the verse
  translation and a word-by-word table in the solution. The text and the
  translation are downloaded locally and never enter the repository.

## [0.7.5] - 2026-10-04

### Added

- The desktop title bar has an interface size control: smaller, larger, and the
  percentage, which resets to 100% when clicked. On Android the same setting
  stays in Settings, now named "Interface size".

### Changed

- A release tag no longer uploads the Android build to Google Play. The new
  `Play` workflow uploads a chosen tag to the closed test when it is started
  by hand.

## [0.7.4] - 2026-10-04

### Changed

- The installed Windows app updates itself: it downloads a new version in the
  background, installs it when the app closes, and looks again every four
  hours while it stays open. The update badge still installs at once.
  Settings has a switch to turn the silent update off.

## [0.7.3] - 2026-10-04

### Changed

- One module package for every platform. `quizforge paket` always splits the
  book into chapter PDFs and the desktop app opens the book from them; the
  `--android` flag and the `-android.qlmod` file are gone. Packages that carry
  the whole book still open on the desktop.

## [0.7.2] - 2026-10-04

### Added

- Library and chapter screens switch between cards and a compact list. The
  choice is remembered.
- In the book on Android, two fingers also drag the zoomed page.

### Changed

- On Android the title bar and the bottom tab bar are thinner.
- On first launch the interface follows the device language: Turkish on a Turkish
  device, English otherwise. A language chosen in the title bar still wins.

### Fixed

- The Android launcher shows the QuizLoop icon instead of the Capacitor one.
- On Android the screen no longer slides under the title bar: the bars counted
  the status bar and gesture area twice.
- A desktop package opened on Android says to install the `-android` package
  instead of reporting a missing file.

## [0.7.1] - 2026-10-02

### Changed

- The Android application id is `com.teknesyum.QuizLoop`. An APK installed from
  0.7.0 does not update in place: export a transfer package, uninstall it and
  install 0.7.1.
- The title bar follows teknesyum-ui 0.34.0: logo, two-part name and version on
  the left; update badge, language switch, support and Teknesyum on the right.
- The interface can switch between Turkish and English.

## [0.7.0] - 2026-10-02

### Added

- An Android app, built with Capacitor on the same screens and the same core
  as the desktop app. It keeps progress in a native SQLite database, imports
  a `.qlmod` package from the system file picker without copying it through
  the WebView, and opens the source book one chapter at a time.
- Phone layout: bottom tab bar, single-column screens, larger touch targets,
  safe-area insets, pinch zoom in the book and a back button that steps from
  the session to the chapters to the library.
- `quizforge paket --android` splits the book into chapter PDFs.
- Android checks GitHub for a newer release and backs up its database before
  a migration.
- Settings links to the source code, and the repository has a privacy policy.
- The release workflow also builds a signed APK and an Android App Bundle.

### Changed

- The app is shown as QuizLoop.
- Platform-free logic moved to `src/core`, shared by both shells.
- New cards are written in batches, and the startup sync skips modules whose
  `module.json` has not changed.

### Fixed

- The font size setting is saved.
- Finishing a session on its last question shows the summary instead of the
  empty screen.

## [0.6.0] - 2026-10-02

### Added

- A "Mixed" button on each module card and a "Mixed from all topics" button
  on the chapter screen start a session drawn from every chapter.
- The module version is shown on the chapter screen.
- The book viewer zooms with Ctrl + mouse wheel, from 100% to 400%.
- `quizforge secenek` measures, exports and applies choice rewrites so the
  correct answer is no longer given away by being the longest choice.

### Changed

- Question text types in place without reflowing: a word no longer jumps to
  the next line halfway through.
- Tables and figures sit centred above the question, tables are narrower and
  cells wrap at a readable width.
- The session uses more of the screen on wide displays and stays anchored to
  the top instead of jumping between short and long questions.
- Choice letters read as "A)" instead of boxed keys.
- Chapter covers show the whole picture under an even tint.
- A correct answer moves straight to the next question, with a short cross
  fade between questions.
- The book opens about three times faster, reopens almost at once and renders
  sharp at any zoom.
- The startup database check is faster.

### Removed

- The difficulty label on questions.
- Installing a `.qlmod` package no longer moves the package file to the
  Recycle Bin.

## [0.5.1] - 2026-10-01

### Added

- The title bar shows the app version. Clicking it checks for an update and
  says when you are already on the latest one.
- A found update opens an update panel with download, install and cancel
  steps and a progress bar.

## [0.5.0] - 2026-10-01

### Added

- Long jobs show a progress dialog: installing and removing a module, and
  exporting or importing a transfer package. It names the current step and
  counts files as they move.
- `quizforge paket` embeds the source book PDF in the `.qlmod` under
  `kaynak/`, so an installed module finds its book without asking for it.

### Changed

- File copies and removals run in parallel and no longer block the app.
  Removing a large module drops from about 17 s to under a second.
- Chapter and cover images on library cards are easier to see.

## [0.4.2] - 2026-10-01

### Changed

- Module titles on library cards are one step larger.

## [0.4.1] - 2026-10-01

### Changed

- Installing a `.qlmod` package by pick, drop or double-click now moves the
  package file to the recycle bin once the module is in place. A package on a
  USB stick, memory card, external or network drive is left where it is. The
  install message says which happened.
- Module tags are shown in Title Case on library cards; they stay lowercase in
  `module.json`.
- The Teknesyum Base manifest names the Windows setup asset and install method,
  so Base never picks another file from the release.

## [0.4.0] - 2026-10-01

### Added

- Single-file module packages (`.qlmod`). Install one with **Pick module file**, by dropping it
  on the library, or by double-clicking it once Quizloop is installed.
- Modules carry tags (`tags` in `module.json`), shown as badges on the library card.
- quizforge `paket` wraps a built module and its tags into `dist-modules/<id>-<version>.qlmod`.

### Changed

- Quizloop runs as a single instance; opening a package while it runs installs it in the open window.

## [0.3.2] - 2026-10-01

### Fixed

- Library card buttons wrap instead of overflowing the card on narrow windows or large text.
- A module without a cover no longer shows a broken image on its card.

## [0.3.1] - 2026-10-01

### Changed

- quizforge `verify` now rejects a stem or solution image without alt text.
- `kaynak_kes.py` keeps only the densest cluster of matched words, so source excerpts are
  cropped to the quoted passage instead of whole columns.

### Fixed

- `kaynak_kes.py` falls back to window matching for quotes that are split across columns or
  pages, and skips blank crops instead of saving them.

## [0.3.0] - 2026-10-01

### Added

- Three visual question types: a stem that carries a structured table, a
  figure with one label masked, and marking questions whose choices are boxes
  on the figure (decision 0008).
- Solutions can carry a figure or a table next to the text.
- Figure lightbox with zoom, drag and fit; it opens fitted to the view.
- quizforge: `--tur tablo` and `--tur etiket` lanes, table OCR and label
  extraction (`py/tablo.py`, `py/etiket.py`), `geri-al` for rolling back a lane.
- quizforge verify checks table cells against the source page and its OCR,
  masked labels leaking into the stem, and duplicate marking choices. Tables
  checked by eye against the page image are recorded in `build/tablo/onay.json`.

### Changed

- Tables without a real header row render without an empty `<thead>`.

## [0.2.2] - 2026-09-30

### Changed

- Interface moved to teknesyum-ui 0.32.0; the title bar drops the site link.
- Open and save dialogs no longer create a hidden window when no parent
  window is found.

## [0.2.1] - 2026-09-27

### Changed

- New program icon, generated from the theme tokens (`npm run icon:gen`): a
  review ring around a brain, replacing the default Electron icon.

## [0.2.0] - 2026-09-27

### Changed

- Interface moved to teknesyum-ui 0.26.0: the owner's refreshed palette
  (primary, accent and support colours) and a 4 px corner radius.
- Every screen audited at 100, 125 and 150% scale in the packaged app with no
  contrast or target-size errors; dialog and toast titles, the source line,
  the bank row ellipsis and the sticky grade row were fixed along the way.

## [0.1.0] - 2026-09-23

### Added

- Repository skeleton: README, agent guide, ignore rules, documentation layout.
- Architecture plan (`docs/PLAN.md`) covering the scheduler, module format, progress
  database, application boundaries and the module generation pipeline.
- Prior-art survey across 17 topics (`docs/taramalar/`).
- Decision log (`docs/kararlar/`), starting with the stack and licence stance.
- Application skeleton: Electron 42 with electron-vite, React 19, TypeScript,
  and the security trio (context isolation, sandbox, no node integration) on
  every window. The preload bridge exposes a single typed `window.quizloop`.
- Progress database: SQLite through kysely and better-sqlite3, WAL mode,
  append-only migrations, integrity check on open.
- Scheduler: FSRS-6 via `ts-fsrs`. Self-assessment blends with objective
  signals — answering before revealing the options, and wrong picks — to
  produce the rating. Retirement writes a timestamp; rows are never deleted.
- Session engine: relearn queue, concept burying for the rest of the day, a
  configurable day boundary, and one review log row per graded answer.
- Module format: read-only JSON packages validated by zod, with JSON Schema
  generated from the same source, content hashing for change detection and a
  root-scoped `quizloop://` protocol for assets.
- Screens: library, session, summary and settings, keyboard-driven, styled
  against the teknesyum-ui token set.
- `modules/_ornek/` — a five-question sample module, every wrong option
  explained and every record carrying its source quote.
- Continuous integration on Linux, macOS and Windows; a tag-triggered release
  workflow that drafts a GitHub release from the three packaged builds.

### Changed

- Distribution licence is AGPL-3.0-or-later, replacing MIT. Copyleft
  dependencies are now allowed; see `docs/kararlar/0003-lisans-agpl.md`.
