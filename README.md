# Voxply-android

Android client for the [Voxply](https://github.com/YOUR_ORG/Voxply) platform.
A mobile-first UI sharing the same hub API as the desktop client, packaged
as a native Android APK via Tauri.

Part of the Voxply project — see the
[docs repo](https://github.com/YOUR_ORG/Voxply) for architecture,
API spec, and roadmap.

## Technologies

- **Tauri 2** (Android target) — cross-platform native wrapper
- **React** + **TypeScript** — UI layer
- **Vite** — build tooling
- **Rust** — native layer compiled to `aarch64` and `armv7`
- **Gradle** / **Android Gradle Plugin 8** — Android build system
- **Web Crypto API** — Ed25519 identity (no native crypto dep)

## Repository structure

```
voxply-android/
  src/
    identity/            TypeScript Ed25519 + BIP39 (Web Crypto API)
    platform-android/    Android-specific storage adapter
    App.tsx              Root component
    styles.css
  src-tauri/             Tauri Android configuration and Rust glue
  SIGNING.md             Release keystore setup instructions
```

## Quick start

Requires [Node 20+](https://nodejs.org), the
[Tauri prerequisites](https://tauri.app/start/prerequisites/), and
Android SDK + NDK (see [install-android.md](https://github.com/YOUR_ORG/Voxply/blob/main/docs/install-android.md)).

```bash
cd voxply-android
npm install
cargo tauri android dev
```

## Building a release APK

```bash
cd voxply-android
cargo tauri android build --target aarch64 --target armv7
```

See [`SIGNING.md`](voxply-android/SIGNING.md) for keystore configuration.

## CI

The GitHub Actions workflow builds and signs APKs on every push to `main`
and on version tags. Requires `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_PASSWORD` repository secrets
for signed builds.

## Built with AI assistance

This project was built with substantial help from
[Claude](https://claude.ai) (Anthropic's AI assistant). The product
owner directs architecture, features, and tradeoffs; Claude drafts
most of the code, tests, and documentation, which is then reviewed,
adjusted, and accepted.

Calling this out for transparency — it's not a fully hand-written
codebase, and pretending otherwise wouldn't be honest.

## License

[GNU Affero General Public License v3.0](LICENSE).
