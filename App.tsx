
import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ClaimState, Receipt } from './types';
import { DEFAULT_CATEGORIES, MONTHS } from './constants';
import { analyzeReceipt } from './services/geminiService';
import ReceiptItem from './components/ReceiptItem';
import UnifiedPrintLayout from './components/UnifiedPrintLayout';
import ImageCropper from './components/ImageCropper';

const App: React.FC = () => {
  const [state, setState] = useState<ClaimState>({
    name: '',
    month: MONTHS[new Date().getMonth()] + ' ' + new Date().getFullYear(),
    receipts: [],
    categories: [...DEFAULT_CATEGORIES],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setCroppingImage(readerEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createInitialLayout = (index: number) => ({
    x: 10 + (index % 2) * 100,
    y: 10 + Math.floor(index / 2) * 75,
    w: 90,
    h: 65,
    page: 1
  });

  const handleManualAdd = () => {
    const newId = uuidv4();
    setState(prev => ({
      ...prev,
      receipts: [{
        id: newId,
        image: '',
        amount: 0,
        merchant: 'Manual Entry',
        date: new Date().toLocaleDateString(),
        category: 'Misc',
        isProcessing: false,
        displayWidth: 'half',
        layout: createInitialLayout(prev.receipts.length)
      }, ...prev.receipts]
    }));
  };

  const handleCropComplete = async (croppedBase64: string) => {
    const newId = uuidv4();
    const newLayout = createInitialLayout(state.receipts.length);
    
    setState(prev => ({
      ...prev,
      receipts: [{
        id: newId,
        image: croppingImage!,
        croppedImage: croppedBase64,
        amount: 0,
        merchant: 'Analyzing...',
        date: '',
        category: 'Misc',
        isProcessing: true,
        displayWidth: 'half',
        layout: newLayout
      }, ...prev.receipts]
    }));
    setCroppingImage(null);
    setIsProcessing(true);

    try {
      const analysis = await analyzeReceipt(croppedBase64, state.categories);
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.map(r => 
          r.id === newId 
            ? { ...r, ...analysis, isProcessing: false } 
            : r
        )
      }));
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.map(r => r.id === newId ? { ...r, merchant: 'Analysis Failed', isProcessing: false } : r)
      }));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setCroppingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const onUpdate = (id: string, updates: Partial<Receipt>) => {
    setState(prev => ({
      ...prev,
      receipts: prev.receipts.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const onRemove = (id: string) => {
    setState(prev => ({
      ...prev,
      receipts: prev.receipts.filter(r => r.id !== id)
    }));
  };

  const onAddNewCategory = () => {
    const newCat = prompt("Enter new category name:");
    if (newCat && !state.categories.includes(newCat)) {
      setState(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      <nav className="bg-white border-b sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tighter text-blue-900 italic">SmartClaim.</span>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
            <button 
              onClick={() => setViewMode('edit')}
              className={`px-5 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
            >
              SCANNER
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={`px-5 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
            >
              PREVIEW
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {viewMode === 'edit' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <label className="block text-[11px] font-black text-blue-900 uppercase tracking-[0.2em] mb-4">Staff Member</label>
                <input 
                  type="text" 
                  value={state.name} 
                  onChange={e => setState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Employee Full Name"
                  className="w-full text-2xl font-black bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 rounded-2xl px-6 py-4 outline-none transition-all placeholder:text-gray-200"
                />
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <label className="block text-[11px] font-black text-blue-900 uppercase tracking-[0.2em] mb-4">Billing Cycle</label>
                <input 
                  type="text" 
                  value={state.month} 
                  onChange={e => setState(prev => ({ ...prev, month: e.target.value }))}
                  placeholder="Month & Year"
                  className="w-full text-2xl font-black bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 rounded-2xl px-6 py-4 outline-none transition-all placeholder:text-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
              
              <button 
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all group active:scale-95 shadow-sm"
              >
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Snap Receipt</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-white hover:border-green-500 hover:bg-green-50/50 transition-all group active:scale-95 shadow-sm"
              >
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Upload Image</span>
              </button>

              <button 
                onClick={handleManualAdd}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-white hover:border-orange-500 hover:bg-orange-50/50 transition-all group active:scale-95 shadow-sm"
              >
                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Manual Fill</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end border-b-4 border-gray-100 pb-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Transaction Ledger</h3>
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Claimable</div>
                  <div className="text-4xl font-black text-blue-900 tabular-nums">RM {state.receipts.reduce((a, b) => a + b.amount, 0).toFixed(2)}</div>
                </div>
              </div>
              
              <div className="grid gap-6">
                {state.receipts.length === 0 ? (
                  <div className="text-center py-32 bg-white rounded-[40px] border border-gray-100 shadow-sm border-dashed border-2">
                    <p className="text-gray-300 font-black text-lg uppercase tracking-widest opacity-40">Ready for scanning</p>
                  </div>
                ) : (
                  state.receipts.map(r => (
                    <ReceiptItem key={r.id} receipt={r} categories={state.categories} onUpdate={onUpdate} onRemove={onRemove} onAddNewCategory={onAddNewCategory} />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12 py-10 mb-20 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] print:shadow-none print:m-0 border border-gray-100 transition-transform">
               <UnifiedPrintLayout 
                  state={state} 
                  onUpdateReceipt={onUpdate} 
                  onUpdateLayout={(id, layout) => onUpdate(id, { layout })}
                />
            </div>
            <button 
              onClick={() => window.print()} 
              className="fixed bottom-10 right-10 bg-blue-600 text-white px-10 py-5 rounded-[30px] shadow-2xl hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all flex items-center gap-4 print:hidden z-50 border-4 border-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 012-2H5a2 2 0 012 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="font-black uppercase tracking-widest text-sm">Download Claim Set</span>
            </button>
          </div>
        )}
      </main>

      {croppingImage && <ImageCropper src={croppingImage} onComplete={handleCropComplete} onCancel={handleCropCancel} />}
    </div>
  );
};

export default App;
