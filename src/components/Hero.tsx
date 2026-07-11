import { Play, ShieldCheck, Sparkles, Tv, Flame } from "lucide-react";

interface HeroProps {
  onExploreClick: () => void;
  onWholesaleClick: () => void;
}

export default function Hero({ onExploreClick, onWholesaleClick }: HeroProps) {
  return (
    <div className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
      {/* Decorative background glow circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-blue-400 text-xs font-semibold mb-6 animate-bounce">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>N°1 de l'IPTV Premium & Grossiste en Algérie</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none max-w-4xl mx-auto">
            Abonnements <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent">IPTV Stables</span> & Matériel Haute Qualité
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Profitez du meilleur du divertissement sans coupures. Vente au détail et tarifs préférentiels pour revendeurs (grossistes) avec serveurs Dino, 8K, V12 et Golden OTT.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Acheter un abonnement (Détail)</span>
            </button>
            <button
              onClick={onWholesaleClick}
              className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl font-semibold border border-gray-700 hover:border-gray-600 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Devenir Revendeur (Gros)</span>
            </button>
          </div>

          {/* Stats Badges Row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-card p-4 rounded-xl text-center">
              <span className="block text-2xl font-bold font-display text-blue-400">5 Minutes</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-medium mt-1 block">Activation Rapide</span>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <span className="block text-2xl font-bold font-display text-indigo-400">99.9%</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-medium mt-1 block">Stabilité Serveur</span>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <span className="block text-2xl font-bold font-display text-amber-400">24h / 7j</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-medium mt-1 block">Support Technique</span>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <span className="block text-2xl font-bold font-display text-emerald-400">100% Sûr</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-medium mt-1 block">BaridiMob & CCP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
