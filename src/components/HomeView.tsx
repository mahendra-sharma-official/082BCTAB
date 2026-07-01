import React, { useEffect, useState } from "react";
import { Calendar, ArrowRight, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
}

// 🔥 VITE MAGIC: Automatically reads every file inside your root 'pics' folder at build time
const imagesGlob = import.meta.glob("/pics/*.{png,jpg,jpeg,webp}", { eager: true });
const SLIDESHOW_IMAGES = Object.values(imagesGlob).map((mod: any) => mod.default || mod);

export default function HomeView({ onNavigate, isAuthenticated, onOpenAuth }: HomeViewProps) {
  const [stats, setStats] = useState({ students: 0, projects: 0, events: 0 });
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  // Fallback if the folder scan comes up completely empty
  const activeImages = SLIDESHOW_IMAGES.length > 0 ? SLIDESHOW_IMAGES : ["pp.jpg"];

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersSnap, projectsSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "events")),
        ]);
        setStats({ students: usersSnap.size, projects: projectsSnap.size, events: eventsSnap.size });
      } catch (err) {
        console.error("Error fetching homepage stats:", err);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeImages.length <= 1) return;
    const rotationInterval = setInterval(() => {
      triggerSlideTransition((prev) => (prev + 1) % activeImages.length);
    }, 6000);
    return () => clearInterval(rotationInterval);
  }, [activeImages.length]);

  const triggerSlideTransition = (nextIndexValue: number | ((prev: number) => number)) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlideIdx(nextIndexValue);
      setIsFading(false);
    }, 250);
  };

  const handleManualPrev = () => {
    if (isFading) return;
    triggerSlideTransition((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  const handleManualNext = () => {
    if (isFading) return;
    triggerSlideTransition((prev) => (prev + 1) % activeImages.length);
  };

  const handleNavigate = (tab: string) => {
    if (isAuthenticated) onNavigate(tab);
    else onOpenAuth();
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in selection:bg-amber-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-[#E5E5E5] pb-12">
        
        {/* Left Hero Core Content */}
        <div className="lg:col-span-7 flex flex-col justify-between pr-0 lg:border-r lg:border-[#E5E5E5] lg:pr-12">
          <div>
            <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-4">
              Tribhuvan University • Institute of Engineering
            </span>
            <h1 className="text-[70px] sm:text-[90px] md:text-[105px] leading-[0.85] font-black tracking-tighter mb-8 italic">
              The <br/>Batch <br/><span className="bg-[#F4C430] px-4 not-italic text-[#111111] relative inline-block shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">082.</span>
            </h1>
            <p className="text-xl sm:text-2xl leading-tight text-[#111111] max-w-lg mb-8 font-serif">
              Department of Computer Engineering, Pulchowk Campus. A collective of computer engineers building next-generation architectures, frameworks, and peer networks.
            </p>
          </div>

          <div className="space-y-4 border-t border-[#111111] pt-8 mt-4">
            <div className="flex justify-between items-end border-b border-dashed border-neutral-200 pb-1.5 mb-2">
              <h2 className="font-sans text-[9px] font-black uppercase tracking-[0.25em] text-[#111111]">
                Directory Core Sub-Indexes
              </h2>
              <span className="text-[9px] font-mono font-bold text-neutral-400">// AUTHORIZED_NODES</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div onClick={() => handleNavigate("profiles")} className="group cursor-pointer border border-[#E5E5E5] p-4 bg-white hover:border-[#111111] hover:shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all rounded-[1px]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-sans text-[9px] font-bold border border-black px-1 text-neutral-800">01</span>
                  <ArrowRight className="w-3 h-3 text-neutral-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-tight text-neutral-900 group-hover:underline">The Clan Profiles</h4>
              </div>

              <div onClick={() => handleNavigate("explore")} className="group cursor-pointer border border-[#E5E5E5] p-4 bg-white hover:border-[#111111] hover:shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all rounded-[1px]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-sans text-[9px] font-bold border border-black px-1 text-neutral-800">02</span>
                  <ArrowRight className="w-3 h-3 text-neutral-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-tight text-neutral-900 group-hover:underline">Build Matrix</h4>
              </div>

              <div onClick={() => handleNavigate("events")} className="group cursor-pointer border border-[#E5E5E5] p-4 bg-white hover:border-[#111111] hover:shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all rounded-[1px]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-sans text-[9px] font-bold border border-black px-1 text-neutral-800">03</span>
                  <ArrowRight className="w-3 h-3 text-neutral-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-tight text-neutral-900 group-hover:underline">Milestones</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - AUTOMATIC SLIDESHOW MATRIX PANEL */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="relative group/cover border border-[#111111] bg-neutral-50 p-3 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] transition-transform duration-300">
            
            <div className="flex justify-between items-center border-b border-[#111111] pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-[9px] font-sans font-bold uppercase tracking-widest text-neutral-500">
                <Camera className="w-3.5 h-3.5 text-amber-500" /> // AUTOMATED_FOLDER_GALLERY
              </div>
              <span className="text-[8px] font-mono bg-neutral-900 text-white px-1 py-0.5 tracking-tight font-semibold rounded-[1px]">
                NODE: {currentSlideIdx + 1} / {activeImages.length}
              </span>
            </div>

            <div className="relative w-full h-[320px] md:h-[380px] bg-neutral-950 border border-neutral-900 overflow-hidden grayscale group-hover/cover:grayscale-0 transition-all duration-500 shadow-inner">
              <img 
                src={activeImages[currentSlideIdx]} 
                alt="Dynamic Registry File" 
                className={`w-full h-full object-cover transform scale-100 group-hover/cover:scale-[1.02] transition-all duration-300 ${
                  isFading ? "opacity-30 scale-[0.99]" : "opacity-100"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none opacity-80" />

              {activeImages.length > 1 && (
                <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between items-center z-10 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
                  <button onClick={handleManualPrev} className="p-1 border border-white/40 bg-black/60 text-white hover:bg-black hover:border-white transition-all rounded-[1px]">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleManualNext} className="p-1 border border-white/40 bg-black/60 text-white hover:bg-black hover:border-white transition-all rounded-[1px]">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 bg-white border border-[#111111] p-2.5 font-mono text-[10px] text-neutral-700 relative">
              <div className="absolute top-0.5 right-1.5 text-neutral-300 font-bold text-xs select-none">■</div>
              <p className="font-bold text-neutral-900 uppercase tracking-tight">// ACTIVE RESOURCE LINK:</p>
              <p className="font-serif italic text-neutral-600 leading-tight mt-0.5 truncate">
                "{activeImages[currentSlideIdx]}" parsed and mounted to dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-dashed border-neutral-200 pt-4 font-mono text-xs">
            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-[1px]">
              <span className="block text-[8px] text-neutral-400 font-bold uppercase tracking-wider mb-1">FEATURED SPEC</span>
              <h5 className="font-bold uppercase tracking-tight text-neutral-900 leading-none">Engineers</h5>
              <p className="text-[10px] font-serif text-neutral-500 mt-1 leading-tight">Coordinated nerds.</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-[1px]">
              <span className="block text-[8px] text-neutral-400 font-bold uppercase tracking-wider mb-1">NODE REGISTRY</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-neutral-950 leading-none tracking-tighter">{stats.students || 48}</span>
                <span className="text-[10px] text-neutral-500 font-serif italic">verified nodes</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Vital Statistics Footer Row */}
      <div className="py-10 border-b border-[#E5E5E5] grid grid-cols-3 gap-6 text-center">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">Registered Members</span>
          <div className="text-4xl font-sans font-extrabold text-[#111111]">{stats.students || "—"}</div>
        </div>
        <div className="border-x border-[#E5E5E5]">
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">Projects Indexed</span>
          <div className="text-4xl font-sans font-extrabold text-[#111111]">{stats.projects || "—"}</div>
        </div>
        <div className="none sm:block">
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">Logged Events</span>
          <div className="text-4xl font-sans font-extrabold text-[#111111]">{stats.events || "—"}</div>
        </div>
      </div>

      {/* Mission Statement Block */}
      <div className="py-12 flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="max-w-xl">
          <h4 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[#111111] mb-3">Core Philosophy & Mission</h4>
          <p className="text-lg font-serif italic text-[#111111]/90 leading-relaxed">
            To build a digital space where Pulchowk students can collaborate without the chaos, share ideas freely, organise events, review each other's work, and have conversations that go beyond assignments. Whether you're looking for teammates, advice, friends, or just someone to remind you that the deadline is tomorrow, this is where the class comes together.
          </p>
        </div>
        <div className="bg-[#F4C430] text-[#111111] p-6 border border-[#111111] self-stretch flex flex-col justify-between md:w-64 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 text-neutral-900/10 font-black text-6xl select-none font-mono">BCT</div>
          <span className="font-sans text-[9px] font-bold uppercase tracking-widest block mb-4">Secured Base Node</span>
          <div>
            <span className="font-sans text-xs font-black uppercase tracking-wider block">PCAMPUS BCT DEPT</span>
            <span className="text-[10px] font-sans text-[#111111]/70 block mt-1">ESTABLISHED 2026</span>
          </div>
        </div>
      </div>

    </div>
  );
}