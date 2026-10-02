# QuizLoop Privacy Policy

Effective date: 2026-10-02

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

## What the app does not do

- No account, sign-in or registration.
- No advertising and no advertising identifier.
- No analytics, crash reporting, tracking or profiling libraries.
- No access to your contacts, location, camera, microphone, photos or
  phone identifiers.
- No selling or sharing of personal data, because none is collected.

## Network use

The app works fully offline. It contacts the network in exactly one case: when
you press **Check for updates** in Settings. The app then requests
`https://api.github.com/repos/Teknesyum/Quizloop/releases/latest` to compare the
latest release tag with the installed version. It sends no information about
you or your study data. As with any web request, GitHub receives your IP
address and standard request headers and handles them under the
[GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
The app never checks for updates on its own.

If you open the update notice or the source-code link, your browser opens a
GitHub page. That visit is governed by GitHub's policy, not this one.

The desktop versions behave the same way: the only network request is the
update check you start yourself.

## Android permissions

- `INTERNET`: used only for the update check described above.
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
the app to delete everything the app stored. If you used Android backup, deleting
that backup is done in your Google account settings.

## Children

QuizLoop is a general-purpose study tool and is not directed at children under
13. It collects no personal information from anyone.

## Changes

If this policy changes, the new version will be published in this repository
with a new effective date.

## Contact

Open an issue at <https://github.com/Teknesyum/Quizloop/issues>.
