import React, { useState, useEffect } from 'react';
import { Download, Monitor, Apple, Terminal, AlertTriangle, RefreshCw, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

// Types
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

// Helpers
function detectOS(): OS {
  const nav = navigator as any;
  if (nav.userAgentData?.platform) {
    const p = nav.userAgentData.platform.toLowerCase();
    if (p.includes('windows')) return 'windows';
    if (p.includes('mac')) return 'macos';
    if (p.includes('linux')) return 'linux';
  }
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}
function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
function pickAsset(assets: ReleaseAsset[], os: OS): ReleaseAsset | undefined {
  if (os === 'windows') return assets.find((a) => a.name.endsWith('.msi')) || assets.find((a) => a.name.endsWith('.exe') && !a.name.includes('setup-helper'));
  if (os === 'macos') return assets.find((a) => a.name.endsWith('.dmg')) || assets.find((a) => a.name.endsWith('.app.tar.gz'));
  if (os === 'linux') return assets.find((a) => a.name.endsWith('.AppImage')) || assets.find((a) => a.name.endsWith('.deb'));
  return undefined;
}
function getAllPlatformAssets(assets: ReleaseAsset[]) {
  return [
    { os: 'windows' as OS, label: 'Windows', ext: '.msi / .exe', icon: Monitor, asset: pickAsset(assets, 'windows') },
    { os: 'macos' as OS, label: 'macOS', ext: '.dmg', icon: Apple, asset: pickAsset(assets, 'macos') },
    { os: 'linux' as OS, label: 'Linux', ext: '.AppImage / .deb', icon: Terminal, asset: pickAsset(assets, 'linux') },
  ];
}

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
      .then((r) => { if (!r.ok) throw new Error('no release'); return r.json(); })
      .then((data: GitHubRelease) => setRelease(data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  const platforms = release ? getAllPlatformAssets(release.assets) : [];
  const primaryPlatform = platforms.find((p) => p.os === visitorOS) ?? platforms[0];
  const otherPlatforms = platforms.filter((p) => p.os !== primaryPlatform?.os);

  return (
    <section id="downloads" className="relative w-full bg-brand-offWhite text-brand-black pb-32 px-6 md:px-12 z-20">
      <div className="max-w-4xl mx-auto border-t border-brand-lightGray pt-24">
        
        <div className="mb-12">
          <h2 className="font-display text-4xl md:text-5xl uppercase tracking-tightest mb-4">
            Download REVU.
          </h2>
          <p className="font-sans text-brand-darkGray">
            Runs locally on your machine.
          </p>
        </div>

        {loading && (
          <div className="p-12 border border-brand-lightGray bg-brand-white flex flex-col items-center gap-4 font-mono text-xs text-brand-gray uppercase">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-black" />
            <span>Fetching Latest Release...</span>
          </div>
        )}

        {!loading && (fetchError || !release) && (
          <div className="p-12 border border-brand-lightGray bg-brand-white flex flex-col items-center gap-4 text-center">
            <p className="font-mono text-sm text-brand-black uppercase tracking-wider font-semibold">
              First Release Coming Soon
            </p>
            <p className="font-sans text-brand-darkGray max-w-sm text-sm">
              The desktop application is currently building. Check back shortly or view the repository on GitHub.
            </p>
            <a
              href="https://github.com/saish-vc/code-reviewer"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-6 py-3 bg-brand-black text-brand-white font-mono text-xs uppercase tracking-widest hover:bg-brand-accent transition-colors"
            >
              View on GitHub
            </a>
          </div>
        )}

        {!loading && release && primaryPlatform && (
          <div className="space-y-4">
            {/* Primary Platform Card */}
            <div className="border border-brand-black bg-brand-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div className="absolute top-4 right-4 font-mono text-[10px] bg-brand-black text-brand-white px-2 py-1 uppercase tracking-widest">
                {visitorOS !== 'unknown' ? 'Detected Platform' : 'Latest'}
              </div>
              <div className="flex items-center gap-6">
                {primaryPlatform.icon && <primaryPlatform.icon className="w-10 h-10 text-brand-black" />}
                <div>
                  <p className="font-mono text-[10px] text-brand-gray uppercase tracking-widest mb-1">
                    {primaryPlatform.label}
                  </p>
                  <p className="font-display text-xl md:text-2xl uppercase">
                    {primaryPlatform.asset?.name ?? primaryPlatform.ext}
                  </p>
                  {primaryPlatform.asset && (
                    <p className="font-mono text-[10px] text-brand-darkGray mt-1">
                      {release.tag_name} // {fmtSize(primaryPlatform.asset.size)}
                    </p>
                  )}
                </div>
              </div>

              {primaryPlatform.asset ? (
                <a
                  href={primaryPlatform.asset.browser_download_url}
                  className="w-full md:w-auto px-8 py-4 bg-brand-black text-brand-white font-mono text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-accent transition-colors active:translate-y-px"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              ) : (
                <div className="px-8 py-4 border border-brand-lightGray text-brand-gray font-mono text-xs uppercase tracking-widest">
                  Not Available
                </div>
              )}
            </div>

            {/* Other Platforms */}
            <button
              onClick={() => setShowOtherPlatforms(!showOtherPlatforms)}
              className="w-full flex items-center justify-between p-4 border border-brand-lightGray hover:border-brand-gray font-mono text-[10px] text-brand-darkGray uppercase tracking-widest transition-colors bg-brand-white"
            >
              <span>Other Platforms</span>
              {showOtherPlatforms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showOtherPlatforms && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherPlatforms.map((p) => (
                  <div key={p.os} className="border border-brand-lightGray bg-brand-white p-5 flex items-center gap-4 hover:border-brand-gray transition-colors">
                    <p.icon className="w-6 h-6 text-brand-gray" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] text-brand-gray uppercase tracking-widest">
                        {p.label}
                      </p>
                      <p className="font-mono text-xs truncate">
                        {p.asset?.name ?? p.ext}
                      </p>
                    </div>
                    {p.asset && (
                      <a
                        href={p.asset.browser_download_url}
                        className="p-2 bg-brand-lightGray hover:bg-brand-black hover:text-brand-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 border border-brand-gray/30 bg-brand-white flex items-start gap-3 font-mono text-[10px] text-brand-darkGray uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-brand-black flex-shrink-0" />
              <p className="leading-relaxed">
                <span className="font-bold text-brand-black">Unsigned Build: </span>
                Windows SmartScreen or macOS Gatekeeper may show a warning on first launch. This is expected.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
