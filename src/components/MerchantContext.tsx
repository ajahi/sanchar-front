import React, { useState } from 'react';
import {
  Package,
  Plus,
  Upload,
  FileText,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  Truck,
  MapPin,
  CreditCard,
  HelpCircle,
  Flame,
  Download,
} from 'lucide-react';
import { InventoryItem, StoreFAQ } from '../types';

interface MerchantContextProps {
  inventory: InventoryItem[];
  faqs: StoreFAQ[];
  onAddInventoryItem: (item: InventoryItem) => void;
  onUpdateInventoryItem: (item: InventoryItem) => void;
  onDeleteInventoryItem: (id: string) => void;
  onAddFAQ: (faq: StoreFAQ) => void;
  onDeleteFAQ: (id: string) => void;
}

export const MerchantContext: React.FC<MerchantContextProps> = ({
  inventory,
  faqs,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  onAddFAQ,
  onDeleteFAQ,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'faqs' | 'shipping'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Pashmina & Woolens');
  const [newItemPrice, setNewItemPrice] = useState('3500');
  const [newItemStock, setNewItemStock] = useState('15');
  const [newItemDesc, setNewItemDesc] = useState('');

  // New FAQ form state
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqEn, setNewFaqEn] = useState('');
  const [newFaqNep, setNewFaqNep] = useState('');
  const [newFaqCat, setNewFaqCat] = useState<'shipping' | 'payment' | 'returns' | 'location' | 'general'>('general');

  const filteredInventory = inventory.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemSku.trim()) return;

    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: newItemSku.toUpperCase().trim(),
      name: newItemName.trim(),
      category: newItemCategory,
      priceNpr: Number(newItemPrice) || 0,
      stock: Number(newItemStock) || 0,
      colors: ['Natural', 'Crimson'],
      sizes: ['Standard'],
      description: newItemDesc.trim() || 'Handmade Himalayan authentic artisanal product.',
      inStock: Number(newItemStock) > 0,
    };

    onAddInventoryItem(item);
    setIsAddingItem(false);
    setNewItemName('');
    setNewItemSku('');
    setNewItemDesc('');
  };

  const handleCreateFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqEn.trim()) return;

    const faq: StoreFAQ = {
      id: `faq-${Date.now()}`,
      question: newFaqQ.trim(),
      answerEn: newFaqEn.trim(),
      answerNepglish: newFaqNep.trim() || newFaqEn.trim(),
      category: newFaqCat,
    };

    onAddFAQ(faq);
    setIsAddingFaq(false);
    setNewFaqQ('');
    setNewFaqEn('');
    setNewFaqNep('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Simple CSV parser for SKU,Name,Price,Stock,Category
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          const item: InventoryItem = {
            id: `inv-csv-${Date.now()}-${i}`,
            sku: parts[0] || `SKU-${Math.floor(Math.random() * 1000)}`,
            name: parts[1] || 'Imported Product',
            priceNpr: Number(parts[2]) || 1500,
            stock: Number(parts[3]) || 10,
            category: parts[4] || 'General',
            colors: ['Default'],
            sizes: ['One Size'],
            description: parts[5] || 'Catalog item imported via CSV.',
            inStock: (Number(parts[3]) || 10) > 0,
          };
          onAddInventoryItem(item);
          added++;
        }
      }
      alert(`Successfully parsed and added ${added} items from ${file.name} to RAG knowledge base!`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Stage Header Banner */}
      <div className="bg-[#FAF3E0] border-3 border-[#1A1A1A] p-4 shadow-[5px_5px_0_#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#B8251B] text-white text-[10px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A]">
              STAGE 3 KNOWLEDGE BASE
            </span>
            <span className="text-xs font-mono-retro text-[#B8251B] font-bold uppercase">
              MERCHANT CATALOG & FAQS
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif-vintage font-bold text-[#1A2B4C] mt-1">
            Store Context & Nepali Grounding Knowledge Base
          </h2>
          <p className="text-xs font-mono-retro text-[#1A1A1A]/80 mt-0.5">
            This data forms the primary retrieval context for Gemini RAG when answering customer inquiries across Meta channels.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'inventory', label: `INVENTORY (${inventory.length})`, icon: Package },
            { id: 'faqs', label: `FAQS (${faqs.length})`, icon: HelpCircle },
            { id: 'shipping', label: 'NEPAL SHIPPING & COD', icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`subtab-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-mono-retro font-bold border-2 border-[#1A1A1A] cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#B8251B] text-white shadow-[2px_2px_0_#1A1A1A]'
                    : 'bg-[#FAF3E0] text-[#1A1A1A] hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: INVENTORY CATALOG */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Action & Search Bar */}
          <div className="matchbox-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                id="input-search-inventory"
                type="text"
                placeholder="Search SKU, name, fabric, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-mono-retro bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none focus:bg-white shadow-[2px_2px_0_#1A1A1A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* CSV Upload */}
              <label className="matchbox-button-secondary px-3 py-1.5 text-xs font-mono-retro font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#B8251B]" />
                <span>UPLOAD CSV/CATALOG</span>
                <input
                  id="input-file-csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Add New Item */}
              <button
                id="btn-add-inventory-item"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="matchbox-button-primary px-3 py-1.5 text-xs font-mono-retro font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#E09A25]" />
                <span>ADD PRODUCT</span>
              </button>
            </div>
          </div>

          {/* Add Product Drawer */}
          {isAddingItem && (
            <form onSubmit={handleCreateItem} className="matchbox-card p-4 border-[#B8251B] space-y-3">
              <h3 className="font-serif-vintage font-bold text-sm text-[#B8251B] uppercase flex items-center gap-2">
                <Plus className="w-4 h-4" /> ADD NEW STORE ITEM FOR RAG INDEXING
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-retro">
                <div>
                  <label className="block font-bold mb-1">SKU Code (Unique):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PASH-09"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Product Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Handwoven Himalayan Wool Scarf"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-retro">
                <div>
                  <label className="block font-bold mb-1">Price in NPR (रू):</label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Initial Stock Count:</label>
                  <input
                    type="number"
                    required
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Category:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  >
                    <option value="Pashmina & Woolens">Pashmina & Woolens</option>
                    <option value="Traditional Apparel">Traditional Apparel</option>
                    <option value="Winter Wear">Winter Wear</option>
                    <option value="Bags & Accessories">Bags & Accessories</option>
                    <option value="Spiritual & Handicrafts">Spiritual & Handicrafts</option>
                    <option value="Jewelry">Jewelry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-xs font-mono-retro mb-1">
                  Product Description & Materials (Used by AI to answer customer inquiries):
                </label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Mention origin, dimensions, care instructions, colors..."
                  className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] text-xs font-mono-retro focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1.5 text-xs font-mono-retro text-gray-700 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="matchbox-button-primary px-4 py-1.5 text-xs font-mono-retro font-bold cursor-pointer"
                >
                  SAVE & INDEX ITEM
                </button>
              </div>
            </form>
          )}

          {/* Product Cards Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className="matchbox-card p-3.5 flex flex-col justify-between relative overflow-hidden group hover:border-[#B8251B] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="bg-[#E09A25] text-[#1A1A1A] text-[10px] font-mono-retro font-bold px-1.5 py-0.5 border border-[#1A1A1A]">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[10px] font-mono-retro font-bold px-1.5 py-0.5 border border-[#1A1A1A] ${
                        item.inStock
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {item.inStock ? `${item.stock} IN STOCK` : 'OUT OF STOCK'}
                    </span>
                  </div>

                  <h4 className="font-serif-vintage font-bold text-sm text-[#1A2B4C] leading-snug">
                    {item.name}
                  </h4>
                  <div className="text-[10px] font-mono-retro text-gray-500 mt-0.5">
                    {item.category}
                  </div>

                  <p className="text-xs font-mono-retro text-gray-700 mt-2 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1A1A1A]/20 flex items-center justify-between">
                  <div className="text-base font-serif-vintage font-extrabold text-[#B8251B]">
                    Rs. {item.priceNpr.toLocaleString()}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDeleteInventoryItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-700 cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: FAQS */}
      {activeSubTab === 'faqs' && (
        <div className="space-y-4">
          <div className="matchbox-card p-3 flex items-center justify-between">
            <h3 className="font-serif-vintage font-bold text-sm text-[#1A2B4C] uppercase">
              STORE POLICIES & FREQUENTLY ASKED QUESTIONS
            </h3>
            <button
              id="btn-add-faq"
              onClick={() => setIsAddingFaq(!isAddingFaq)}
              className="matchbox-button-primary px-3 py-1.5 text-xs font-mono-retro font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E09A25]" />
              <span>ADD NEW FAQ</span>
            </button>
          </div>

          {/* Add FAQ Drawer */}
          {isAddingFaq && (
            <form onSubmit={handleCreateFaq} className="matchbox-card p-4 border-[#B8251B] space-y-3">
              <h3 className="font-serif-vintage font-bold text-sm text-[#B8251B] uppercase">
                NEW FAQ GROUNDING PAIR
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono-retro">
                <div className="sm:col-span-3">
                  <label className="block font-bold mb-1">Customer Question (Keywords / Prompt):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How long does exchange take?"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Category:</label>
                  <select
                    value={newFaqCat}
                    onChange={(e) => setNewFaqCat(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  >
                    <option value="shipping">Shipping & COD</option>
                    <option value="payment">Payment Methods</option>
                    <option value="returns">Exchange & Returns</option>
                    <option value="location">Showroom Location</option>
                    <option value="general">General Inquiries</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-xs font-mono-retro mb-1">
                  Answer in English:
                </label>
                <textarea
                  rows={2}
                  required
                  value={newFaqEn}
                  onChange={(e) => setNewFaqEn(e.target.value)}
                  placeholder="English answer for international & English-speaking customers..."
                  className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] text-xs font-mono-retro focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                />
              </div>

              <div>
                <label className="block font-bold text-xs font-mono-retro mb-1">
                  Answer in Romanized Nepali (Nepglish):
                </label>
                <textarea
                  rows={2}
                  value={newFaqNep}
                  onChange={(e) => setNewFaqNep(e.target.value)}
                  placeholder="e.g., Hajur, size milena bhane 7 din bhitra exchange huncha..."
                  className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] text-xs font-mono-retro focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingFaq(false)}
                  className="px-3 py-1.5 text-xs font-mono-retro text-gray-700 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="matchbox-button-primary px-4 py-1.5 text-xs font-mono-retro font-bold cursor-pointer"
                >
                  SAVE FAQ PAIR
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="matchbox-card p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#1A2B4C] text-[#FAF3E0] text-[10px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A]">
                      {faq.category.toUpperCase()}
                    </span>
                    <h4 className="font-serif-vintage font-bold text-sm sm:text-base text-[#1A2B4C]">
                      Q: {faq.question}
                    </h4>
                  </div>
                  <button
                    onClick={() => onDeleteFAQ(faq.id)}
                    className="text-gray-400 hover:text-red-700 cursor-pointer p-1"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs font-mono-retro">
                  <div className="p-2.5 bg-[#FAF3E0] border border-[#1A1A1A]">
                    <div className="text-[10px] font-bold text-[#B8251B] mb-1">ENGLISH GROUNDING:</div>
                    <p className="text-gray-800 leading-relaxed">{faq.answerEn}</p>
                  </div>
                  <div className="p-2.5 bg-[#FFF8E7] border border-[#1A1A1A]">
                    <div className="text-[10px] font-bold text-[#E09A25] mb-1">
                      ROMANIZED NEPALI (NEPGLISH) GROUNDING:
                    </div>
                    <p className="text-gray-800 leading-relaxed">{faq.answerNepglish}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: NEPAL SHIPPING & COD SPECIFICATIONS */}
      {activeSubTab === 'shipping' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="matchbox-card p-4">
              <div className="p-2 bg-[#B8251B] text-white w-fit border border-[#1A1A1A] mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-serif-vintage font-bold text-sm text-[#1A2B4C]">
                Inside Kathmandu Valley
              </h4>
              <p className="text-xs font-mono-retro text-gray-700 mt-2">
                • Rate: <span className="font-bold text-[#B8251B]">Rs. 100</span> (Free on orders above Rs. 2,500)
                <br />
                • Timeline: 24 to 48 hours via Pathao / in-house rider
                <br />
                • Coverage: Kathmandu, Lalitpur, Bhaktapur, Kirtipur
              </p>
            </div>

            <div className="matchbox-card p-4">
              <div className="p-2 bg-[#E09A25] text-[#1A1A1A] w-fit border border-[#1A1A1A] mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-serif-vintage font-bold text-sm text-[#1A2B4C]">
                Outside Valley (Major Hubs)
              </h4>
              <p className="text-xs font-mono-retro text-gray-700 mt-2">
                • Rate: <span className="font-bold text-[#B8251B]">Rs. 200</span>
                <br />
                • Timeline: 2 to 4 business days
                <br />
                • Hubs: Pokhara, Butwal, Chitwan, Biratnagar, Dharan, Nepalgunj, Dhangadhi, Itahari
              </p>
            </div>

            <div className="matchbox-card p-4">
              <div className="p-2 bg-[#1A2B4C] text-[#FAF3E0] w-fit border border-[#1A1A1A] mb-2">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-serif-vintage font-bold text-sm text-[#1A2B4C]">
                Payment Methods & COD
              </h4>
              <p className="text-xs font-mono-retro text-gray-700 mt-2">
                • Cash on Delivery (COD) supported in 45+ cities
                <br />
                • Digital: eSewa, Khalti, Fonepay QR, ConnectIPS
                <br />
                • Return window: 7-day exchange for sizing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
