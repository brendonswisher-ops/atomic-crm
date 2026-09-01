/** Same Swiss Alps still used on deepfieldstms.com. */
export const SWISS_ALPS_BG =
  "https://www.deepfieldstms.com/images/swiss-alps-bg.png";

export const AlpsBackdrop = () => (
  <>
    <div
      className="absolute inset-0 bg-cover bg-no-repeat"
      style={{
        backgroundImage: `url(${SWISS_ALPS_BG})`,
        backgroundPosition: "50% 60%",
      }}
      aria-hidden
    />
    <div className="absolute inset-0 bg-[#0A1428]/70" aria-hidden />
  </>
);
