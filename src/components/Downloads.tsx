import React, { useState, useEffect } from 'react';
import { Download, Monitor, Apple, Terminal, AlertTriangle, RefreshCw, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
  assets: ReleaseAsset[];
}

type OS = 'windows' | 'macos' | 'linux' | 'unknown';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect visitor's OS from userAgent / userAgentData.
 * Returns a normalised OS slug.
 */
function detectOS(): OS {
  // Modern API (Chrome 90+, Edge 90+) — platform-neutral
  const nav = navigator as any;
  if (nav.userAgentData?.platform) {
    const p = nav.userAgentData.platform.toLowerCase();
    if (p.includes('windows')) return 'windows';
    if (p.includes('mac')) return 'macos';
    if (p.includes('linux')) return 'linux';
  }
  // Fallback to userAgent string
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

/** Human-readable file size */
function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

/** Pick the best asset for a given OS */
function pickAsset(assets: ReleaseAsset[], os: OS): ReleaseAsset | undefined {
  if (os === 'windows') {
    return (
      assets.find((a) => a.name.endsWith('.msi')) ||
      assets.find((a) => a.name.endsWith('.exe') && !a.name.includes('setup-helper'))
    );
  }
  if (os === 'macos') {
    return (
      assets.find((a) => a.name.endsWith('.dmg')) ||
      assets.find((a) => a.name.endsWith('.app.tar.gz'))
    );
  }
  if (os === 'linux') {
    return (
      assets.find((a) => a.name.endsWith('.AppImage')) ||
      assets.find((a) => a.name.endsWith('.deb'))
    );
  }
  return undefined;
}

/** Get all primary installer assets across platforms */
function getAllPlatformAssets(assets: ReleaseAsset[]) {
  return [
    {
      os: 'windows' as OS,
      label: 'Windows',
      ext: '.msi / .exe',
      icon: Monitor,
      asset: pickAsset(assets, 'windows'),
    },
    {
      os: 'macos' as OS,
      label: 'macOS',
      ext: '.dmg',
      icon: Apple,
      asset: pickAsset(assets, 'macos'),
    },
    {
      os: 'linux' as OS,
      label: 'Linux',
      ext: '.AppImage / .deb',
      icon: Terminal,
      asset: pickAsset(assets, 'linux'),
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Downloads: React.FC = () => {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [visitorOS, setVisitorOS] = useState<OS>('unknown');
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);

  useEffect(() => {
    setVisitorOS(detectOS());
    fetch('https://api.github.com/repos/saish-vc/code-reviewer/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error('no release');
        return r.json();
      })
      .then((data: GitHubRelease) => setRelease(data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  const platforms = release ? getAllPlatformAssets(release.assets) : [];
  const primaryPlatform = platforms.find((p) => p.os === visitorOS) ?? platforms[0];
  const otherPlatforms = platforms.filter((p) => p.os !== primaryPlatform?.os);

  return (
    <section
      id="downloads"
      className="bg-brand-dark py-28 px-6 md:px-12 border-t border-white/10 relative overflow-hidden"
    >
      {/* Editorial grid background */}
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Section label */}
        <div className="flex items-center gap-3 font-mono text-xs text-brand-red uppercase tracking-widest mb-6">
          <span className="w-2 h-2 bg-brand-red" />
          <span>DESKTOP APPLICATION / DOWNLOAD</span>
        </div>

        {/* Headline */}
        <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-brand-cream uppercase leading-[0.95] tracking-tight mb-8">
          DOWNLOAD<br />
          <span className="italic text-brand-red">REVU.</span>
        </h2>

        <p className="font-sans text-lg text-brand-cream/75 max-w-2xl font-light leading-relaxed mb-12">
          REVU is a native desktop application — available free for Windows, macOS, and Linux.
          The review tool runs locally; your code is sent only to the research backend for analysis.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Download panel                                                    */}
        {/* ---------------------------------------------------------------- */}

        {loading && (
          <div className="p-12 border border-white/15 bg-brand-surface flex flex-col items-center gap-4 font-mono text-sm text-brand-gray">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-red" />
            <span>CHECKING FOR LATEST RELEASE...</span>
          </div>
        )}

        {!loading && (fetchError || !release) && (
          <div className="p-10 border border-white/15 bg-brand-surface flex flex-col items-center gap-5 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <div>
              <p className="font-mono text-sm text-white font-bold uppercase tracking-wider mb-2">
                FIRST RELEASE COMING SOON
              </p>
              <p className="font-sans text-sm text-brand-gray max-w-md leading-relaxed">
                The desktop app is under active development. Star the repository and watch for
                the first tagged release — downloads will appear here automatically.
              </p>
            </div>
            <a
              href="https://github.com/saish-vc/code-reviewer"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-white/20 hover:border-white/50 text-brand-cream font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <span>VIEW ON GITHUB</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {!loading && release && primaryPlatform && (
          <div className="space-y-4">

            {/* Version badge */}
            <div className="flex items-center gap-3 font-mono text-xs text-brand-gray mb-6">
              <span className="px-2 py-1 border border-white/15 text-brand-cream font-bold">
                {release.tag_name}
              </span>
              <span>·</span>
              <span>
                {new Date(release.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span>·</span>
              <a
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-red hover:underline flex items-center gap-1"
              >
                <span>RELEASE NOTES</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {/* Primary download card — OS-detected */}
            <div className="border border-brand-red bg-brand-red/5 p-8 flex flex-col sm:flex-row sm:items-center gap-6 relative">
              {/* Detected label */}
              <div className="absolute top-4 right-4 font-mono text-[10px] text-brand-red uppercase tracking-widest px-2 py-0.5 border border-brand-red/40">
                {visitorOS !== 'unknown' ? 'YOUR PLATFORM' : 'LATEST'}
              </div>

              <div className="flex items-center gap-5 flex-1 min-w-0">
                {primaryPlatform.icon && (
                  <div className="w-14 h-14 border border-white/15 bg-brand-surface flex-shrink-0 flex items-center justify-center">
                    <primaryPlatform.icon className="w-7 h-7 text-brand-cream" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-mono text-xs text-brand-gray uppercase tracking-wider mb-1">
                    {primaryPlatform.label}
                  </p>
                  <p className="font-serif text-2xl text-white uppercase font-normal">
                    {primaryPlatform.asset?.name ?? primaryPlatform.ext}
                  </p>
                  {primaryPlatform.asset && (
                    <p className="font-mono text-xs text-brand-gray mt-1">
                      {fmtSize(primaryPlatform.asset.size)}
                    </p>
                  )}
                </div>
              </div>

              {primaryPlatform.asset ? (
                <a
                  href={primaryPlatform.asset.browser_download_url}
                  className="flex-shrink-0 px-8 py-4 bg-brand-red hover:bg-brand-darkRed text-white font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-brand-red/25 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD FREE</span>
                </a>
              ) : (
                <div className="flex-shrink-0 px-8 py-4 border border-white/20 text-brand-gray font-mono text-sm uppercase tracking-wider">
                  NOT YET AVAILABLE
                </div>
              )}
            </div>

            {/* Other platforms toggle */}
            <button
              onClick={() => setShowOtherPlatforms((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 border border-white/10 hover:border-white/25 font-mono text-xs text-brand-gray uppercase tracking-wider transition-colors"
            >
              <span>OTHER PLATFORMS</span>
              {showOtherPlatforms ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showOtherPlatforms && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
                {otherPlatforms.map((p) => (
                  <div
                    key={p.os}
                    className="bg-brand-dark p-6 flex items-center gap-5 hover:bg-brand-surface transition-colors"
                  >
                    <div className="w-10 h-10 border border-white/10 bg-brand-surface flex-shrink-0 flex items-center justify-center">
                      <p.icon className="w-5 h-5 text-brand-gray" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-brand-gray uppercase tracking-wider mb-0.5">
                        {p.label}
                      </p>
                      <p className="font-mono text-xs text-brand-cream truncate">
                        {p.asset?.name ?? p.ext}
                      </p>
                      {p.asset && (
                        <p className="font-mono text-[10px] text-brand-gray mt-0.5">
                          {fmtSize(p.asset.size)}
                        </p>
                      )}
                    </div>
                    {p.asset ? (
                      <a
                        href={p.asset.browser_download_url}
                        className="flex-shrink-0 px-4 py-2 border border-white/20 hover:border-white/50 text-brand-cream font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOWNLOAD</span>
                      </a>
                    ) : (
                      <span className="font-mono text-[10px] text-brand-gray uppercase">
                        COMING SOON
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Unsigned build notice */}
            <div className="mt-4 p-4 border border-amber-500/20 bg-amber-950/10 flex items-start gap-3 font-mono text-xs text-amber-300/80">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="text-amber-400 font-bold uppercase tracking-wider">
                  UNSIGNED BUILD NOTICE.{' '}
                </span>
                REVU is distributed without a paid code-signing certificate.
                On first launch, Windows may show a SmartScreen warning and macOS may show a
                Gatekeeper dialog — this is expected. On Windows, click "More info → Run anyway".
                On macOS, right-click the app and choose "Open".
              </p>
            </div>
          </div>
        )}

        {/* Bottom divider meta */}
        <div className="mt-16 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-brand-gray">
          <span>FREE & OPEN SOURCE · MIT LICENSE</span>
          <a
            href="https://github.com/saish-vc/code-reviewer"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>SOURCE CODE ON GITHUB</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

      </div>
    </section>
  );
};
