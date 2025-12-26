
import React from 'react';
import { Receipt } from '../types';

interface ReceiptItemProps {
  receipt: Receipt;
  categories: string[];
  onUpdate: (id: string, updates: Partial<Receipt>) => void;
  onRemove: (id: string) => void;
}

const ReceiptItem: React.FC<ReceiptItemProps> = ({ receipt, categories, onUpdate, onRemove }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
        <img 
          src={receipt.croppedImage || receipt.image} 
          alt="Receipt" 
          className="w-full h-full object-cover"
        />
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
        title="Remove receipt"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ReceiptItem;
