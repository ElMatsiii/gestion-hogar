import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStandaloneMode, createPromptRunner } from '../src/context/pwaUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '..');

// Helper to read PNG dimensions from IHDR chunk
function readPngDimensions(buffer) {
  // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(pngSignature)) {
    throw new Error('Invalid PNG signature');
  }
  // IHDR starts at offset 12; width is at 16 (4 bytes), height at 20 (4 bytes)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

test('R1: Web App Manifest is valid and meets all Android PWA requirements', (t) => {
  const manifestPaths = [
    path.join(clientDir, 'public', 'manifest.webmanifest'),
    path.join(clientDir, 'dist', 'manifest.webmanifest'),
  ];

  for (const manifestPath of manifestPaths) {
    assert.ok(fs.existsSync(manifestPath), `Manifest must exist at ${manifestPath}`);
    const rawContent = fs.readFileSync(manifestPath, 'utf8');
    let manifest;
    assert.doesNotThrow(() => {
      manifest = JSON.parse(rawContent);
    }, `Manifest at ${manifestPath} must be valid JSON`);

    // Required fields check per R1
    assert.equal(manifest.name, 'HogarSync - Gestión del Hogar', 'manifest name must match');
    assert.equal(manifest.short_name, 'HogarSync', 'manifest short_name must match');
    assert.equal(manifest.start_url, '/', 'manifest start_url must be "/"');
    assert.equal(manifest.display, 'standalone', 'manifest display must be "standalone"');
    assert.equal(manifest.background_color.toUpperCase(), '#F8FAFC', 'manifest background_color must match');
    assert.equal(manifest.theme_color.toUpperCase(), '#059669', 'manifest theme_color must match');

    assert.equal(manifest.lang, 'es', 'manifest lang must be "es"');

    // Standard Android icons
    assert.ok(Array.isArray(manifest.icons), 'manifest must have icons array');
    assert.ok(manifest.icons.length >= 2, 'manifest must have at least 2 icon definitions');

    const has192 = manifest.icons.some((i) => i.sizes === '192x192');
    const has512 = manifest.icons.some((i) => i.sizes === '512x512');
    const hasMaskable = manifest.icons.some((i) => i.purpose && i.purpose.includes('maskable'));
    const hasAny = manifest.icons.some((i) => !i.purpose || i.purpose.includes('any'));

    assert.ok(has192, 'Manifest must specify at least one 192x192 icon');
    assert.ok(has512, 'Manifest must specify at least one 512x512 icon');
    assert.ok(hasMaskable, 'Manifest must specify at least one maskable icon for Android adaptive icons');
    assert.ok(hasAny, 'Manifest must specify at least one any purpose icon');
  }
});

test('R1: Manifest icon files exist and have exact PNG dimensions matching Android standards', () => {
  const distDir = path.join(clientDir, 'dist');
  const manifestPath = path.join(distDir, 'manifest.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  for (const icon of manifest.icons) {
    // Relative path resolving (strip leading slash)
    const relPath = icon.src.replace(/^\//, '');
    const iconDistPath = path.join(distDir, relPath);
    const iconPublicPath = path.join(clientDir, 'public', relPath);

    assert.ok(
      fs.existsSync(iconDistPath) || fs.existsSync(iconPublicPath),
      `Icon file must exist for ${icon.src}`
    );

    const actualPath = fs.existsSync(iconDistPath) ? iconDistPath : iconPublicPath;
    const buffer = fs.readFileSync(actualPath);
    const { width, height } = readPngDimensions(buffer);

    const [expectedW, expectedH] = icon.sizes.split('x').map(Number);
    assert.equal(width, expectedW, `Icon ${icon.src} width must match ${expectedW}px`);
    assert.equal(height, expectedH, `Icon ${icon.src} height must match ${expectedH}px`);
  }
});

test('R1: client/index.html and dist/index.html link manifest, configure mobile PWA metadata and accessible viewport', () => {
  const indexPaths = [
    path.join(clientDir, 'index.html'),
    path.join(clientDir, 'dist', 'index.html'),
  ];

  for (const indexPath of indexPaths) {
    assert.ok(fs.existsSync(indexPath), `index.html must exist at ${indexPath}`);
    const html = fs.readFileSync(indexPath, 'utf8');

    // Manifest link
    assert.match(
      html,
      /<link[^>]+rel=["']manifest["'][^>]+href=["'][^"']*manifest\.(webmanifest|json)["']/i,
      `index.html must link to web manifest at ${indexPath}`
    );

    // Verify dist/index.html does not duplicate the manifest link
    if (indexPath.includes('dist')) {
      const manifestLinks = html.match(/<link[^>]+rel=["']manifest["'][^>]*>/gi) || [];
      assert.equal(
        manifestLinks.length,
        1,
        'dist/index.html must contain exactly one manifest link tag (no duplicates)'
      );
    }

    // Theme color
    assert.match(
      html,
      /<meta[^>]+name=["']theme-color["'][^>]+content=["']#059669["']/i,
      `index.html must have theme-color #059669 at ${indexPath}`
    );

    // Mobile viewport
    assert.match(
      html,
      /<meta[^>]+name=["']viewport["']/i,
      `index.html must have viewport meta tag at ${indexPath}`
    );

    // Viewport must not disable user scaling (Lighthouse accessibility compliance)
    assert.doesNotMatch(
      html,
      /user-scalable\s*=\s*no/i,
      `index.html must not disable zoom via user-scalable=no for Lighthouse accessibility at ${indexPath}`
    );

    // Mobile web app capability
    assert.match(
      html,
      /<meta[^>]+name=["'](mobile-web-app-capable|apple-mobile-web-app-capable)["'][^>]+content=["']yes["']/i,
      `index.html must have mobile web app capability tag at ${indexPath}`
    );
  }
});

test('R2: Service Worker is generated in production build and precaches static assets without duplicates', () => {
  const swPath = path.join(clientDir, 'dist', 'sw.js');
  const registerSWPath = path.join(clientDir, 'dist', 'registerSW.js');
  const distIndexPath = path.join(clientDir, 'dist', 'index.html');

  assert.ok(fs.existsSync(swPath), 'dist/sw.js service worker must be generated');
  assert.ok(fs.existsSync(registerSWPath), 'dist/registerSW.js must be generated');

  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.length > 100, 'sw.js must have non-empty content');
  assert.match(swContent, /precacheAndRoute/, 'Service worker must use Workbox precacheAndRoute');
  assert.match(swContent, /index\.html/, 'Service worker must precache index.html');
  assert.match(swContent, /icons\/icon-192x192\.png/, 'Service worker must precache icons');
  assert.match(swContent, /clientsClaim/, 'Service worker must claim clients');
  assert.match(swContent, /skipWaiting/, 'Service worker must handle skipWaiting');

  // Verify no duplicate precache entries exist in precacheAndRoute
  const precacheMatch = swContent.match(/precacheAndRoute\(\[([^\]]+)\]/);
  assert.ok(precacheMatch, 'precacheAndRoute array must be present');
  const urlMatches = [...precacheMatch[1].matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
  const uniqueUrls = new Set(urlMatches);
  assert.equal(
    urlMatches.length,
    uniqueUrls.size,
    `precacheAndRoute must not contain duplicate URLs: found ${urlMatches.length} entries, ${uniqueUrls.size} unique`
  );

  const distIndex = fs.readFileSync(distIndexPath, 'utf8');
  assert.match(
    distIndex,
    /registerSW\.js|serviceWorker\.register/,
    'dist/index.html must register the service worker'
  );
});

test('R3: PWA Install banner and prompt runner prevents duplicate prompt calls on concurrent taps', async () => {
  let promptCallCount = 0;
  const mockChoiceAccepted = { outcome: 'accepted', platform: 'web' };

  const mockBeforeInstallPromptEvent = {
    platforms: ['web', 'play'],
    preventDefault() {},
    prompt() {
      promptCallCount++;
      if (promptCallCount > 1) {
        throw new Error('DOMException: The prompt() method may only be called once.');
      }
      return Promise.resolve();
    },
    get userChoice() {
      return Promise.resolve(mockChoiceAccepted);
    },
  };

  let activePrompt = mockBeforeInstallPromptEvent;
  let successReported = false;

  // Use the REAL createPromptRunner from pwaUtils.ts
  const runner = createPromptRunner(() => {
    successReported = true;
  });

  async function triggerTap() {
    return runner.executePrompt(activePrompt, () => {
      activePrompt = null;
    });
  }

  // Fire two concurrent calls simultaneously (as happens with rapid mobile double tap)
  const [res1, res2] = await Promise.all([triggerTap(), triggerTap()]);

  assert.equal(promptCallCount, 1, 'prompt() must only be called once even on simultaneous taps');
  assert.equal(res1, true, 'First tap successfully accepted install');
  assert.equal(res2, false, 'Second concurrent tap rejected gracefully without throwing');
  assert.equal(activePrompt, null, 'Active prompt was immediately consumed');
  assert.equal(successReported, true, 'Success callback fired on accepted install');
});

test('R3: Standalone display-mode check logic handles missing matchMedia, iOS, and TWA', () => {
  // Directly test the production isStandaloneMode exported from pwaUtils.ts
  assert.equal(typeof isStandaloneMode, 'function', 'isStandaloneMode must be exported from pwaUtils.ts');

  // Standard browser tab
  assert.equal(isStandaloneMode((q) => false, false, ''), false, 'Browser tab is not standalone');

  // Standalone display mode
  assert.equal(isStandaloneMode((q) => q === '(display-mode: standalone)', false, ''), true, 'standalone matches');
  assert.equal(isStandaloneMode((q) => q === '(display-mode: fullscreen)', false, ''), true, 'fullscreen matches');
  assert.equal(isStandaloneMode((q) => q === '(display-mode: minimal-ui)', false, ''), true, 'minimal-ui matches');

  // iOS home screen standalone
  assert.equal(isStandaloneMode(undefined, true, ''), true, 'iOS navigator.standalone matches');

  // Android Trusted Web Activity (TWA)
  assert.equal(isStandaloneMode(undefined, false, 'android-app://com.android.chrome'), true, 'Android TWA matches');

  // Safe fallback when window.matchMedia is missing (undefined) or throws
  assert.equal(isStandaloneMode(undefined, false, ''), false, 'Missing matchMedia gracefully returns false without error');
  assert.equal(isStandaloneMode(() => { throw new Error('SecurityError'); }, false, ''), false, 'Throwing matchMedia gracefully returns false');
});

test('R3: Mobile UI integration (Navbar and PWAInstallBanner contain install triggers with isInstalling protection)', () => {
  const navbarPath = path.join(clientDir, 'src', 'components', 'Navbar.tsx');
  const bannerPath = path.join(clientDir, 'src', 'components', 'common', 'PWAInstallBanner.tsx');
  const contextPath = path.join(clientDir, 'src', 'context', 'PWAInstallContext.tsx');
  const utilsPath = path.join(clientDir, 'src', 'context', 'pwaUtils.ts');

  assert.ok(fs.existsSync(navbarPath), 'Navbar.tsx exists');
  assert.ok(fs.existsSync(bannerPath), 'PWAInstallBanner.tsx exists');
  assert.ok(fs.existsSync(contextPath), 'PWAInstallContext.tsx exists');
  assert.ok(fs.existsSync(utilsPath), 'pwaUtils.ts exists');

  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const bannerContent = fs.readFileSync(bannerPath, 'utf8');
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  const utilsContent = fs.readFileSync(utilsPath, 'utf8');

  // Utils & Context exports isInstalling and isStandaloneMode
  assert.match(utilsContent, /isInstalling:\s*boolean/, 'PWAInstallContextType includes isInstalling');
  assert.match(utilsContent, /export function isStandaloneMode/, 'isStandaloneMode is exported from pwaUtils');
  assert.match(contextContent, /isPromptingRef/, 'Context implements isPromptingRef to guard against concurrency');

  // Navbar includes install button, isInstalling disabled state, Loader2, and notification
  assert.match(navbarContent, /canInstall/, 'Navbar checks canInstall');
  assert.match(navbarContent, /isInstalling/, 'Navbar tracks isInstalling');
  assert.match(navbarContent, /disabled=\{isInstalling\}/, 'Navbar button disables when isInstalling is true');
  assert.match(navbarContent, /handleNavbarInstall/, 'Navbar defines handleNavbarInstall with feedback');
  assert.match(navbarContent, /Loader2/, 'Navbar uses Loader2 for spin animation');

  // Banner includes install button, isInstalling disabled state, Loader2, and safe-area insets
  assert.match(bannerContent, /showBanner/, 'PWAInstallBanner checks showBanner');
  assert.match(bannerContent, /disabled=\{isInstalling\}/, 'PWAInstallBanner button disables when isInstalling is true');
  assert.match(bannerContent, /dismissBanner/, 'PWAInstallBanner provides dismissal action');
  assert.match(bannerContent, /Loader2/, 'PWAInstallBanner uses Loader2 for spin animation');
  assert.match(bannerContent, /safe-area-inset-bottom/, 'PWAInstallBanner accounts for mobile safe area insets');
});
