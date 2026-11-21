# Syllaba iOS (Swift 6 + SwiftUI)

Native iOS 17+ app package connected to `https://syllaba.xyz/api/*`, featuring:
- Multi-agent syllabus extraction, 15-30m micro-task planning, and OpenAlex curation
- Yellow (`#FACC15`), Ink Black (`#111111`), and White theme
- 6 languages (`EN`, `ID`, `ZH`, `AR`, `ES`, `PT`), SwiftData offline persistence (`PersistedRoadmap`), History, Account, and Help

## Cara Build / Run di MacBook (Xcode)

### Opsi A (Paling Cepat via XcodeGen)
```bash
cd apps/ios-swift
brew install xcodegen   # lewati jika sudah terpasang
xcodegen generate
open Syllaba.xcodeproj
```
Lalu di Xcode: pilih **Simulator (iPhone 16 Pro / iOS 17+)** atau iPhone asli -> tekan **Cmd + R** (Run) atau **Product -> Archive** untuk ekspor `.ipa`.

### Opsi B (Tanpa XcodeGen, Langsung di Xcode)
1. Buka Xcode -> **File -> New -> Project -> iOS App** (SwiftUI, iOS 17+).
2. **File -> Add Package Dependencies -> Add Local...** -> pilih folder `apps/ios-swift`.
3. Centang `SyllabaApp` dan `SyllabaCore`, lalu ganti file `*App.swift` dengan isi [SyllabaMobileApp.swift](App/SyllabaMobileApp.swift).
4. Tekan **Cmd + R** untuk Run atau **Product -> Archive** untuk build `.ipa`.

### Menjalankan Unit Test Swift (`SyllabaIOSTests`)
```bash
cd apps/ios-swift
swift test
```
