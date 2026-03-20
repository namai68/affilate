
import React, { useState, useEffect, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import KocReviewModule from './modules/KocReviewModule';
import NonFaceReviewModule from './modules/NonFaceReviewModule';
import NonFaceReviewModule2 from './modules/NonFaceReviewModule2';
import Shopee8sModule from './modules/Shopee8sModule';
import CoverLinkModule from './modules/CoverLinkModule';
import CarouselModule from './modules/CarouselModule';
import VideoPovModule from './modules/VideoPovModule';
import Review1kModule from './modules/Review1kModule';
import PersonificationModule from './modules/PersonificationModule';
import Personification2Module from './modules/Personification2Module';
import Fashion16sModule from './modules/Fashion16sModule';
import FashionTrackingModule from './modules/FashionTrackingModule';
import VuaTvModule from './modules/VuaTvModule';
import DhbcModule from './modules/DhbcModule';
import TimelapseModule from './modules/TimelapseModule';
import ReviewDoiThoaiModule from './modules/ReviewDoiThoaiModule';
import LoginModule from './modules/LoginModule';

type ModuleTab = 'koc' | 'nonface' | 'nonface2' | 'shopee8s' | 'review1k' | 'videopov' | 'carousel' | 'fashion16s' | 'fashiontracking' | 'personification' | 'personification2' | 'coverlink' | 'dhbc' | 'vuatv' | 'timelapse' | 'reviewdoithoai';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<ModuleTab>('koc');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleExportReady = (e: any) => {
      const { data, moduleName } = e.detail;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${moduleName}_export_${new Date().getTime()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    };

    const handleImportProgress = (e: any) => {
      const { percent, complete } = e.detail;
      setImportProgress(percent);
      if (percent > 0 && !complete) {
        setIsImporting(true);
      }
      if (complete) {
        setTimeout(() => {
          setIsImporting(false);
          setImportProgress(0);
        }, 800);
      }
    };

    window.addEventListener('EXPORT_DATA_READY', handleExportReady);
    window.addEventListener('IMPORT_DATA_PROGRESS', handleImportProgress);
    
    return () => {
      window.removeEventListener('EXPORT_DATA_READY', handleExportReady);
      window.removeEventListener('IMPORT_DATA_PROGRESS', handleImportProgress);
    };
  }, []);

  const triggerExport = () => {
    window.dispatchEvent(new CustomEvent('REQUEST_EXPORT_DATA'));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        setIsImporting(true);
        setImportProgress(0);
        window.dispatchEvent(new CustomEvent('REQUEST_IMPORT_DATA', { detail: jsonData }));
      } catch (err) {
        alert("File JSON không đúng định dạng!");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderActiveModule = () => {
    switch(currentTab) {
      case 'koc': return <KocReviewModule />;
      case 'nonface': return <NonFaceReviewModule />;
      case 'nonface2': return <NonFaceReviewModule2 />;
      case 'shopee8s': return <Shopee8sModule />;
      case 'review1k': return <Review1kModule />;
      case 'videopov': return <VideoPovModule />;
      case 'carousel': return <CarouselModule />;
      case 'fashion16s': return <Fashion16sModule />;
      case 'fashiontracking': return <FashionTrackingModule />;
      case 'personification': return <PersonificationModule />;
      case 'personification2': return <Personification2Module />;
      case 'coverlink': return <CoverLinkModule />;
      case 'dhbc': return <DhbcModule />;
      case 'vuatv': return <VuaTvModule />;
      case 'timelapse': return <TimelapseModule />;
      case 'reviewdoithoai': return <ReviewDoiThoaiModule />;
      default: return <KocReviewModule />;
    }
  };

  const tabs: { id: ModuleTab; label: string; icon: React.ReactNode }[] = [
    { id: 'koc', label: 'KOC Review', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'nonface', label: 'Review (Non-face)', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { id: 'reviewdoithoai', label: 'Review Đối Thoại', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
    { id: 'nonface2', label: 'Review Giày Dép', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012v2M7 7h10" /></svg> },
    { id: 'fashiontracking', label: 'Fashion Tracking', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 4L9 7" /></svg> },
    { id: 'personification', label: 'Nhân Hóa Review', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'personification2', label: 'Nhân Hóa (Kiến thức)', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { id: 'videopov', label: 'StoryTelling (POV)', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: 'carousel', label: 'Ảnh Cuộn Tiktok', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: 'shopee8s', label: 'Shopee Video', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66-1.34-3-3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H9c0 1.66 1.34 3 3 3s3-1.34 3-3h-2c0 1.66-1.34-3-3 3z"/></svg> },
    { id: 'coverlink', label: 'Cover Link Shopee', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
    { id: 'timelapse', label: 'Timelapse (Tua nhanh)', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'dhbc', label: 'Đuổi Hình Bắt Chữ', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a2 2 0 110 4h-1a2 2 0 00-2 2v1a2 2 0 11-4 0V11a2 2 0 11-4 0V11a2 2 0 00-2-2H7a2 2 0 110-4h1a2 2 0 110-4h1a2 2 0 002-2V4z" /></svg> },
    { id: 'vuatv', label: 'Vua Tiếng Việt', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
  ];

  const handleLogin = (apiKey: string) => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginModule onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-orange-50/30 flex flex-col relative font-['Inter']">
        <nav className="bg-gradient-to-r from-orange-600 to-red-600 border-b border-orange-400/20 sticky top-0 z-[100] h-20 flex items-center shadow-xl">
          <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4 shrink-0">
                  <button 
                    onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors mr-2 flex items-center gap-2 group"
                    title={isSidebarExpanded ? "Thu gọn menu" : "Mở rộng menu"}
                  >
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarExpanded ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                      {isSidebarExpanded ? "Thu gọn menu" : "Mở rộng menu"}
                    </span>
                  </button>
                  <div className="relative w-14 h-12 flex items-center">
                      <div className="absolute left-0 top-1 w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg transform -rotate-12 border border-orange-200">
                          <svg className="w-6 h-6 text-orange-700" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66-1.34-3-3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H9c0 1.66 1.34 3 3 3s3-1.34 3-3h-2c0 1.66-1.34-3-3 3z"/></svg>
                      </div>
                      <div className="absolute left-5 top-0 w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-xl border border-orange-400 transform rotate-12 z-10 transition-transform hover:rotate-0 duration-500">
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V14c0 1.39-.24 2.77-.92 4-1.14 2.1-3.41 3.52-5.76 3.75-2.29.23-4.73-.61-6.22-2.39-1.48-1.78-1.89-4.38-1.04-6.52.85-2.14 2.92-3.71 5.21-3.95v4c-.81.14-1.61.64-2 1.38-.4.75-.41 1.7-.1 2.47.33.82 1.05 1.48 1.93 1.66 1.01.21 2.15-.12 2.8-.93.38-.47.56-1.07.56-1.67V.02z"/></svg>
                      </div>
                  </div>
                  <div className="flex flex-col leading-none">
                      <span className="text-white font-black text-2xl tracking-tighter uppercase whitespace-nowrap">KOC <span className="text-orange-200">STUDIO by Nam Lê</span></span>
                      <span className="text-orange-100 font-bold text-[10px] tracking-[0.25em] uppercase mt-0.5 whitespace-nowrap opacity-80">AI FOR AFFILIATE</span>
                  </div>

                  {/* Banner Quảng Cáo */}
                  <div className="hidden lg:flex items-center ml-10 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 px-6 py-2 rounded-2xl border border-white/20 shadow-lg gap-4 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                      <div className="absolute inset-0 bg-pattern opacity-30"></div>
                      <div className="flex items-center gap-4 relative z-10">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10">
                              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><path d="M2 11h20"></path><path d="M7 7V3"></path><path d="M17 7V3"></path></svg>
                          </div>
                          <span className="text-white font-black text-[11px] uppercase tracking-tight">MUA KHÓA HỌC CAPCUT VÀ TÀI KHOẢN <span className="text-yellow-400">PRO</span> LIÊN HỆ</span>
                          <div className="bg-white px-4 py-1.5 rounded-full shadow-md">
                              <span className="text-purple-700 font-black text-[12px]">NAM AI 098.102.8794</span>
                          </div>
                          <div className="bg-black/30 px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10 backdrop-blur-sm">
                              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                              <span className="text-white font-black text-[10px] uppercase tracking-wider">GIÁ RẺ - UY TÍN</span>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAuthenticated(false)} 
                  className="p-2 text-orange-100 hover:text-white transition-colors group flex flex-col items-center"
                  title="Đăng xuất"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
          </div>
        </nav>

        {/* Mobile Banner Marquee */}
        <div className="lg:hidden bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 py-2 overflow-hidden border-b border-white/10">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee-slow">
                <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><path d="M2 11h20"></path><path d="M7 7V3"></path><path d="M17 7V3"></path></svg>
                    <span className="text-white font-black text-[10px] uppercase tracking-tight">MUA KHÓA HỌC CAPCUT VÀ TÀI KHOẢN <span className="text-yellow-400">PRO</span> LIÊN HỆ <span className="text-orange-200">NAM AI 098.102.8794</span> - GIÁ RẺ - UY TÍN</span>
                </div>
                <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><path d="M2 11h20"></path><path d="M7 7V3"></path><path d="M17 7V3"></path></svg>
                    <span className="text-white font-black text-[10px] uppercase tracking-tight">MUA KHÓA HỌC CAPCUT VÀ TÀI KHOẢN <span className="text-yellow-400">PRO</span> LIÊN HỆ <span className="text-orange-200">NAM AI 098.102.8794</span> - GIÁ RẺ - UY TÍN</span>
                </div>
                <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><path d="M2 11h20"></path><path d="M7 7V3"></path><path d="M17 7V3"></path></svg>
                    <span className="text-white font-black text-[10px] uppercase tracking-tight">MUA KHÓA HỌC CAPCUT VÀ TÀI KHOẢN <span className="text-yellow-400">PRO</span> LIÊN HỆ <span className="text-orange-200">NAM AI 098.102.8794</span> - GIÁ RẺ - UY TÍN</span>
                </div>
            </div>
        </div>

        <div className="flex flex-1 relative">
          {/* Sidebar */}
          <aside className={`bg-white border-r border-orange-100 sticky top-20 h-[calc(100vh-5rem)] z-40 transition-all duration-300 ease-in-out flex flex-col ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
            <div className="flex-1 overflow-y-auto py-6 px-3 no-scrollbar">
              <div className="flex flex-col gap-2">
                {tabs.map((t) => (
                  <button 
                    key={t.id} 
                    onClick={() => setCurrentTab(t.id)} 
                    className={`w-full rounded-xl transition-all flex items-center gap-3 p-3 group ${currentTab === t.id ? 'bg-orange-600 text-white shadow-lg' : 'text-orange-900/60 hover:bg-orange-50'}`}
                    title={!isSidebarExpanded ? t.label : ""}
                  >
                    <span className={`shrink-0 transition-transform duration-300 ${currentTab === t.id ? 'text-white scale-110' : 'text-orange-400 group-hover:scale-110'}`}>
                      {t.icon}
                    </span>
                    {isSidebarExpanded && (
                      <span className={`text-xs font-bold tracking-tight whitespace-nowrap overflow-hidden transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>
                        {t.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="max-w-5xl mx-auto w-full px-6 pt-6">
              <div className="bg-white rounded-2xl border border-orange-100 py-3 px-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 border border-orange-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  </div>
                  <div className="leading-tight">
                    <h4 className="text-[10px] font-black text-orange-900/40 uppercase tracking-widest">HỆ THỐNG DỮ LIỆU</h4>
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-tighter italic">Import / Export Local Project</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 text-[9px] font-black rounded-xl hover:bg-orange-100 transition-all active:scale-95 uppercase tracking-widest border border-orange-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-3 3m3-3l3 3" strokeWidth="2.5" /></svg>
                    Tải Dự Án
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="application/json" />
                  
                  <button 
                    onClick={triggerExport}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[9px] font-black rounded-xl hover:shadow-orange-200/50 transition-all shadow-md active:scale-95 uppercase tracking-widest"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v8m0 0l-3-3m3 3l3-3" strokeWidth="2.5" /></svg>
                    Xuất File JSON
                  </button>
                </div>
              </div>
            </div>
            
            <main className="flex-1 pb-32">
              {renderActiveModule()}
            </main>
          </div>
        </div>

        <footer className="bg-white border-t border-orange-100 py-4 fixed bottom-0 left-0 right-0 z-[60]">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center">
            <div className="text-orange-400 font-bold text-[12px] tracking-tight uppercase">By Nam Lê 098.102.8794</div>
          </div>
        </footer>

        {isImporting && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-orange-900/80 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-orange-100 animate-fadeIn">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-orange-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <h3 className="text-xl font-black text-orange-900 uppercase tracking-tighter mb-2">Đang nạp dữ liệu...</h3>
              <div className="relative h-4 bg-orange-100 rounded-full overflow-hidden mb-4 border border-orange-200">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(249,115,22,0.3)]" style={{ width: `${importProgress}%` }} />
              </div>
              <span className="text-3xl font-black text-orange-600 tabular-nums">{importProgress}%</span>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
