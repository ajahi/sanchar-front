import React, { useState } from 'react';
import { Database, Plus, Trash2, Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { InventoryItem, FAQItem } from '../types';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  faqs: FAQItem[];
  onAddProduct: (item: InventoryItem) => void;
  onDeleteProduct: (id: string) => void;
  onAddFAQ: (faq: FAQItem) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  faqs,
  onAddProduct,
  onDeleteProduct,
  onAddFAQ,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'faqs' | 'upload'>('products');
  
  // New Product Form
  const [newProdName, setNewProdName] = useState('');
  const [newProdNepaliName, setNewProdNepaliName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Shawls & Scarves');
  const [newProdPrice, setNewProdPrice] = useState<number>(3500);
  const [newProdStock, setNewProdStock] = useState<number>(20);
  const [newProdDesc, setNewProdDesc] = useState('');

  // Upload feedback state
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newItem: InventoryItem = {
      id: `PROD-${Date.now().toString().slice(-4)}`,
      name: newProdName.trim(),
      nepaliName: newProdNepaliName.trim() || newProdName.trim(),
      category: newProdCategory,
      price: Number(newProdPrice) || 0,
      stock: Number(newProdStock) || 0,
      description: newProdDesc.trim() || 'Handcrafted Nepalese artisanal goods.'
    };

    onAddProduct(newItem);
    setNewProdName('');
    setNewProdNepaliName('');
    setNewProdDesc('');
  };

  const handleSimulateUpload = (fileName: string) => {
    setUploadSuccess(`Ingested "${fileName}" — Extracted 14 products & 6 shipping rules into RAG context!`);
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none">
      <div className="matchbox-border bg-[#FAF3E0] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-[8px_8px_0px_#1A1A1A]">
        {/* Header */}
        <div className="vermilion-bg text-white p-3 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-300" />
            <h2 className="serif-heading text-lg tracking-tight">
              Merchant Store Context &amp; RAG Knowledge Base
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black text-white border border-white/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b-2 border-black bg-white shrink-0">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase cursor-pointer border-r border-black ${
              activeSubTab === 'products' ? 'mustard-bg text-black' : 'hover:bg-[#FAF3E0]'
            }`}
          >
            INVENTORY ITEMS ({inventory.length})
          </button>
          <button
            onClick={() => setActiveSubTab('faqs')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase cursor-pointer border-r border-black ${
              activeSubTab === 'faqs' ? 'mustard-bg text-black' : 'hover:bg-[#FAF3E0]'
            }`}
          >
            FAQS &amp; POLICIES ({faqs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase cursor-pointer ${
              activeSubTab === 'upload' ? 'mustard-bg text-black' : 'hover:bg-[#FAF3E0]'
            }`}
          >
            ATTACH CATALOG (PDF/CSV)
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto font-mono text-xs space-y-4">
          {activeSubTab === 'products' && (
            <>
              {/* Add Product Form */}
              <div className="matchbox-border p-3 bg-white">
                <p className="text-[11px] font-bold text-[#1A2B4C] mb-2 font-serif uppercase">
                  Add New Product to Store Catalog
                </p>
                <form onSubmit={handleCreateProduct} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase block">Product Name (English):</label>
                      <input
                        type="text"
                        placeholder="e.g. Handmade Silver Filigree Pendant"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase block">Nepali / Local Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. चाँदीको परम्परागत पेन्डेन्ट"
                        value={newProdNepaliName}
                        onChange={(e) => setNewProdNepaliName(e.target.value)}
                        className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase block">Price (NPR):</label>
                      <input
                        type="number"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]/30"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase block">Stock Quantity:</label>
                      <input
                        type="number"
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(Number(e.target.value))}
                        className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]/30"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase block">Category:</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]"
                      >
                        <option value="Shawls & Scarves">Shawls &amp; Scarves</option>
                        <option value="Traditional Wear">Traditional Wear</option>
                        <option value="Spiritual & Decor">Spiritual &amp; Decor</option>
                        <option value="Home & Bedding">Home &amp; Bedding</option>
                        <option value="Handicrafts">Handicrafts</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase block">Description / RAG Details:</label>
                    <input
                      type="text"
                      placeholder="Material, origin, care instructions, colors..."
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]/30"
                    />
                  </div>

                  <button
                    type="submit"
                    className="vermilion-bg text-white font-bold px-4 py-1.5 border-2 border-black shadow-[2px_2px_0px_black] hover:bg-[#8F1810] cursor-pointer text-xs uppercase flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Catalog &amp; Re-Index RAG
                  </button>
                </form>
              </div>

              {/* Product List */}
              <div className="space-y-2">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="matchbox-border p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1A2B4C]">{item.name}</span>
                        <span className="text-[10px] bg-[#E09A25]/30 border border-black/30 px-1 font-bold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#B8251B] font-medium">{item.nepaliName}</p>
                      <p className="text-[10px] text-[#1A1A1A]/70 line-clamp-1">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-[#8F1810]">
                          Rs. {item.price.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-[#1A1A1A]/60">Stock: {item.stock} pcs</div>
                      </div>
                      <button
                        onClick={() => onDeleteProduct(item.id)}
                        className="p-1.5 border border-black text-red-700 hover:bg-red-50 cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSubTab === 'faqs' && (
            <div className="space-y-3">
              <div className="matchbox-border p-3 aged-paper">
                <p className="text-[11px] font-bold text-[#1A2B4C] mb-1 font-serif uppercase">
                  Shipping &amp; Delivery Matrix
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-white p-2 border border-black">
                    <span className="font-bold block">Kathmandu Valley:</span>
                    <span>Rs. 100 • 24 Hours (Next Day)</span>
                  </div>
                  <div className="bg-white p-2 border border-black">
                    <span className="font-bold block">Pokhara &amp; Chitwan:</span>
                    <span>Rs. 150 • 2-3 Days Courier</span>
                  </div>
                  <div className="bg-white p-2 border border-black">
                    <span className="font-bold block">Butwal &amp; Biratnagar:</span>
                    <span>Rs. 180 • 2-3 Days Courier</span>
                  </div>
                </div>
              </div>

              {faqs.map((faq) => (
                <div key={faq.id} className="matchbox-border p-3 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1A2B4C]">{faq.question}</span>
                    <span className="text-[9px] font-bold bg-[#FAF3E0] border border-black px-1.5 py-0.5">
                      {faq.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#1A1A1A]/90 italic">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {activeSubTab === 'upload' && (
            <div className="space-y-4">
              <div className="matchbox-border p-6 bg-white text-center border-dashed border-2 border-black">
                <Upload className="w-10 h-10 mx-auto text-[#B8251B] mb-2" />
                <h3 className="serif-heading text-sm font-bold text-[#1A2B4C] mb-1">
                  Upload Catalog or Inventory Sheet
                </h3>
                <p className="text-[11px] text-[#1A1A1A]/70 max-w-sm mx-auto mb-4">
                  Drag and drop your PDF brochure, CSV inventory export, or Excel price sheet. The SocialSync AI RAG parser will automatically index product names, prices, and specs.
                </p>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleSimulateUpload('CATALOG_V2.PDF')}
                    className="pill mustard-bg text-black hover:bg-amber-400 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Load Sample CATALOG_V2.PDF
                  </button>
                  <button
                    onClick={() => handleSimulateUpload('INVENTORY_KATHMANDU.CSV')}
                    className="pill aged-paper text-black hover:bg-white cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Load Sample INVENTORY.CSV
                  </button>
                </div>
              </div>

              {uploadSuccess && (
                <div className="p-3 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t-2 border-black flex justify-between items-center text-[10px] shrink-0">
          <span>Active Context: In-Memory + Vector Index Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-1 border-2 border-black font-bold uppercase hover:bg-[#FAF3E0] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
