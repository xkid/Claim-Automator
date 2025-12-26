
import React from 'react';
import { Receipt } from '../types';

interface ReceiptItemProps {
  receipt: Receipt;
  categories: string[];
  onUpdate: (id: string, updates: Partial<Receipt>) => void;
  onRemove: (id: string) => void;
}

const ReceiptItem: React.FC<ReceiptItemProps> = ({ receipt, categories, onUpdate, onRemove }) => {
  const hasImage = !!(receipt.croppedImage || receipt.image);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border flex items-center justify-center">
        {hasImage ? (
          <img 
            src={receipt.croppedImage || receipt.image} 
            alt="Receipt" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[8px] font-bold uppercase mt-1">No Image</span>
          </div>
        )}
      </div>
      
      <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase">Merchant</label>
          <input 
            type="text"
            value={receipt.merchant}
            onChange={(e) => onUpdate(receipt.id, { merchant: e.target.value })}
            className="text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-1 transition-colors"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase">Amount (RM)</label>
          <input 
            type="number"
            step="0.01"
            value={receipt.amount}
            onChange={(e) => onUpdate(receipt.id, { amount: parseFloat(e.target.value) || 0 })}
            className="text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-1 transition-colors"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
          <select 
            value={receipt.category}
            onChange={(e) => onUpdate(receipt.id, { category: e.target.value })}
            className="text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-1 transition-colors"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
          <input 
            type="text"
            value={receipt.date}
            onChange={(e) => onUpdate(receipt.id, { date: e.target.value })}
            className="text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-1 transition-colors"
          />
        </div>
      </div>

      <button 
        onClick={() => onRemove(receipt.id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
        title="Remove entry"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ReceiptItem;
