
import React from 'react';
import { Receipt } from '../types';

interface ReceiptsSummaryPrintableProps {
  receipts: Receipt[];
}

const ReceiptsSummaryPrintable: React.FC<ReceiptsSummaryPrintableProps> = ({ receipts }) => {
  return (
    <div className="bg-white w-[210mm] min-h-[297mm] p-8 mx-auto shadow-xl text-black">
      <h2 className="text-lg font-bold border-b-2 border-black pb-2 mb-6">Receipt Attachments</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {receipts.map((receipt, idx) => (
          <div key={receipt.id} className="border border-gray-300 p-2 flex flex-col h-[60mm]">
            <div className="flex justify-between text-[10px] mb-1 font-bold bg-gray-100 p-1">
              <span>#{idx + 1} - {receipt.merchant}</span>
              <span>RM {receipt.amount.toFixed(2)}</span>
            </div>
            <div className="flex-grow overflow-hidden flex items-center justify-center bg-gray-50">
              <img 
                src={receipt.croppedImage || receipt.image} 
                alt="Receipt Attachment" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="text-[8px] text-center mt-1 text-gray-500">
              {receipt.category} | {receipt.date}
            </div>
          </div>
        ))}
        
        {receipts.length === 0 && (
          <div className="col-span-2 text-center py-20 text-gray-400 italic">
            No receipts added to this claim.
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptsSummaryPrintable;
