import { useEffect, useState } from "react";
import type { Lang } from "../model/types";
import { t } from "../i18n";

interface Step {
  /** CSS selector of the element to spotlight, or null for a centered,
   *  un-highlighted welcome/finish step. */
  selector: string | null;
  title: (T: ReturnType<typeof t>) => string;
  body: (T: ReturnType<typeof t>) => string;
}

/** The guided tour's fixed script — each step names the always-visible
 *  element to spotlight (by selector, so it works regardless of which
 *  editor tab or document tab is currently active) and the copy to show
 *  next to it. Order roughly follows the app's own top-to-bottom,
 *  left-to-right layout. */
const STEPS: Step[] = [
  { selector: null, title: (T) => T.tutorialWelcomeTitle, body: (T) => T.tutorialWelcomeBody },
  { selector: ".tab-bar", title: (T) => T.tutorialTabsTitle, body: (T) => T.tutorialTabsBody },
  { selector: ".app-header", title: (T) => T.tutorialHeaderTitle, body: (T) => T.tutorialHeaderBody },
  { selector: ".header-fields", title: (T) => T.tutorialFieldsTitle, body: (T) => T.tutorialFieldsBody },
  { selector: ".tabs", title: (T) => T.tutorialTabsSwitchTitle, body: (T) => T.tutorialTabsSwitchBody },
  { selector: ".preview-toolbar", title: (T) => T.tutorialToolbarTitle, body: (T) => T.tutorialToolbarBody },
  { selector: ".preview-panel", title: (T) => T.tutorialPreviewTitle, body: (T) => T.tutorialPreviewBody },
  { selector: null, title: (T) => T.tutorialFinishTitle, body: (T) => T.tutorialFinishBody },
];

/** Padding around the spotlighted element's own box, and the gap left
 *  between it and the explanation card. */
const SPOTLIGHT_PAD = 8;
const CARD_GAP = 14;
/** The card's own box isn't known until it renders, so its placement is
 *  estimated from a fixed assumed size (clamped to the viewport either
 *  way) rather than measured in a second pass. */
const CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 170;
const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Guided product tour — a dark overlay with a cutout spotlight around one
 *  always-visible app section at a time, paired with a card explaining
 *  what it's for. Pure walkthrough, no persisted "seen it" state: it only
 *  ever opens when the tutorial button in the tab bar is clicked. */
export function TutorialOverlay({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const T = t(lang);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  useEffect(() => {
    if (!step.selector) return;
    const measure = () => {
      const el = document.querySelector(step.selector!);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step.selector]);

  const displayRect = step.selector ? rect : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const next = () => (isLast ? onClose() : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  let cardStyle: React.CSSProperties;
  if (!displayRect) {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else {
    const left = clamp(displayRect.left, VIEWPORT_MARGIN, window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN);
    const fitsBelow = displayRect.bottom + CARD_GAP + CARD_HEIGHT_ESTIMATE <= window.innerHeight - VIEWPORT_MARGIN;
    const top = fitsBelow
      ? displayRect.bottom + CARD_GAP
      : clamp(displayRect.top - CARD_GAP - CARD_HEIGHT_ESTIMATE, VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN);
    cardStyle = { top, left };
  }

  return (
    <div className="tutorial-overlay">
      {displayRect ? (
        <div
          className="tutorial-spotlight"
          style={{
            top: displayRect.top - SPOTLIGHT_PAD,
            left: displayRect.left - SPOTLIGHT_PAD,
            width: displayRect.width + SPOTLIGHT_PAD * 2,
            height: displayRect.height + SPOTLIGHT_PAD * 2,
          }}
        />
      ) : (
        <div className="tutorial-backdrop" />
      )}
      <div className="tutorial-card" style={cardStyle}>
        <button type="button" className="tutorial-card-close" onClick={onClose} title={T.tutorialClose}>
          ×
        </button>
        <div className="tutorial-step-count">{T.tutorialStepOf(index + 1, STEPS.length)}</div>
        <h3>{step.title(T)}</h3>
        <p>{step.body(T)}</p>
        <div className="tutorial-actions">
          <button type="button" className="tutorial-skip" onClick={onClose}>
            {T.tutorialSkip}
          </button>
          <div className="tutorial-nav">
            {index > 0 && (
              <button type="button" className="btn" onClick={back}>
                {T.tutorialBack}
              </button>
            )}
            <button type="button" className="btn" onClick={next}>
              {isLast ? T.tutorialFinishBtn : T.tutorialNext}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
