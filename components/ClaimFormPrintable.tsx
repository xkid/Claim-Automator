
import React from 'react';
import { ClaimState } from '../types';

interface ClaimFormPrintableProps {
  state: ClaimState;
  categories: string[];
}

const ClaimFormPrintable: React.FC<ClaimFormPrintableProps> = ({ state, categories }) => {
  const totalsByCategory = categories.map(cat => {
    const sum = state.receipts
      .filter(r => r.category === cat)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { category: cat, amount: sum };
  });

  const grandTotal = totalsByCategory.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="bg-white w-[210mm] h-[297mm] p-12 mx-auto shadow-xl relative text-black font-serif leading-tight">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase">Elcomp Technologies Sdn Bhd (589723-U)</h1>
        <h2 className="text-lg font-bold tracking-widest mt-2">STAFF MONTHLY CLAIM FORM</h2>
      </div>

      <div className="flex justify-between mb-6 text-sm">
        <div className="flex gap-2">
          <span className="font-bold">Name:</span>
          <span className="border-b border-black min-w-[200px] text-left px-2">{state.name || "____________________"}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Month:</span>
          <span className="border-b border-black min-w-[150px] text-left px-2">{state.month || "____________________"}</span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-black p-2 w-16 text-center">Items</th>
            <th className="border border-black p-2 text-left">Descriptions</th>
            <th className="border border-black p-2 w-32 text-right">Amount (RM)</th>
          </tr>
        </thead>
        <tbody>
          {totalsByCategory.map((item, index) => (
            <tr key={index}>
              <td className="border border-black p-2 text-center">{index + 1}</td>
              <td className="border border-black p-2">{item.category}</td>
              <td className="border border-black p-2 text-right">
                {item.amount > 0 ? item.amount.toFixed(2) : ""}
              </td>
            </tr>
          ))}
          {/* Fill extra rows to maintain look */}
          {Array.from({ length: Math.max(0, 15 - totalsByCategory.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black p-2 text-center h-8">{totalsByCategory.length + i + 1}</td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td colSpan={2} className="border border-black p-2 text-right">Total:</td>
            <td className="border border-black p-2 text-right">{grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between mt-12 text-sm pt-8">
        <div className="w-1/3">
          <p className="mb-8 font-bold">Claimed By:</p>
          <div className="border-t border-black pt-1">Signature & Date</div>
        </div>
        <div className="w-1/3">
          <p className="mb-8 font-bold">Authorised By:</p>
          <div className="border-t border-black pt-1">Signature & Date</div>
        </div>
      </div>
    </div>
  );
};

export default ClaimFormPrintable;
