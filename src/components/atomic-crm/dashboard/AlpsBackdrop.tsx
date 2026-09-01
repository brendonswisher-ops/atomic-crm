/** Same Swiss Alps still used on deepfieldstms.com. */
export const SWISS_ALPS_BG =
  "https://www.deepfieldstms.com/images/swiss-alps-bg.png";

/**
 * Viewport-fixed so iOS cannot clip it inside overflow-y-auto.
 * Uses a real img; empty CSS-background divs often do not paint on Safari.
 */
export const AlpsBackdrop = () => (
  <div
    className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    aria-hidden
  >
    <img
      src={SWISS_ALPS_BG}
      alt=""
      className="h-full w-full object-cover"
      style={{ objectPosition: "50% 60%" }}
    />
    <div className="absolute inset-0 bg-[#0A1428]/70" />
  </div>
);
