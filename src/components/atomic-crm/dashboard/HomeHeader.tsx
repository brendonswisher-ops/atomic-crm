import { useTranslate } from "ra-core";

/**
 * Deep Field Capital AG mark, copied from the public site header
 * (https://www.deepfieldstms.com): gold DF square, navy wordmark,
 * Swiss-red bullet, Zürich.
 */
export const HomeHeader = () => {
  const translate = useTranslate();

  return (
    <div className="relative overflow-hidden rounded-xl px-5 py-5 md:px-6 md:py-6 bg-[#0A1428]">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8942E] rounded-lg flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
            <span className="text-[#0A1428] font-bold text-base tracking-tight">
              DF
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-base tracking-tight">
              {translate("crm.dashboard.wordmark", {
                _: "Deep Field Capital AG",
              })}
            </span>
            <span className="text-[#DA291C] text-lg leading-none">
              {"\u2022"}
            </span>
            <span className="text-[#8B9DB8] font-light text-sm">
              {translate("crm.dashboard.zurich", { _: "Z\u00fcrich" })}
            </span>
          </div>
          <p className="text-sm font-medium tracking-wide mt-0.5 text-[#D4AF37]">
            {translate("crm.dashboard.raise_title", { _: "STMS raise" })}
          </p>
        </div>
      </div>
    </div>
  );
};
