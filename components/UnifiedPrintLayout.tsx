
import React, { useState, useRef, useEffect } from 'react';
import { ClaimState, Receipt } from '../types';

interface UnifiedPrintLayoutProps {
  state: ClaimState;
  onUpdateReceipt?: (id: string, updates: Partial<Receipt>) => void;
  onUpdateLayout?: (id: string, layout: NonNullable<Receipt['layout']>) => void;
}

const UnifiedPrintLayout: React.FC<UnifiedPrintLayoutProps> = ({ state, onUpdateReceipt, onUpdateLayout }) => {
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const [dragAction, setDragAction] = useState<{ type: 'move' | 'resize'; startX: number; startY: number; initialLayout: NonNullable<Receipt['layout']> } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const rowList = [...state.categories];
  const totalRows = Math.max(20, rowList.length);
  const displayRows = Array.from({ length: totalRows }).map((_, i) => rowList[i] || "");

  const getItemData = (categoryName: string) => {
    if (!categoryName) return { amount: 0, remarks: "" };
    const matchingReceipts = state.receipts.filter(r => r.category === categoryName);
    const amount = matchingReceipts.reduce((acc, curr) => acc + curr.amount, 0);
    const remarksSet = new Set(matchingReceipts.map(r => r.remark?.trim()).filter(Boolean));
    return { amount, remarks: Array.from(remarksSet).join(', ') };
  };

  const grandTotal = state.receipts.reduce((acc, curr) => acc + curr.amount, 0);
  const receiptsWithImages = state.receipts.filter(r => !!(r.image || r.croppedImage));

  const handleMouseDown = (e: React.MouseEvent, r: Receipt, type: 'move' | 'resize') => {
    if (!onUpdateLayout || !r.layout) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveReceiptId(r.id);
    setDragAction({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialLayout: { ...r.layout }
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragAction || !activeReceiptId || !onUpdateLayout) return;

      const dx = (e.clientX - dragAction.startX) * (210 / (containerRef.current?.offsetWidth || 210));
      const dy = (e.clientY - dragAction.startY) * (210 / (containerRef.current?.offsetWidth || 210));

      const newLayout = { ...dragAction.initialLayout };

      if (dragAction.type === 'move') {
        newLayout.x = Math.max(0, Math.min(210 - newLayout.w, dragAction.initialLayout.x + dx));
        newLayout.y = Math.max(0, Math.min(297 - newLayout.h, dragAction.initialLayout.y + dy));
      } else if (dragAction.type === 'resize') {
        newLayout.w = Math.max(20, Math.min(210 - newLayout.x, dragAction.initialLayout.w + dx));
        newLayout.h = Math.max(15, Math.min(297 - newLayout.y, dragAction.initialLayout.h + dy));
      }

      onUpdateLayout(activeReceiptId, newLayout);
    };

    const handleGlobalMouseUp = () => {
      setDragAction(null);
      setActiveReceiptId(null);
    };

    if (dragAction) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragAction, activeReceiptId, onUpdateLayout]);

  const renderClaimFormPage = () => (
    <div className="page-sheet flex flex-col p-[12mm] text-black font-sans">
      <h1 className="text-[12pt] font-bold">ELCOMP TECHNOLOGIES SDN BHD (589723-U)</h1>
      <div className="text-center my-6">
        <h2 className="text-[16pt] font-black border-b-4 border-black inline-block px-4 pb-1">STAFF MONTHLY CLAIM FORM</h2>
      </div>

      <div className="flex justify-between items-end mb-8 text-[11pt]">
        <div className="flex gap-2 items-baseline flex-1">
          <span className="font-bold uppercase text-[10pt]">Staff Name:</span>
          <span className="border-b-2 border-black flex-grow px-2 font-medium italic">{state.name || "__________________________"}</span>
        </div>
        <div className="flex gap-2 items-baseline ml-10">
          <span className="font-bold uppercase text-[10pt]">Claim Month:</span>
          <span className="border-b-2 border-black px-2 min-w-[150px] font-medium italic">{state.month || "__________________________"}</span>
        </div>
      </div>

      <table className="w-full border-collapse border-4 border-black text-[10pt]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-2 border-black px-2 py-2 text-center w-[50px]">No.</th>
            <th className="border-2 border-black px-4 py-2 text-center">Description of Expenses</th>
            <th className="border-2 border-black px-4 py-2 text-center w-[160px]">Amount (RM)</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((category, idx) => {
            const { amount, remarks } = getItemData(category);
            const description = category ? `${category}${remarks ? ` (${remarks})` : ""}` : "";
            return (
              <tr key={idx} className="h-[8mm]">
                <td className="border border-black px-2 py-1 text-center font-bold">{idx + 1}</td>
                <td className="border border-black px-4 py-1 text-left truncate max-w-[400px]">{description}</td>
                <td className="border border-black px-4 py-1 text-right tabular-nums">{amount > 0 ? amount.toFixed(2) : ""}</td>
              </tr>
            );
          })}
          <tr className="h-[12mm] font-black bg-gray-50 text-[12pt]">
            <td colSpan={2} className="border-4 border-black px-4 py-2 text-left uppercase">Grand Total Reimbursement:</td>
            <td className="border-4 border-black px-4 py-2 text-right">RM {grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-auto flex justify-between items-end pt-12 px-6">
        <div className="w-[40%]">
          <p className="mb-16 font-bold uppercase text-[10pt]">Claimed By:</p>
          <div className="border-b-2 border-black w-full"></div>
          <p className="mt-1 text-center text-[9pt] font-medium">(Signature & Date)</p>
        </div>
        <div className="w-[40%]">
          <p className="mb-16 font-bold uppercase text-[10pt]">Authorised By:</p>
          <div className="border-b-2 border-black w-full"></div>
          <p className="mt-1 text-center text-[9pt] font-medium">(Manager Approval)</p>
        </div>
      </div>
    </div>
  );

  const renderReceiptCanvasItem = (r: Receipt) => {
    const layout = r.layout || { x: 0, y: 0, w: 50, h: 50 };
    return (
      <div 
        key={r.id}
        className={`absolute border border-black flex flex-col group bg-white shadow-sm overflow-hidden ${activeReceiptId === r.id ? 'z-50 ring-2 ring-blue-500' : 'z-10'}`}
        style={{
          left: `${layout.x}mm`,
          top: `${layout.y}mm`,
          width: `${layout.w}mm`,
          height: `${layout.h}mm`,
          cursor: onUpdateLayout ? 'move' : 'default'
        }}
        onMouseDown={(e) => handleMouseDown(e, r, 'move')}
      >
        <div className="bg-black text-white text-[8px] font-bold px-1 py-0.5 flex justify-between items-center no-print">
          <span className="truncate">{r.merchant}</span>
          <span>RM {r.amount.toFixed(2)}</span>
        </div>
        <div className="flex-grow flex items-center justify-center p-1 overflow-hidden pointer-events-none">
          <img src={r.croppedImage || r.image} className="max-w-full max-h-full object-contain" alt="Receipt" />
        </div>
        
        {/* Resize Handle (Hidden in Print) */}
        {onUpdateLayout && (
          <div 
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 cursor-se-resize no-print opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, r, 'resize')}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="currentColor">
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM14 22H12V20H14V22ZM22 14H20V12H22V14ZM10 22H8V20H10V22ZM22 10H20V8H22V10ZM6 22H4V20H6V22ZM22 6H20V4H22V6Z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="main-container flex flex-col gap-10" ref={containerRef}>
      {/* Page 1: Claim Form */}
      {renderClaimFormPage()}

      {/* Page 2+: Attachments Canvas */}
      <div className="page-sheet relative overflow-hidden bg-white flex flex-col font-sans">
        <div className="bg-gray-100 border-b-2 border-black px-6 py-3 flex justify-between items-center no-print">
          <h3 className="text-sm font-black uppercase text-black tracking-widest">Attachment Canvas</h3>
          <span className="text-[10px] font-bold text-blue-600 animate-pulse">DRAG TO MOVE | BOTTOM-RIGHT CORNER TO RESIZE</span>
        </div>
        
        {/* Free-form area */}
        <div className="relative flex-grow min-h-[297mm]">
          {receiptsWithImages.map(renderReceiptCanvasItem)}
          
          {/* Printable Background Grid for alignment */}
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-12 pointer-events-none opacity-5 no-print">
            {Array.from({ length: 120 }).map((_, i) => (
              <div key={i} className="border-[0.1mm] border-gray-400"></div>
            ))}
          </div>
        </div>

        <div className="p-4 text-center text-[10pt] font-bold border-t-2 border-black uppercase text-gray-400 mt-auto">
          {state.name} | {state.month} | Attachments Sheet
        </div>
      </div>

      {receiptsWithImages.length === 0 && (
        <div className="page-sheet flex flex-col items-center justify-center text-gray-400 gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-bold">No receipt images to display.</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedPrintLayout;
