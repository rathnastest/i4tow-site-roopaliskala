import type {
  Block,
  CtaBlock,
  FeatureGridBlock,
  GalleryBlock,
  HeroBlock,
  MediaStoryBlock,
  ParagraphAlign,
  RichTextBlock,
  ScrollytellingBlock,
  SiteFontId,
  SiteThemeId,
  SiteWidth,
} from '@/lib/blocks';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Reveal } from './motion';

marked.setOptions({ gfm: true, breaks: true });
// Authored by the site owner, but rendered on a public page - sanitize to a safe
// subset so a compromised/mistaken author can't inject script into visitors' pages.
const BODY_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'hr', 'img'];
const INLINE_TAGS = ['strong', 'em', 'b', 'i', 'u', 's', 'a', 'br', 'code'];
const ALLOWED_ATTR = ['href', 'title', 'src', 'alt'];

/** Source markdown for a text block: the flat field, falling back to the legacy paragraphs[]. */
function bodyMarkdown(flat?: string, paragraphs?: string[]): string {
  const f = (flat ?? '').trim();
  if (f) return f;
  return (paragraphs ?? []).map((p) => p.trim()).filter(Boolean).join('\n\n');
}

function renderBodyHtml(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }) as string, { ALLOWED_TAGS: BODY_TAGS, ALLOWED_ATTR });
}

/** Inline-only markdown (bold/italic/underline/links) for headings - no block elements. */
function inlineHtml(text: string): string {
  return DOMPurify.sanitize(marked.parseInline(text ?? '', { async: false }) as string, { ALLOWED_TAGS: INLINE_TAGS, ALLOWED_ATTR });
}

/** Renders a block's markdown body as sanitized, prose-styled HTML with a per-block alignment. */
function RichBody({ markdown, align, className = '' }: { markdown: string; align?: ParagraphAlign; className?: string }) {
  return <div className={`rich-body ${alignClass(align)} ${className}`} dangerouslySetInnerHTML={{ __html: renderBodyHtml(markdown) }} />;
}

const ALIGN_CLASS: Record<ParagraphAlign, string> = {
  left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify',
};

const SITE_FONT_IDS = new Set<SiteFontId>([
  'dmSans', 'roboto', 'openSans', 'lato', 'montserrat',
  'poppins', 'inter', 'oswald', 'raleway', 'notoSans',
  'sourceSans3', 'ubuntu', 'nunitoSans', 'merriweather',
  'playfairDisplay', 'robotoSlab', 'rubik', 'ptSans',
  'workSans', 'mulish', 'robotoCondensed', 'notoSerif',
  'libreBaskerville', 'cormorantGaramond', 'quicksand',
]);

function alignClass(align?: string): string {
  return ALIGN_CLASS[(align ?? '') as ParagraphAlign] ?? '';
}

function siteHref(href: string): string {
  if (/^(https?:|mailto:|tel:|sms:|#)/i.test(href) || href.startsWith('//')) return href;
  if (!href.startsWith('/')) return href;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}${href.replace(/^\/+/, '')}`;
}

function siteAsset(src: string): string {
  if (/^(https?:|data:|blob:)/i.test(src) || src.startsWith('//')) return src;
  if (!src.startsWith('/')) return src;
  return siteHref(src);
}

// ── Button ─────────────────────────────────────────────────────────────────
// warmArtStudio: pill (rounded-full) - organic, friendly
// minimalGallery + boldEditorial: sharp rectangle - architectural, editorial
function Button({ href, children, variant = 'primary', themeId = 'warmArtStudio' }: {
  href: string; children: ReactNode; variant?: 'primary' | 'ghost'; themeId?: SiteThemeId;
}) {
  const radius = themeId === 'warmArtStudio' ? 'rounded-full' : 'rounded-none';
  const base = `inline-flex items-center gap-2 ${radius} px-6 py-3 text-sm font-medium transition-transform duration-200 will-change-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay`;
  const styles = variant === 'primary'
    ? 'bg-clay text-canvas hover:bg-clay-deep shadow-soft'
    : 'border border-line text-ink hover:border-clay hover:text-clay';
  return <a href={siteHref(href)} className={`${base} ${styles}`}>{children}</a>;
}

function Section({ children, className = '', width = 'contained' }: { children: ReactNode; className?: string; width?: SiteWidth }) {
  const widthClass = width === 'full' ? 'max-w-[1600px]' : 'max-w-6xl';
  return <section className={`mx-auto w-full ${widthClass} px-6 py-20 md:py-28 ${className}`}>{children}</section>;
}

function buttonsFrom(...groups: Array<{ label: string; href: string }[] | { label: string; href: string } | undefined>): { label: string; href: string }[] {
  return groups.flatMap((group) => Array.isArray(group) ? group : group ? [group] : []).filter((button) => button.label && button.href).slice(0, 3);
}

// ── Hero ───────────────────────────────────────────────────────────────────
// warmArtStudio: centered layout, gradient top→bottom, soft spring
// minimalGallery: left-aligned, wide eyebrow tracking, architectural
// boldEditorial: 72dvh min-height, left-aligned, text sits at bottom on image
function Hero({ b, width, themeId }: { b: HeroBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const body = bodyMarkdown(b.subheading, b.paragraphs);
  const buttons = buttonsFrom(b.buttons, b.cta);
  const isCenter = themeId === 'warmArtStudio';
  const isEditorial = themeId === 'boldEditorial';

  const eyebrowTracking = themeId === 'minimalGallery' ? 'tracking-[0.3em]' : 'tracking-[0.2em]';
  const gradientClass = isEditorial
    ? 'bg-gradient-to-t from-canvas via-canvas/80 to-canvas/10'
    : 'bg-gradient-to-b from-canvas/70 via-canvas/60 to-canvas';
  const headingMaxW = isCenter ? 'max-w-4xl mx-auto' : isEditorial ? 'max-w-5xl' : 'max-w-3xl';

  return (
    <header className={`relative overflow-hidden${isEditorial ? ' flex min-h-[72dvh] flex-col justify-end' : ''}`}>
      {b.image && (
        <div className="absolute inset-0 -z-10">
          <img src={siteAsset(b.image)} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div className={`absolute inset-0 ${gradientClass}`} />
        </div>
      )}
      <Section width={width} className={`${isEditorial ? 'pb-16 pt-24 md:pb-24' : 'md:py-36'} ${isCenter ? 'text-center' : 'text-left'}`}>
        {b.eyebrow && (
          <Reveal as="p">
            <span className={`text-sm font-medium uppercase text-clay ${eyebrowTracking}`}>{b.eyebrow}</span>
          </Reveal>
        )}
        <Reveal as="h1">
          <span className={`display-xl mt-4 block text-ink ${headingMaxW}`} dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
        {body && (
          <Reveal delay={80}>
            <RichBody markdown={body} align={isCenter ? b.align : 'left'} className={`mt-6 max-w-2xl text-lg text-ink-soft ${isCenter ? 'mx-auto' : ''}`} />
          </Reveal>
        )}
        {buttons.length > 0 && (
          <Reveal delay={160}>
            <div className={`mt-9 flex flex-wrap gap-3 ${isCenter ? 'justify-center' : ''}`}>
              {buttons.map((button) => (
                <Button key={`${button.href}:${button.label}`} href={button.href} themeId={themeId}>{button.label}</Button>
              ))}
            </div>
          </Reveal>
        )}
      </Section>
    </header>
  );
}

function RichText({ b, width, themeId }: { b: RichTextBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const body = bodyMarkdown(b.markdown, b.paragraphs);
  const isCenter = themeId !== 'minimalGallery';
  return (
    <Section width={width} className={isCenter ? 'text-center' : 'text-left'}>
      {b.heading && (
        <Reveal as="h2">
          <span className="display-lg mx-auto mb-8 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
      )}
      {body && (
        <Reveal>
          <RichBody markdown={body} align={b.align} className={`${isCenter ? 'mx-auto' : ''} max-w-3xl text-lg leading-relaxed text-ink-soft`} />
        </Reveal>
      )}
    </Section>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────
// warmArtStudio: 3-col 4:5 aspect, staggered reveal, 5% scale hover
// minimalGallery: 3-col 1:1 aspect, no stagger (clean simultaneity), opacity hover
// boldEditorial: 2-col 3:4 portrait (dramatic), staggered, stronger scale hover
function Gallery({ b, width, themeId }: { b: GalleryBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const items = b.items ?? [];

  const gridClass = themeId === 'boldEditorial'
    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'
    : 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5';

  const aspectClass = themeId === 'boldEditorial' ? 'aspect-[3/4]'
    : themeId === 'minimalGallery' ? 'aspect-square'
      : 'aspect-[4/5]';

  const imgHoverClass = themeId === 'minimalGallery'
    ? 'transition-opacity duration-350 group-hover:opacity-80'
    : themeId === 'boldEditorial'
      ? 'transition-transform duration-400 group-hover:scale-[1.09]'
      : 'transition-transform duration-500 group-hover:scale-105';

  // minimalGallery: reveal all at once (no stagger) - deliberate simultaneous discipline
  const delayFor = (i: number) => themeId === 'minimalGallery' ? 0 : (i % 3) * 60;

  return (
    <Section width={width}>
      {b.heading && (
        <Reveal as="h2">
          <span className="display-lg mb-10 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
      )}
      <div className={gridClass}>
        {items.map((it, i) => (
          <Reveal key={i} delay={delayFor(i)}>
            <figure className="group overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
              <img
                src={siteAsset(it.src)}
                alt={it.alt ?? ''}
                width={it.width}
                height={it.height}
                loading="lazy"
                decoding="async"
                className={`${aspectClass} w-full object-cover ${imgHoverClass}`}
              />
            </figure>
          </Reveal>
        ))}
        {items.length === 0 && <p className="col-span-full text-ink-soft">Add images to this gallery in your i4tow studio.</p>}
      </div>
    </Section>
  );
}

// ── FeatureGrid ────────────────────────────────────────────────────────────
// warmArtStudio: rounded cards with surface background
// minimalGallery: ruled top-line only - no box, no background, pure editorial spacing
// boldEditorial: strong full border, no background - stark magazine frame
function FeatureGrid({ b, width, themeId }: { b: FeatureGridBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const cardClass = themeId === 'minimalGallery'
    ? 'h-full border-t-2 border-ink/20 pb-4 pt-6'
    : themeId === 'boldEditorial'
      ? 'h-full border-2 border-ink/35 p-7'
      : 'h-full rounded-[var(--radius-card)] border border-line bg-surface/60 p-7';

  return (
    <Section width={width}>
      {b.heading && (
        <Reveal as="h2">
          <span className="display-lg mb-10 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {b.features.map((f, i) => (
          <Reveal key={i} delay={(i % 3) * 60}>
            <article className={cardClass}>
              <h3 className="font-display text-xl text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(f.title) }} />
              <p className="mt-3 text-ink-soft" dangerouslySetInnerHTML={{ __html: inlineHtml(f.body) }} />
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Cta({ b, width, themeId }: { b: CtaBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const body = bodyMarkdown(b.body, b.paragraphs);
  const buttons = buttonsFrom(b.buttons, b.primary, b.secondary);
  return (
    <Section width={width}>
      <Reveal>
        <div className="rounded-[var(--radius-card)] bg-clay px-8 py-14 text-center text-canvas md:py-20">
          <h2 className="display-lg mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
          {body && <RichBody markdown={body} align={b.align} className="mx-auto mt-4 max-w-xl text-canvas/85" />}
          {buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {buttons.map((button, i) => (
                <a
                  key={`${button.href}:${button.label}`}
                  href={siteHref(button.href)}
                  className={
                    i === 0
                      ? `${themeId === 'warmArtStudio' ? 'rounded-full' : 'rounded-none'} bg-canvas px-6 py-3 text-sm font-medium text-clay-deep transition-transform hover:-translate-y-0.5`
                      : `${themeId === 'warmArtStudio' ? 'rounded-full' : 'rounded-none'} border border-canvas/40 px-6 py-3 text-sm font-medium text-canvas transition-transform hover:-translate-y-0.5`
                  }
                >
                  {button.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
}

// ── Scrollytelling ─────────────────────────────────────────────────────────
// All themes: sticky image panel tracks active step via IntersectionObserver
//   (previously always showed step[0] image - now reactive).
// warmArtStudio: small clay-colored chapter number, cozy spacing
// minimalGallery: large architectural tabular number with wide tracking
// boldEditorial: massive watermark number behind heading (text-ink/5 ghost)
function Scrollytelling({ b, width, themeId }: { b: ScrollytellingBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const widthClass = width === 'full' ? 'max-w-[1600px]' : 'max-w-6xl';

  useEffect(() => {
    const observers = b.steps.map((_, idx) => {
      const el = stepRefs.current[idx];
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry?.isIntersecting) setActiveStep(idx); },
        { rootMargin: '-30% 0px -30% 0px', threshold: 0 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [b.steps]);

  const currentImage = b.steps[activeStep]?.image ?? b.steps[0]?.image;

  return (
    <section className={`mx-auto w-full ${widthClass} px-6 py-20`}>
      <div className="grid gap-12 md:grid-cols-2">
        {/* Steps column */}
        <div className="space-y-[60vh] md:space-y-[70vh]">
          {b.steps.map((s, i) => (
            <Reveal key={i}>
              <div ref={(el) => { stepRefs.current[i] = el; }}>
                {themeId === 'boldEditorial' ? (
                  // Massive watermark number behind heading - high drama
                  <div className="relative">
                    <span className="pointer-events-none absolute -left-2 -top-10 select-none text-[9rem] font-black leading-none text-ink/[0.04]" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="display-lg relative text-ink">{s.heading}</h3>
                    {s.body && <p className="mt-4 max-w-md text-lg text-ink-soft">{s.body}</p>}
                  </div>
                ) : themeId === 'minimalGallery' ? (
                  // Architectural chapter marker - large tabular number, wide tracking
                  <div>
                    <span className="mb-4 block text-4xl font-light tabular-nums tracking-widest text-clay">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="display-lg text-ink">{s.heading}</h3>
                    {s.body && <p className="mt-4 max-w-md text-lg text-ink-soft">{s.body}</p>}
                  </div>
                ) : (
                  // warmArtStudio: intimate clay label
                  <div>
                    <span className="font-display text-sm text-clay">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="display-lg mt-2 text-ink">{s.heading}</h3>
                    {s.body && <p className="mt-4 max-w-md text-lg text-ink-soft">{s.body}</p>}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Sticky image panel - reacts to active step */}
        <div className="hidden md:block">
          <div className="sticky top-24 overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
            {currentImage ? (
              // key forces remount on image change, replaying the step-image-in animation
              <img
                key={currentImage}
                src={siteAsset(currentImage)}
                alt=""
                className="aspect-[3/4] w-full object-cover"
                style={{ animation: 'step-image-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both' }}
              />
            ) : (
              <div className="grid aspect-[3/4] place-items-center text-ink-soft">Add images to steps in your studio.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── MediaStory (carousel) ──────────────────────────────────────────────────
// warmArtStudio: progress bar (linear fill) - organic, fluid
// minimalGallery: flat segment indicators (square ticks) - precise, architectural
// boldEditorial: large typographic counter "02 / 07" with arrow controls below
function MediaStory({ b, width, themeId }: { b: MediaStoryBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const imgs = b.images ?? [];
  const n = imgs.length;
  const body = bodyMarkdown(b.story, b.paragraphs);
  const autoSlide = b.autoSlide ?? true;
  const intervalSeconds = typeof b.intervalSeconds === 'number' && Number.isFinite(b.intervalSeconds) && b.intervalSeconds >= 1 ? Math.round(b.intervalSeconds) : 10;
  const showProgressBar = b.showProgressBar ?? true;
  const go = (d: number) => setI((p) => (n ? (p + d + n) % n : 0));

  useEffect(() => {
    if (!autoSlide || n <= 1) return undefined;
    const timer = window.setInterval(() => setI((p) => (p + 1) % n), intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [autoSlide, intervalSeconds, n]);

  useEffect(() => {
    if (!showProgressBar || n <= 1) {
      setProgress(0);
      return undefined;
    }
    if (!autoSlide) {
      setProgress(((i + 1) / n) * 100);
      return undefined;
    }
    setProgress(0);
    const frame = window.requestAnimationFrame(() => setProgress(100));
    return () => window.cancelAnimationFrame(frame);
  }, [autoSlide, i, intervalSeconds, n, showProgressBar]);

  // Per-theme carousel progress indicator
  const progressEl = n > 1 && (
    themeId === 'boldEditorial' ? (
      // Typographic counter with inline arrows - editorial authority
      <div className="flex items-center justify-between border-t border-ink/15 px-1 py-3">
        <button onClick={() => go(-1)} aria-label="Previous image" className="text-lg font-light text-ink-soft transition-colors hover:text-ink">←</button>
        <span className="text-xs font-medium tabular-nums tracking-[0.2em] text-ink-soft">
          {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>
        <button onClick={() => go(1)} aria-label="Next image" className="text-lg font-light text-ink-soft transition-colors hover:text-ink">→</button>
      </div>
    ) : themeId === 'minimalGallery' ? (
      // Flat segment ticks - architectural precision
      <div className="flex gap-1 p-3" role="tablist" aria-label="Carousel navigation">
        {imgs.map((_, idx) => (
          <button
            key={idx}
            role="tab"
            aria-selected={idx === i}
            aria-label={`Slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-[3px] flex-1 transition-colors duration-200 ${idx === i ? 'bg-clay' : 'bg-line'}`}
            style={{ borderRadius: 0 }}
          />
        ))}
      </div>
    ) : showProgressBar ? (
      // Linear progress fill - warm, fluid
      <div className="h-1 bg-line" role="progressbar" aria-label="Carousel progress" aria-valuemin={1} aria-valuemax={n} aria-valuenow={i + 1}>
        <div
          className="h-full bg-clay"
          style={{
            width: `${progress}%`,
            transition: autoSlide ? `width ${intervalSeconds}s linear` : 'width 300ms ease',
          }}
        />
      </div>
    ) : null
  );

  const prevNextButtons = themeId !== 'boldEditorial' && n > 1 && (
    <>
      <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-canvas/85 text-ink shadow-soft hover:bg-canvas">‹</button>
      <button onClick={() => go(1)} aria-label="Next image" className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-canvas/85 text-ink shadow-soft hover:bg-canvas">›</button>
    </>
  );

  const media = (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
      {n > 0 ? (
        <img src={siteAsset(imgs[i]!.src)} alt={imgs[i]!.alt ?? ''} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="grid aspect-[4/3] place-items-center text-ink-soft">Add images in your studio</div>
      )}
      {prevNextButtons}
      {progressEl}
    </div>
  );
  const story = (
    <div className="flex flex-col justify-center">
      <h2 className="display-lg text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
      {body && <RichBody markdown={body} align={b.align} className="mt-4 text-lg leading-relaxed text-ink-soft" />}
    </div>
  );
  return (
    <Section width={width}>
      <Reveal>
        <div className="grid items-stretch gap-8 md:grid-cols-2">
          {(b.imageSide ?? 'left') === 'left' ? <>{media}{story}</> : <>{story}{media}</>}
        </div>
      </Reveal>
    </Section>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  const settings = blocks.find((b) => b.kind === 'siteSettings');
  const width: SiteWidth = settings?.kind === 'siteSettings' && settings.pageWidth === 'full' ? 'full' : 'contained';
  const themeId: SiteThemeId = settings?.kind === 'siteSettings' && (settings.themeId === 'minimalGallery' || settings.themeId === 'boldEditorial') ? settings.themeId : 'warmArtStudio';
  const fontId: SiteFontId = settings?.kind === 'siteSettings' && SITE_FONT_IDS.has(settings.fontId as SiteFontId) ? settings.fontId as SiteFontId : 'dmSans';
  const visibleBlocks = blocks.filter((b) => b.kind !== 'siteSettings');
  return (
    <div data-site-font={fontId}>
      {visibleBlocks.map((b, i) => {
        switch (b.kind) {
          case 'hero': return <Hero key={i} b={b} width={width} themeId={themeId} />;
          case 'richText': return <RichText key={i} b={b} width={width} themeId={themeId} />;
          case 'gallery': return <Gallery key={i} b={b} width={width} themeId={themeId} />;
          case 'mediaStory': return <MediaStory key={i} b={b} width={width} themeId={themeId} />;
          case 'featureGrid': return <FeatureGrid key={i} b={b} width={width} themeId={themeId} />;
          case 'cta': return <Cta key={i} b={b} width={width} themeId={themeId} />;
          case 'scrollytelling': return <Scrollytelling key={i} b={b} width={width} themeId={themeId} />;
          default: return null;
        }
      })}
    </div>
  );
}
