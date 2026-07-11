import React, { useState } from "react";
import { VideoTutorial } from "../types";
import { Video, Tv, Smartphone, Flame, Monitor, Play, CheckCircle } from "lucide-react";

interface InstallationTutorialsProps {
  tutorials: VideoTutorial[];
}

export default function InstallationTutorials({ tutorials }: InstallationTutorialsProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | "smart_tv" | "android" | "firestick" | "other">("all");
  const [activeVideo, setActiveVideo] = useState<VideoTutorial | null>(null);

  const filteredTutorials = tutorials.filter(
    t => activeCategory === "all" || t.category === activeCategory
  );

  React.useEffect(() => {
    if (tutorials.length > 0 && !activeVideo) {
      setActiveVideo(tutorials[0]);
    }
  }, [tutorials]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center space-x-1 mb-1">
            <Video className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
            <span>Tutoriels d'Installation Vidéo</span>
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-900">Guides de Configuration & Codes Downloader</h2>
          <p className="text-slate-500 text-xs mt-1">
            Découvrez nos vidéos explicatives pas-à-pas pour configurer votre abonnement sur Smart TV, Firestick ou Box Android.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 mt-4 md:mt-0 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: "all", label: "Tous", icon: Video },
            { id: "smart_tv", label: "Smart TV", icon: Tv },
            { id: "firestick", label: "Firestick", icon: Flame },
            { id: "android", label: "Box/Tel Android", icon: Smartphone },
            { id: "other", label: "Autres", icon: Monitor }
          ].map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tutorials.length === 0 ? (
        <div className="text-center py-12 p-8 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
          <Video className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="text-xs">Aucun tutoriel disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Player */}
          <div className="lg:col-span-2 space-y-4">
            {activeVideo ? (
              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xl">
                  <iframe
                    src={activeVideo.url}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[9px] bg-blue-50 text-blue-600 border border-blue-200 rounded-md font-mono uppercase">
                      {activeVideo.category.replace("_", " ")}
                    </span>
                    <span>{activeVideo.title}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {activeVideo.description}
                  </p>

                  {/* Downloader Code Callout */}
                  {activeVideo.downloaderCode && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 flex items-center space-x-1.5">
                          <Flame className="h-4 w-4 text-amber-600" />
                          <span>Code Downloader by AFTVnews</span>
                        </h4>
                        <p className="text-[10px] text-slate-600 mt-1">
                          Entrez ce code directement dans l'application Downloader de votre Firestick/TV pour installer l'application.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 bg-white border border-amber-300 rounded-lg px-3.5 py-1.5 font-mono text-amber-700 font-extrabold text-sm shadow-sm tracking-widest">
                        <span>{activeVideo.downloaderCode}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                Sélectionnez un tutoriel pour commencer la lecture.
              </div>
            )}
          </div>

          {/* Playlist Side column */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Liste des Guides ({filteredTutorials.length})
            </h4>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredTutorials.map(tut => {
                const isActive = activeVideo?.id === tut.id;
                return (
                  <button
                    key={tut.id}
                    onClick={() => setActiveVideo(tut)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3 cursor-pointer ${
                      isActive
                        ? "bg-blue-50 border-blue-400 text-slate-900 shadow-md"
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <h5 className={`text-xs leading-snug truncate ${isActive ? "font-bold text-slate-900" : "font-semibold"}`}>
                        {tut.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                        {tut.description}
                      </p>
                      {tut.downloaderCode && (
                        <span className="inline-flex items-center space-x-1 text-[8px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono mt-1">
                          <Flame className="h-2.5 w-2.5 text-amber-600" />
                          <span>Code AFTV: {tut.downloaderCode}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
