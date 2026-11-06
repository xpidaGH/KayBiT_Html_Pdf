# Multi-Platform CI/CD & Production Code-Signing Workflow (`GitHub_Actions.md`)

This guide provides a complete, production-ready **GitHub Actions** workflow (`.github/workflows/release-multiplatform.yml`) to build, code-sign, version, and distribute **KayBiT_Html_Pdf** across **macOS, iOS, Windows, Linux, and Android** simultaneously using a 3-runner Build Matrix.

---

## 1. Security First: Base64 Encoding & Secrets Management

**Never commit raw `.p12`, `.mobileprovision`, `.keystore`, `.jks`, `.pfx`, or service-account `.json` files to Git.**  
Instead, encode your binary certificates and keystores into Base64 strings locally, store them in **GitHub Repository Secrets**, and decode them into runner memory/temp directories during the build.

### Local Base64 Encoding Commands (Bash vs. PowerShell)

#### macOS / Linux (Bash)
```bash
# 1. Encode Apple Distribution Certificate (.p12)
base64 -i Certificates.p12 | pbcopy   # macOS (copies directly to clipboard)
base64 -w 0 Certificates.p12          # Linux

# 2. Encode Apple Provisioning Profile (.mobileprovision)
base64 -i AppStore_Profile.mobileprovision | pbcopy

# 3. Encode Android Release Keystore (.jks / .keystore)
base64 -i kaybit-release.keystore | pbcopy

# 4. Encode Google Play Service Account JSON
base64 -i play-store-service-account.json | pbcopy
```

#### Windows (PowerShell)
```powershell
# 1. Encode Apple Distribution Certificate (.p12)
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\Certificates.p12")) | Set-Clipboard

# 2. Encode Apple Provisioning Profile (.mobileprovision)
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\AppStore_Profile.mobileprovision")) | Set-Clipboard

# 3. Encode Android Release Keystore (.jks / .keystore)
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\kaybit-release.keystore")) | Set-Clipboard

# 4. Encode Google Play Service Account JSON
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\play-store-service-account.json")) | Set-Clipboard
```

### In-Runner Decoding (Bash vs. PowerShell)
Inside the workflow, secrets are decoded on the fly into `${{ runner.temp }}` (which is automatically wiped after the job completes):

* **Bash (`macos-latest` / `ubuntu-latest`):**
  ```bash
  echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > "${{ runner.temp }}/release.keystore"
  ```
* **PowerShell (`windows-latest`):**
  ```powershell
  [IO.File]::WriteAllBytes("${{ runner.temp }}\windows-cert.pfx", [Convert]::FromBase64String("${{ secrets.WINDOWS_CERT_BASE64 }}"))
  ```

---

## 2. Required GitHub Repository Secrets

Configure these under **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Platform | Description |
| :--- | :--- | :--- |
| `APPLE_CERTIFICATE_BASE64` | iOS / macOS | Base64-encoded `.p12` Distribution Certificate |
| `APPLE_CERTIFICATE_PASSWORD` | iOS / macOS | Password used when exporting the `.p12` file |
| `APPLE_PROVISIONING_PROFILE_BASE64` | iOS | Base64-encoded `.mobileprovision` App Store profile |
| `APPLE_TEAM_ID` | iOS / macOS | 10-character Apple Developer Team ID |
| `APPLE_BUNDLE_ID` | iOS | App Bundle Identifier (e.g., `com.kaybit.htmlpdf`) |
| `APPLE_PROFILE_NAME` | iOS | Exact name of the Provisioning Profile |
| `APPSTORE_ISSUER_ID` | iOS | App Store Connect API Issuer ID (UUID) |
| `APPSTORE_API_KEY_ID` | iOS | App Store Connect API Key ID |
| `APPSTORE_API_PRIVATE_KEY` | iOS | Contents of `AuthKey_<KEY_ID>.p8` |
| `ANDROID_KEYSTORE_BASE64` | Android | Base64-encoded `.keystore` / `.jks` file |
| `ANDROID_KEYSTORE_PASSWORD` | Android | Keystore store password |
| `ANDROID_KEY_ALIAS` | Android | Key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | Android | Key alias password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Android | Raw or Base64 JSON for Google Play Developer API |
| `WINDOWS_CERT_BASE64` *(Optional)* | Windows | Base64 `.pfx` EV/OV Code Signing Cert (bypasses SmartScreen) |
| `WINDOWS_CERT_PASSWORD` *(Optional)* | Windows | Password for `.pfx` certificate |
| `SLACK_WEBHOOK_URL` | Notifications | Incoming Slack Webhook URL |
| `DISCORD_WEBHOOK_URL` | Notifications | Discord Channel Webhook URL |
| `SMTP_SERVER` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `NOTIFY_EMAIL` | Notifications | Email alert credentials |

---

## 3. Dynamic `exportOptions.plist` for iOS App Store Distribution

Xcode's `xcodebuild -exportArchive` requires an `exportOptions.plist` file. To keep your **Team ID**, **Bundle ID**, and **Profile Name** out of your public repository, generate `exportOptions.plist` dynamically in the runner using environment variables mapped from GitHub Secrets:

### Reference `exportOptions.plist` Layout
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>${APPLE_TEAM_ID}</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>provisioningProfiles</key>
    <dict>
        <key>${APPLE_BUNDLE_ID}</key>
        <string>${APPLE_PROFILE_NAME}</string>
    </dict>
</dict>
</plist>
```

---

## 4. Complete GitHub Actions Workflow (`.github/workflows/release-multiplatform.yml`)

Save the following workflow to `.github/workflows/release-multiplatform.yml`:

```yaml
name: Multi-Platform Build, Sign & Release

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: write

env:
  APP_NAME: KayBiT_Html_Pdf
  BUILD_NUMBER: ${{ github.run_number }}

jobs:
  # ============================================================================
  # 1. PARALLEL BUILD MATRIX (macOS/iOS, Windows, Linux/Android)
  # ============================================================================
  build-matrix:
    name: Build (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for automated changelog generation

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Frontend Dependencies & Build Web Bundle
        run: |
          npm ci
          npm run build

      - name: Inject Continuous Build Number (${{ github.run_number }})
        shell: bash
        run: |
          echo "Setting continuous build integer to ${{ github.run_number }}"
          node -e '
            const fs = require("fs");
            const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
            const baseVer = (pkg.version || "1.0.0").split("+")[0];
            pkg.version = `${baseVer}+${process.env.BUILD_NUMBER}`;
            fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
          '

      # ------------------------------------------------------------------------
      # macOS & iOS RUNNER (macos-latest)
      # ------------------------------------------------------------------------
      - name: Setup Rust Toolchain (macOS Universal)
        if: runner.os == 'macOS'
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: aarch64-apple-darwin,x86_64-apple-darwin

      - name: Import Apple Code-Signing Certificates & Provisioning Profile
        if: runner.os == 'macOS'
        uses: apple-actions/import-codesign-certs@v2
        with:
          p12-file-base64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}
          p12-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

      - name: Install iOS Provisioning Profile & Generate exportOptions.plist
        if: runner.os == 'macOS'
        env:
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_BUNDLE_ID: ${{ secrets.APPLE_BUNDLE_ID }}
          APPLE_PROFILE_NAME: ${{ secrets.APPLE_PROFILE_NAME }}
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "${{ secrets.APPLE_PROVISIONING_PROFILE_BASE64 }}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/appstore.mobileprovision

          cat <<EOF > "${{ runner.temp }}/exportOptions.plist"
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
              <key>method</key>
              <string>app-store</string>
              <key>teamID</key>
              <string>${APPLE_TEAM_ID}</string>
              <key>signingStyle</key>
              <string>manual</string>
              <key>stripSwiftSymbols</key>
              <true/>
              <key>uploadSymbols</key>
              <true/>
              <key>provisioningProfiles</key>
              <dict>
                  <key>${APPLE_BUNDLE_ID}</key>
                  <string>${APPLE_PROFILE_NAME}</string>
              </dict>
          </dict>
          </plist>
          EOF

      - name: Build macOS Universal Binary (.dmg & .app) via Tauri
        if: runner.os == 'macOS'
        run: |
          npm run tauri build -- --target universal-apple-darwin

      - name: Sync Capacitor & Compile Signed iOS .ipa
        if: runner.os == 'macOS'
        env:
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_BUNDLE_ID: ${{ secrets.APPLE_BUNDLE_ID }}
          APPLE_PROFILE_NAME: ${{ secrets.APPLE_PROFILE_NAME }}
        run: |
          npx cap sync ios
          cd ios/App
          agvtool new-version -all "${{ github.run_number }}"
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath "${{ runner.temp }}/App.xcarchive" \
            DEVELOPMENT_TEAM="${APPLE_TEAM_ID}" \
            PRODUCT_BUNDLE_IDENTIFIER="${APPLE_BUNDLE_ID}" \
            PROVISIONING_PROFILE_SPECIFIER="${APPLE_PROFILE_NAME}" \
            archive

          xcodebuild -exportArchive \
            -archivePath "${{ runner.temp }}/App.xcarchive" \
            -exportOptionsPlist "${{ runner.temp }}/exportOptions.plist" \
            -exportPath "${{ runner.temp }}/ios-ipa"

      - name: Auto-Publish iOS .ipa to Apple TestFlight
        if: runner.os == 'macOS' && github.event_name == 'push'
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: ${{ runner.temp }}/ios-ipa/App.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}

      # ------------------------------------------------------------------------
      # WINDOWS RUNNER (windows-latest)
      # ------------------------------------------------------------------------
      - name: Setup Rust Toolchain & WiX/NSIS (Windows)
        if: runner.os == 'Windows'
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: x86_64-pc-windows-msvc

      - name: Decode Optional Windows Code-Signing Certificate (PowerShell)
        if: runner.os == 'Windows' && secrets.WINDOWS_CERT_BASE64 != ''
        shell: pwsh
        run: |
          # Note: Tauri outputs .msi installers natively; signing bypasses Windows SmartScreen warnings.
          $certPath = "${{ runner.temp }}\windows-cert.pfx"
          [IO.File]::WriteAllBytes($certPath, [Convert]::FromBase64String("${{ secrets.WINDOWS_CERT_BASE64 }}"))
          echo "TAURI_SIGNING_PRIVATE_KEY=$certPath" >> $env:GITHUB_ENV

      - name: Build Windows .exe & .msi Installers via Tauri
        if: runner.os == 'Windows'
        run: |
          npm run tauri build

      # ------------------------------------------------------------------------
      # LINUX & ANDROID RUNNER (ubuntu-latest)
      # ------------------------------------------------------------------------
      - name: Install Linux Desktop & PipeWire Dependencies
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            build-essential \
            curl \
            wget \
            file \
            libxdo-dev \
            libssl-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            libpipewire-0.3-dev \
            pipewire

      - name: Setup Rust Toolchain (Linux)
        if: runner.os == 'Linux'
        uses: dtolnay/rust-toolchain@stable

      - name: Build Linux .deb & .AppImage with PipeWire Support
        if: runner.os == 'Linux'
        run: |
          npm run tauri build

      - name: Setup Java & Android SDK / NDK
        if: runner.os == 'Linux'
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        if: runner.os == 'Linux'
        uses: android-actions/setup-android@v3

      - name: Build Android .apk and .aab (Version Code ${{ github.run_number }})
        if: runner.os == 'Linux'
        run: |
          npx cap sync android
          cd android
          ./gradlew assembleRelease bundleRelease \
            -Pandroid.injected.version.code=${{ github.run_number }} \
            -Pandroid.injected.version.name="1.0.${{ github.run_number }}"

      - name: Decode Keystore & Sign Android .aab
        if: runner.os == 'Linux'
        uses: r0adkll/sign-android-release@v1
        id: sign_aab
        with:
          releaseDirectory: android/app/build/outputs/bundle/release
          signingKeyBase64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          alias: ${{ secrets.ANDROID_KEY_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Auto-Publish Signed .aab to Google Play Internal Testing Track
        if: runner.os == 'Linux' && github.event_name == 'push'
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: ${{ secrets.APPLE_BUNDLE_ID }}
          releaseFiles: ${{ steps.sign_aab.outputs.signedReleaseFile }}
          track: internal
          status: completed

      # ------------------------------------------------------------------------
      # UPLOAD DESKTOP ARTIFACTS FOR GITHUB RELEASE
      # ------------------------------------------------------------------------
      - name: Upload Desktop Installers to Workflow Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: desktop-installers-${{ runner.os }}
          path: |
            src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg
            src-tauri/target/release/bundle/msi/*.msi
            src-tauri/target/release/bundle/nsis/*.exe
            src-tauri/target/release/bundle/appimage/*.AppImage
            src-tauri/target/release/bundle/deb/*.deb
            android/app/build/outputs/apk/release/*.apk

  # ============================================================================
  # 2. AUTOMATED CHANGELOG & GITHUB RELEASE PUBLISHING
  # ============================================================================
  publish-release:
    name: Publish Desktop GitHub Release
    needs: build-matrix
    if: github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Download All Desktop Artifacts
        uses: actions/download-artifact@v4
        with:
          path: release-artifacts
          merge-multiple: true

      - name: Generate Automated Changelog from Commit Messages
        id: changelog
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          if [ -z "$PREV_TAG" ]; then
            NOTES=$(git log -n 20 --pretty=format:"- %s (%h) by %an")
          else
            NOTES=$(git log ${PREV_TAG}..HEAD --pretty=format:"- %s (%h) by %an")
          fi
          echo "CHANGELOG<<EOF" >> $GITHUB_OUTPUT
          echo "## What's Changed (Build #${{ github.run_number }})" >> $GITHUB_OUTPUT
          echo "$NOTES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create GitHub Release & Attach Desktop Binaries
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v1.0.${{ github.run_number }}
          name: KayBiT_Html_Pdf v1.0.${{ github.run_number }}
          body: ${{ steps.changelog.outputs.CHANGELOG }}
          draft: false
          prerelease: false
          files: |
            release-artifacts/**/*.dmg
            release-artifacts/**/*.msi
            release-artifacts/**/*.exe
            release-artifacts/**/*.AppImage
            release-artifacts/**/*.deb
            release-artifacts/**/*.apk

  # ============================================================================
  # 3. TEAM NOTIFICATIONS (SLACK, DISCORD & EMAIL)
  # ============================================================================
  notify-team:
    name: Notify Team (Slack, Discord, Email)
    needs: [build-matrix, publish-release]
    if: always()
    runs-on: ubuntu-latest

    steps:
      - name: Determine Build Status
        id: status
        run: |
          if [[ "${{ needs.build-matrix.result }}" == "success" && ("${{ needs.publish-release.result }}" == "success" || "${{ needs.publish-release.result }}" == "skipped") ]]; then
            echo "state=SUCCEEDED" >> $GITHUB_OUTPUT
            echo "color=#22c55e" >> $GITHUB_OUTPUT
            echo "emoji=✅" >> $GITHUB_OUTPUT
          else
            echo "state=FAILED" >> $GITHUB_OUTPUT
            echo "color=#ef4444" >> $GITHUB_OUTPUT
            echo "emoji=❌" >> $GITHUB_OUTPUT
          fi

      - name: Send Slack Notification
        if: secrets.SLACK_WEBHOOK_URL != ''
        uses: slackapi/slack-github-action@v1.26.0
        with:
          payload: |
            {
              "attachments": [
                {
                  "color": "${{ steps.status.outputs.color }}",
                  "title": "${{ steps.status.outputs.emoji }} KayBiT_Html_Pdf Build #${{ github.run_number }} ${{ steps.status.outputs.state }}",
                  "text": "Branch: `${{ github.ref_name }}` | Commit: `${{ github.sha }}`\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Workflow Run>"
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK

      - name: Send Discord Notification
        if: secrets.DISCORD_WEBHOOK_URL != ''
        uses: sarisia/actions-status-discord@v1
        with:
          webhook: ${{ secrets.DISCORD_WEBHOOK_URL }}
          title: "${{ steps.status.outputs.emoji }} KayBiT_Html_Pdf Build #${{ github.run_number }} ${{ steps.status.outputs.state }}"
          description: "Multi-platform build (macOS, iOS, Windows, Linux, Android) triggered by `${{ github.actor }}`."
          url: "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"

      - name: Send Email Notification
        if: secrets.SMTP_SERVER != ''
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: ${{ secrets.SMTP_SERVER }}
          server_port: 465
          secure: true
          username: ${{ secrets.SMTP_USERNAME }}
          password: ${{ secrets.SMTP_PASSWORD }}
          subject: "${{ steps.status.outputs.emoji }} [KayBiT_Html_Pdf] Build #${{ github.run_number }} ${{ steps.status.outputs.state }}"
          to: ${{ secrets.NOTIFY_EMAIL }}
          from: "KayBiT CI/CD <${{ secrets.SMTP_USERNAME }}>"
          body: |
            Build #${{ github.run_number }} has ${{ steps.status.outputs.state }}.
            Repository: ${{ github.repository }}
            Branch: ${{ github.ref_name }}
            Workflow URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```
