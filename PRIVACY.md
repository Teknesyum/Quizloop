# QuizLoop Privacy Policy

Effective date: 2026-10-18

QuizLoop is a free, open-source (AGPL-3.0-or-later) spaced-repetition quiz app
for Android, Windows, macOS and Linux, published by Teknesyum. This policy
describes what the app does with data. Short version: **your study data stays on
your device, there is no account, no advertising and no analytics.**

Türkçe sürüm: [docs/PRIVACY.tr.md](docs/PRIVACY.tr.md)

## What the app stores

All of the following is stored locally on your device and is never sent to us:

- Your study progress: answers, scores, review schedule, retired questions and
  session history.
- Questions you flag, and the optional note you write on a flag.
- Your settings (day start hour, text speed, font size and similar).
- The question modules you install: the bundled sample module, and any
  `.qlmod` package you import yourself, including any source book PDF inside it.

QuizLoop does not ship content. You choose which module to import. Files you
select are read by the app on the device and are not uploaded anywhere.

The browser version at `https://teknesyum.github.io/Quizloop/` keeps the same
data in that browser's own storage on your device (its private file system,
cache storage and local storage). Nothing is sent to the site; it only serves
the app's files.

## What the app does not do

- No account, sign-in or registration.
- No advertising and no advertising identifier.
- No analytics, crash reporting, tracking or profiling libraries.
- No access to your contacts, location, camera, microphone, photos or
  phone identifiers.
- No selling or sharing of personal data. The only thing that ever leaves the
  device about you is what you type into the **Contact Us** form yourself.

## Network use

The app works fully offline. It contacts the network only to look for a new
version of itself, and when you send the **Contact Us** form. A check requests
`https://api.github.com/repos/Teknesyum/Quizloop/releases/latest`, or on Windows
the small `kod.json` file attached to the latest release, and compares that
version with the installed one. It sends no information about you or your study
data. As with any web request, GitHub receives your IP address and standard
request headers and handles them under the
[GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).

When the check happens depends on the platform:

- **Android**: once, a few seconds after the app starts, and whenever you press
  **Check for updates** in Settings. If a newer version exists the app shows a
  notice with a link: the Google Play listing when the app was installed from
  Google Play, the GitHub release page otherwise. The app never downloads or
  installs an update by itself; Google Play does that under Google's policy.
- **Windows, macOS and Linux**: a few seconds after the app starts and then
  every four hours while it stays open, and whenever you press **Check for
  updates**.

On Windows the app can also download the update from the same GitHub release.
With **Silent update** on, which is the default, the download starts by itself
and is applied when the app closes. With it off, the app only shows a badge and
downloads when you ask. On macOS and Linux the app only tells you a new version
exists.

If you open the update notice or the source-code link, your browser opens a
GitHub page. That visit is governed by GitHub's policy, not this one.

## Contact Us form

The **Contact Us** form sends only what you put in it, and only when you press
**Send**:

- your note;
- a way to reach you, if you write one (optional);
- one image you pick, if you add one (optional), shrunk on the device first;
- the app version, the platform (Windows, macOS, Linux, Android or Web) and the
  interface language.

It goes to `https://api.github.com` and is stored as an issue in a private
GitHub repository that only the developer can read. It is used only to answer
you and to fix or improve the app, is never sold or shared, and you can ask for
it to be deleted through the same form. GitHub handles the request under its
privacy statement linked above.

## Android permissions

- `INTERNET`: used only for the update check and the Contact Us form described
  above.
- The app does not request storage, location, camera, microphone or contacts
  permissions. Modules are imported through Android's system file picker, which
  gives the app access only to the file you choose.

## Backups

On Android, the system may include QuizLoop's data in Google's automatic
backup (Android Auto Backup) and in device-to-device transfer. The backup
contains the progress database and settings. Installed modules and the app's own
local database copies in `backups/` are excluded. This backup is handled by
Google and your Google account under Google's terms, and you can switch it off in
Android's system settings. We do not receive or have access to it.

## Data retention and deletion

Because the data lives only on your device, you control it. Use **Reset** on a
module to clear its progress, **Remove module** to delete a module, or uninstall
the app to delete everything the app stored. In the browser version, clearing
the site's data in the browser settings, or removing the home screen icon on
an iPhone, deletes it. If you used Android backup, deleting
that backup is done in your Google account settings.

## Children

QuizLoop is a general-purpose study tool and is not directed at children under 13. It collects no personal information unless someone chooses to type it into the Contact Us form.

## Changes

If this policy changes, the new version will be published in this repository
with a new effective date.

## Contact

Use **Contact Us** inside the app, or open an issue at
<https://github.com/Teknesyum/Quizloop/issues>.
