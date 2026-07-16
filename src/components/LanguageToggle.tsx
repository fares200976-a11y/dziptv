import React from "react";
import { useTranslation } from "../i18n/LanguageContext";

interface LanguageToggleProps {
  variant?: "dark" | "light";
  className?: string;
}

// Petit sélecteur FR/AR réutilisable partout (boutique, revendeur, admin).
export default function LanguageToggle({ variant = "dark", className = "" }: LanguageToggleProps) {
  const { lang, setLang } = useTranslation();

  const base = "flex items-center rounded-lg overflow-hidden border text-[11px] font-bold select-none";
  const theme = variant === "light"
    ? "border-slate-300 bg-white"
    : "border-gray-700 bg-gray-900";

  const btnBase = "px-2.5 py-1.5 transition-colors cursor-pointer";
  const activeLight = "bg-blue-600 text-white";
  const inactiveLight = "text-slate-500 hover:bg-slate-100";
  const activeDark = "bg-indigo-600 text-white";
  const inactiveDark = "text-gray-400 hover:bg-gray-800";

  return (
    <div className={`${base} ${theme} ${className}`}>
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={`${btnBase} ${lang === "fr" ? (variant === "light" ? activeLight : activeDark) : (variant === "light" ? inactiveLight : inactiveDark)}`}
        title="Français"
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang("ar")}
        className={`${btnBase} ${lang === "ar" ? (variant === "light" ? activeLight : activeDark) : (variant === "light" ? inactiveLight : inactiveDark)}`}
        title="العربية"
      >
        AR
      </button>
    </div>
  );
}
