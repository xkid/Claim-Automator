
import React from 'react';
import { ClaimState, Receipt } from '../types';

interface UnifiedPrintLayoutProps {
  state: ClaimState;
}

const UnifiedPrintLayout: React.FC<UnifiedPrintLayoutProps> = ({ state }) => {
  // Use state.categories as the base for the rows to include custom categories
  // We'll ensure at least 20 rows are shown for aesthetics
  const rowList = [...state.categories];
  const totalRows = Math.max(20, rowList.length);
  const displayRows = Array.from({ length: totalRows }).map((_, i) => rowList[i] || "");

  const getItemData = (categoryName: string) => {
    if (!categoryName) return { amount: 0, remarks: "" };
    
    const matchingReceipts = state.receipts.filter(r => r.category === categoryName);
    const amount = matchingReceipts.reduce((acc, curr) => acc + curr.amount, 0);
    
    const remarksSet = new Set(
      matchingReceipts
        .map(r => r.remark?.trim())
        .filter(remark => !!remark)
    );
    const remarksStr = Array.from(remarksSet).join(', ');
    
    return { amount, remarks: remarksStr };
  };

  const grandTotal = state.receipts.reduce((acc, curr) => acc + curr.amount, 0);

  // Filter out receipts without images for the attachment section
  const receiptsWithImages = state.receipts.filter(r => !!(r.image || r.croppedImage));

  // Pagination logic: 
  // Half page: 2 rows x 3 columns = 6 receipts
  // Full page: 4 rows x 3 columns = 12 receipts
  const RECEIPTS_PER_HALF_PAGE = 6; 
  const RECEIPTS_PER_FULL_PAGE = 12;

  const p1Receipts = receiptsWithImages.slice(0, RECEIPTS_PER_HALF_PAGE);
  const remainingReceipts = receiptsWithImages.slice(RECEIPTS_PER_HALF_PAGE);
  
  const additionalPages: Receipt[][] = [];
  for (let i = 0; i < remainingReceipts.length; i += RECEIPTS_PER_FULL_PAGE) {
    additionalPages.push(remainingReceipts.slice(i, i + RECEIPTS_PER_FULL_PAGE));
  }

  const renderClaimForm = () => (
    <div className="h-[148.5mm] p-[6mm] border-b-[0.5mm] border-gray-400 relative flex flex-col font-sans text-black overflow-hidden">
      {/* Header */}
      <div className="text-left mb-1">
        <h1 className="text-[9pt] font-bold">ELCOMP TECHNOLOGIES SDN BHD (589723-U)</h1>
      </div>

      <div className="text-center mb-2">
        <h2 className="text-[10pt] font-bold">STAFF MONTHLY CLAIM FORM</h2>
      </div>

      {/* Name and Month */}
      <div className="flex justify-between items-end mb-2 text-[8pt]">
        <div className="flex gap-1 items-baseline flex-1">
          <span className="font-bold">Name:</span>
          <span className="border-b border-black flex-grow px-1 min-w-[150px] italic">{state.name}</span>
        </div>
        <div className="flex gap-1 items-baseline ml-4">
          <span className="font-bold">Month:</span>
          <span className="border-b border-black px-1 min-w-[100px] italic">{state.month}</span>
        </div>
      </div>

      {/* Main Table - Dynamic Rows */}
      <div className="flex-grow overflow-hidden">
        <table className="w-full border-collapse border border-black text-[7.5pt]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-0.5 text-center w-[30px]">Items</th>
              <th className="border border-black px-2 py-0.5 text-center">Descriptions</th>
              <th className="border border-black px-2 py-0.5 text-center w-[100px]">Amount (RM)</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((category, idx) => {
              const { amount, remarks } = getItemData(category);
              const description = category ? `${category}${remarks ? ` (${remarks})` : ""}` : "";
              
              return (
                <tr key={idx} className="h-[4.5mm]">
                  <td className="border border-black px-1 py-0 text-center">{idx + 1}</td>
                  <td className="border border-black px-2 py-0 text-left truncate max-w-[400px]">
                    {description}
                  </td>
                  <td className="border border-black px-2 py-0 text-right">
                    {amount > 0 ? amount.toFixed(2) : ""}
                  </td>
                </tr>
              );
            })}
            <tr className="h-[6mm] font-bold">
              <td colSpan={2} className="border border-black px-2 py-0 text-left align-middle">Total:</td>
              <td className="border border-black px-2 py-0 text-right align-middle">
                {grandTotal > 0 ? grandTotal.toFixed(2) : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Signatures */}
      <div className="mt-4 flex justify-between items-start text-[8pt]">
        <div className="w-[40%]">
          <p className="mb-4 font-bold">Claimed By:</p>
          <div className="border-b border-black w-full h-px"></div>
        </div>
        <div className="w-[40%]">
          <p className="mb-4 font-bold">Authorised By:</p>
          <div className="border-b border-black w-full h-px"></div>
        </div>
      </div>
    </div>
  );

  const renderReceipts = (receiptList: Receipt[]) => (
    <div className="receipt-grid">
      {receiptList.map((r) => (
        <div key={r.id} className="receipt-card-mini shadow-sm border border-gray-300">
          <div className="flex justify-between items-center px-1 py-0.5 bg-gray-900 text-white text-[7px] font-bold">
            <span className="truncate max-w-[65%]">{r.merchant}</span>
            <span>RM {r.amount.toFixed(2)}</span>
          </div>
          <div className="flex-grow flex items-center justify-center overflow-hidden bg-white p-1">
            <img src={r.croppedImage || r.image} className="max-h-full max-w-full object-contain" alt="Receipt" />
          </div>
          <div className="p-1 bg-gray-50 border-t flex flex-col text-[6px] leading-tight text-gray-600">
            <div className="font-bold truncate">{r.category}</div>
            <div className="flex justify-between">
              <span>{r.date}</span>
            </div>
            {r.remark && <div className="italic text-gray-400 truncate">Note: {r.remark}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="page-sheet flex flex-col">
        {renderClaimForm()}
        <div className="flex-grow overflow-hidden">
          {receiptsWithImages.length > 0 && (
            <>
              <div className="px-4 pt-2">
                <h3 className="text-[7pt] font-black uppercase text-gray-400 flex items-center gap-2">
                  <span className="h-px bg-gray-200 flex-grow"></span>
                  Supporting Receipt Attachments (Half Page: 2x3)
                  <span className="h-px bg-gray-200 flex-grow"></span>
                </h3>
              </div>
              {renderReceipts(p1Receipts)}
            </>
          )}
        </div>
      </div>

      {additionalPages.map((pageBatch, idx) => (
        <div key={idx} className="page-sheet">
           <div className="p-4 border-b border-gray-100 mb-1">
             <h3 className="text-[9pt] font-bold uppercase tracking-widest text-gray-500">Receipt Attachments (Full Page: 4x3 Total) - Page {idx + 2}</h3>
           </div>
          {renderReceipts(pageBatch)}
        </div>
      ))}
    </>
  );
};

export default UnifiedPrintLayout;
