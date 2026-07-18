import { useState, useEffect, useRef, Fragment } from "react";
import { Play, Sparkles, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

interface HeroSlide {
  id: string;
  badge?: string;
  title: string;
  highlightWord?: string;
  buttonText: string;
  imageUrl: string;
  productId?: string;
  linkUrl?: string;
  isNew?: boolean;
  order: number;
}

interface HeroProps {
  onExploreClick: () => void;
  onWholesaleClick: () => void;
  onSlideClick?: (slide: { productId?: string; linkUrl?: string }) => void;
}

const AUTO_ADVANCE_MS = 5000;

export default function Hero({ onExploreClick, onWholesaleClick, onSlideClick }: HeroProps) {
  const { t } = useTranslation();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/hero-slides")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setSlides(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
  };

  const goPrev = () => goTo((current - 1 + slides.length) % slides.length);
  const goNext = () => goTo((current + 1) % slides.length);

  // Tant que le chargement n'est pas terminé, ou si aucune slide n'existe
  // (catalogue vide côté admin), on affiche le contenu par défaut traduit
  // pour ne jamais laisser la page d'accueil vide.
  if (!loaded || slides.length === 0) {
    return (
      <div className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full text-blue-700 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{t("hero.badge")}</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none max-w-4xl mx-auto">
              {t("hero.title_1")} <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">{t("hero.title_2")}</span> {t("hero.title_3")}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{t("hero.cta_buy")}</span>
              </button>
              <button
                onClick={onWholesaleClick}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 rounded-xl font-semibold border border-slate-200 hover:border-slate-300 shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>{t("hero.cta_wholesaler")}</span>
              </button>
            </div>
          </div>
        </div>
        <StatsRow t={t} />
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="relative overflow-hidden pt-8 pb-16 md:pt-10 md:pb-24">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-slate-50 to-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center min-h-[380px]">
            {/* Texte + CTA */}
            <div key={slide.id} className="p-8 sm:p-12 space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
              {slide.badge && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  {slide.badge}
                </span>
              )}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {slide.highlightWord && slide.title.includes(slide.highlightWord) ? (
                  <>
                    {slide.title.split(slide.highlightWord).map((part, i, arr) => (
                      <Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                            {slide.highlightWord}
                          </span>
                        )}
                      </Fragment>
                    ))}
                  </>
                ) : (
                  slide.title
                )}
                {slide.isNew && (
                  <span className="ml-2 align-super text-sm font-black text-amber-500">NEW</span>
                )}
              </h2>
              <button
                onClick={() => onSlideClick && onSlideClick({ productId: slide.productId, linkUrl: slide.linkUrl })}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:-translate-y-0.5 inline-flex items-center space-x-2 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{slide.buttonText}</span>
              </button>
            </div>

            {/* Image */}
            <div key={slide.id + "-img"} className="relative h-64 md:h-full p-6 flex items-center justify-center animate-in fade-in duration-700">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />
            </div>
          </div>

          {/* Navigation flèches (si plus d'une slide) */}
          {slides.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                title="Précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                title="Suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Pagination (points) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => goTo(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === current ? "w-6 bg-blue-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <StatsRow t={t} />
    </div>
  );
}

function StatsRow({ t }: { t: (key: string) => string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
          <span className="block text-2xl font-bold font-display text-blue-600">5 Minutes</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1.5 block">{t("hero.stat_activation")}</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
          <span className="block text-2xl font-bold font-display text-indigo-600">99.9%</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1.5 block">{t("hero.stat_stability")}</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
          <span className="block text-2xl font-bold font-display text-amber-600">24h / 7j</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1.5 block">{t("hero.stat_support")}</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
          <span className="block text-2xl font-bold font-display text-emerald-600">100% {t("hero.stat_secure")}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1.5 block">BaridiMob</span>
        </div>
      </div>
    </div>
  );
}
