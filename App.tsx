
import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ClaimState, Receipt } from './types';
import { DEFAULT_CATEGORIES, MONTHS } from './constants';
import { analyzeReceipt } from './services/geminiService';
import ReceiptItem from './components/ReceiptItem';
import ClaimFormPrintable from './components/ClaimFormPrintable';
import ReceiptsSummaryPrintable from './components/ReceiptsSummaryPrintable';
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
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pb-20">
      {/* UI Navigation & Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 leading-none">ClaimMaster AI</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Automated Expense Claims</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-lg active:transform active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Upload Receipt
            </button>
            <button 
              onClick={handlePrint}
              disabled={state.receipts.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-lg active:transform active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print Claim
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 mt-8 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Config & Form Metadata */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Claim Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                  <input 
                    type="text"
                    value={state.name}
                    onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Claim Month</label>
                  <input 
                    type="text"
                    value={state.month}
                    onChange={(e) => setState(prev => ({ ...prev, month: e.target.value }))}
                    placeholder="e.g. October 2023"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Categories</h3>
                <button 
                  onClick={addNewCategory}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded"
                >
                  + Add New
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {state.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                    {cat}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Receipt List */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-gray-800">Uploaded Receipts ({state.receipts.length})</h3>
              <p className="text-sm text-gray-500">Total: <span className="font-bold text-gray-900">RM {state.receipts.reduce((a, b) => a + b.amount, 0).toFixed(2)}</span></p>
            </div>

            <div className="space-y-4">
              {state.receipts.map(receipt => (
                <ReceiptItem 
                  key={receipt.id}
                  receipt={receipt}
                  categories={state.categories}
                  onUpdate={updateReceipt}
                  onRemove={removeReceipt}
                />
              ))}
              
              {state.receipts.length === 0 && !isProcessing && (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium">No receipts uploaded yet</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 text-blue-600 font-bold hover:underline"
                  >
                    Click to upload your first receipt
                  </button>
                </div>
              )}

              {isProcessing && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-blue-800 font-bold animate-pulse">Gemini AI is analyzing your receipt...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Cropper Overlay */}
      {croppingImage && (
        <ImageCropper 
          src={croppingImage} 
          onComplete={handleCropped} 
          onCancel={() => setCroppingImage(null)} 
        />
      )}

      {/* Print View Components */}
      <div className="print-only">
        <div className="page-break">
          <ClaimFormPrintable state={state} categories={state.categories} />
        </div>
        <div className="page-break">
          <ReceiptsSummaryPrintable receipts={state.receipts} />
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-20 py-8 text-center text-gray-400 text-xs no-print">
        <p>&copy; 2024 Elcomp Technologies Sdn Bhd. All rights reserved.</p>
        <p className="mt-1 uppercase tracking-widest font-bold text-[8px]">Powered by Google Gemini 3</p>
      </footer>
    </div>
  );
};

export default App;
