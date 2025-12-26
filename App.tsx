
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCroppingImage(result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualAdd = () => {
    const tempId = uuidv4();
    const newReceipt: Receipt = {
      id: tempId,
      image: '', 
      amount: 0,
      merchant: 'Manual Entry',
      date: new Date().toLocaleDateString(),
      category: 'Misc',
      isProcessing: false,
    };
    setState(prev => ({
      ...prev,
      receipts: [...prev.receipts, newReceipt],
    }));
  };

  const handleCropped = async (croppedBase64: string) => {
    const originalImage = croppingImage;
    setCroppingImage(null);
    setIsProcessing(true);

    const tempId = uuidv4();
    const newReceipt: Receipt = {
      id: tempId,
      image: originalImage || '',
      croppedImage: croppedBase64,
      amount: 0,
      merchant: 'Analyzing...',
      date: '',
      category: 'Misc',
      isProcessing: true,
    };

    setState(prev => ({
      ...prev,
      receipts: [...prev.receipts, newReceipt],
    }));

    try {
      const analysis = await analyzeReceipt(croppedBase64, state.categories);
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.map(r => 
          r.id === tempId ? {
            ...r,
            amount: analysis.amount,
            merchant: analysis.merchant,
            date: analysis.date,
            category: analysis.suggestedCategory,
            isProcessing: false,
          } : r
        ),
      }));
    } catch (err) {
      console.error("Gemini failed:", err);
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.map(r => 
          r.id === tempId ? { ...r, merchant: "Error analyzing", isProcessing: false } : r
        ),
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const updateReceipt = (id: string, updates: Partial<Receipt>) => {
    setState(prev => ({
      ...prev,
      receipts: prev.receipts.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const removeReceipt = (id: string) => {
    setState(prev => ({
      ...prev,
      receipts: prev.receipts.filter(r => r.id !== id)
    }));
  };

  const addNewCategory = () => {
    const name = prompt("Enter new category name:");
    if (name && !state.categories.includes(name)) {
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, name]
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 no-print w-full shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 p-2 rounded-lg text-white shadow-inner hidden xs:block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-black text-gray-900 tracking-tight whitespace-nowrap uppercase">ClaimMaster</h1>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Edit
                </button>
                <button 
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {viewMode === 'edit' && (
              <>
                <button 
                  onClick={handleManualAdd}
                  className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  MANUAL
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  CAPTURE
                </button>
              </>
            )}
            <button 
              onClick={() => window.print()}
              disabled={state.receipts.length === 0}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              PRINT
            </button>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center w-full max-w-5xl px-4 sm:px-6">
        {viewMode === 'edit' ? (
          <main className="w-full py-8 no-print animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-4">Claim Metadata</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Staff Full Name</label>
                      <input 
                        type="text"
                        value={state.name}
                        onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Tan Ah Kow"
                        className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Submission Month</label>
                      <input 
                        type="text"
                        value={state.month}
                        onChange={(e) => setState(prev => ({ ...prev, month: e.target.value }))}
                        placeholder="October 2023"
                        className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Total</h3>
                    <button 
                      onClick={addNewCategory}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded"
                    >
                      + CATEGORY
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center flex-grow text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Reimbursement Total</span>
                    <span className="text-4xl font-black text-blue-600 tabular-nums">RM {state.receipts.reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
                  </div>
                </section>
              </div>

              <div className="w-full space-y-4">
                <div className="flex justify-between items-center px-2">
                   <h2 className="text-xs font-black text-gray-400 uppercase tracking-tighter">{state.receipts.length} Documentation Entries</h2>
                </div>

                {state.receipts.map(receipt => (
                  <ReceiptItem 
                    key={receipt.id}
                    receipt={receipt}
                    categories={state.categories}
                    onUpdate={updateReceipt}
                    onRemove={removeReceipt}
                  />
                ))}

                {isProcessing && (
                  <div className="bg-white border-2 border-blue-50 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center animate-pulse">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3"></div>
                    <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest">AI analysis in progress...</p>
                  </div>
                )}

                {state.receipts.length === 0 && !isProcessing && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-2 border-dashed border-gray-100 rounded-2xl py-24 flex flex-col items-center justify-center text-gray-300 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer group"
                  >
                    <div className="bg-gray-50 p-4 rounded-full group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="font-black text-sm text-gray-400 uppercase">Capture Receipt or Add Manually</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          <div className="paper-preview no-print animate-in zoom-in-95 duration-500 w-full flex-grow flex justify-center">
            <UnifiedPrintLayout state={state} />
          </div>
        )}
      </div>

      <div className="print-only">
        <UnifiedPrintLayout state={state} />
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      {croppingImage && <ImageCropper src={croppingImage} onComplete={handleCropped} onCancel={() => setCroppingImage(null)} />}
    </div>
  );
};

export default App;
