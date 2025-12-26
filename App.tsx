
import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ClaimState, Receipt } from './types';
import { DEFAULT_CATEGORIES, MONTHS } from './constants';
import { analyzeReceipt } from './services/geminiService';
import ReceiptItem from './components/ReceiptItem';
import UnifiedPrintLayout from './components/UnifiedPrintLayout';
import ImageCropper from './components/ImageCropper';

// SmartClaim Application for expense management and claim form generation
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

  // Handle local file upload or camera capture
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const base64 = readerEvent.target?.result as string;
      setCroppingImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Add a manual entry without a receipt image
  const handleManualAdd = () => {
    const newId = uuidv4();
    const newReceipt: Receipt = {
      id: newId,
      image: '',
      amount: 0,
      merchant: 'Manual Entry',
      date: new Date().toLocaleDateString(),
      category: 'Misc',
      isProcessing: false,
    };

    setState(prev => ({
      ...prev,
      receipts: [newReceipt, ...prev.receipts]
    }));
  };

  // Triggered when user confirms crop area in ImageCropper
  const handleCropComplete = async (croppedBase64: string) => {
    const newId = uuidv4();
    const newReceipt: Receipt = {
      id: newId,
      image: croppingImage!,
      croppedImage: croppedBase64,
      amount: 0,
      merchant: 'Analyzing...',
      date: '',
      category: 'Misc',
      isProcessing: true,
    };

    // Optimistically add receipt to the list
    setState(prev => ({
      ...prev,
      receipts: [newReceipt, ...prev.receipts]
    }));
    setCroppingImage(null);
    setIsProcessing(true);

    try {
      // Call Gemini API to extract data from the receipt image
      const analysis = await analyzeReceipt(croppedBase64, state.categories);
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.map(r => 
          r.id === newId 
            ? { 
                ...r, 
                ...analysis, 
                category: state.categories.includes(analysis.suggestedCategory) ? analysis.suggestedCategory : 'Misc',
                isProcessing: false 
              } 
            : r
        )
      }));
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.map(r => 
          r.id === newId 
            ? { ...r, merchant: 'Analysis Failed', isProcessing: false } 
            : r
        )
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
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, newCat]
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* Header / Navigation */}
      <nav className="bg-white border-b sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight text-blue-900">SmartClaim</span>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('edit')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              SCANNER
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              PREVIEW
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {viewMode === 'edit' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3">Staff Member</label>
                <input 
                  type="text" 
                  value={state.name} 
                  onChange={e => setState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter name..."
                  className="w-full text-xl font-bold bg-gray-50 border-none focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3">Billing Cycle</label>
                <input 
                  type="text" 
                  value={state.month} 
                  onChange={e => setState(prev => ({ ...prev, month: e.target.value }))}
                  placeholder="e.g. October 2023"
                  className="w-full text-xl font-bold bg-gray-50 border-none focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Action Area */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileUpload}
              />
              
              <button 
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase text-gray-700">Camera</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase text-gray-700">Upload</span>
              </button>

              <button 
                onClick={handleManualAdd}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:border-orange-400 hover:bg-orange-50/30 transition-all group"
              >
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase text-gray-700">Manual Entry</span>
              </button>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-blue-600 animate-pulse bg-blue-50 py-3 rounded-xl border border-blue-100">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">AI is reading your receipt...</span>
              </div>
            )}

            {/* List Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b-2 border-gray-100 pb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Ledger</h3>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase">Grand Total</div>
                    <div className="text-2xl font-black text-blue-900">RM {state.receipts.reduce((a, b) => a + b.amount, 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                {state.receipts.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
                    <div className="text-gray-300 mb-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-400 font-medium">Your ledger is empty.</p>
                  </div>
                ) : (
                  state.receipts.map(r => (
                    <ReceiptItem 
                      key={r.id} 
                      receipt={r} 
                      categories={state.categories}
                      onUpdate={onUpdate}
                      onRemove={onRemove}
                      onAddNewCategory={onAddNewCategory}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Preview Section */
          <div className="flex flex-col items-center gap-12 py-10">
            <div className="bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] print:shadow-none print:m-0 border border-gray-100">
               <UnifiedPrintLayout state={state} />
            </div>
            
            <button 
              onClick={() => window.print()} 
              className="fixed bottom-8 right-8 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 print:hidden z-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 012-2H5a2 2 0 012 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="font-black uppercase tracking-widest text-sm">Download PDF / Print</span>
            </button>
          </div>
        )}
      </main>

      {/* Cropping Modal Overlay */}
      {croppingImage && (
        <ImageCropper 
          src={croppingImage} 
          onComplete={handleCropComplete} 
          onCancel={handleCropCancel} 
        />
      )}
      
      {/* Styles for Printing and Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }

        @media print {
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .print\\:hidden { display: none !important; }
          .page-sheet { 
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            page-break-after: always !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
        
        .page-sheet {
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 0 auto;
          position: relative;
        }

        .receipt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6mm;
          padding: 8mm;
        }

        .receipt-card-mini {
          height: 60mm;
          display: flex;
          flex-direction: column;
          border-radius: 2mm;
          overflow: hidden;
        }

        @keyframes in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in { animation: in 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
