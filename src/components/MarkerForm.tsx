'use client';

import { useState, useEffect, useRef } from 'react';
import { Marker, Priority, SearchResult } from '@/types';
import { getPriorityColor, getPriorityLabel, getCityFromAddress } from '@/lib/utils';
import { searchAddress } from '@/lib/geocoding';

interface MarkerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Marker, 'id' | 'created_at'>) => void;
  onDelete?: () => void;
  initialData?: Partial<Marker>;
  mode: 'add' | 'edit';
}

const PRIORITIES: Priority[] = ['urgent', 'normal', 'whenever'];

export default function MarkerForm({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  mode,
}: MarkerFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [city, setCity] = useState('');

  // Address autocomplete
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setNote(initialData.note || '');
      setPriority(initialData.priority || 'normal');
      setLat(initialData.lat || 0);
      setLng(initialData.lng || 0);
      setCity(initialData.city || '');
      setSuggestions([]);
      setSearchError('');
    }
  }, [initialData, isOpen]);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setSearchError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchAddress(value);
        setSuggestions(data);
        if (data.length === 0) {
          setSearchError('Không tìm thấy — thử gõ tên khác');
        }
      } catch {
        setSearchError('Lỗi kết nối');
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 1500);
  };

  const handleSelectSuggestion = (result: SearchResult) => {
    const shortName = result.display_name.split(',').slice(0, 3).join(',');
    setAddress(shortName);
    setLat(parseFloat(result.lat));
    setLng(parseFloat(result.lon));
    setCity(getCityFromAddress(result.address));
    setSuggestions([]);
    setSearchError('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), address, note, priority, lat, lng, city });
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setNote('');
    setPriority('normal');
    setLat(0);
    setLng(0);
    setCity('');
    setSuggestions([]);
    setSearchError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">
            {mode === 'add' ? '📍 Thêm điểm mới' : '✏️ Chỉnh sửa'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Tên điểm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên điểm <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Vincom Đồng Khởi"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>

          {/* Địa chỉ + autocomplete inline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Gõ để tìm địa chỉ..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-9"
              />
              {isSearching && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Gợi ý - hiển thị inline, không absolute */}
            {
              suggestions.length > 0 && (
                <div className="mt-1.5 rounded-xl border border-blue-200 bg-blue-50/50 max-h-40 overflow-y-auto">
                  {suggestions.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(result)}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-100 border-b border-blue-100 last:border-b-0 flex items-start gap-2 transition-colors"
                    >
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">📍</span>
                      <span className="text-xs text-gray-700 line-clamp-2">{result.display_name}</span>
                    </button>
                  ))}
                </div>
              )
            }

            {/* Trạng thái tìm kiếm */}
            {isSearching && (
              <p className="text-xs text-blue-500 mt-1 ml-1">🔍 Đang tìm kiếm...</p>
            )}
            {searchError && !isSearching && (
              <p className="text-xs text-gray-400 mt-1 ml-1">{searchError}</p>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Lấy hàng cho anh A, tầng 3..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Mức độ ưu tiên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => {
                const isActive = priority === p;
                const color = getPriorityColor(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 px-2 rounded-xl border-2 text-xs font-medium transition-all ${isActive ? 'shadow-sm' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    style={
                      isActive
                        ? { color, borderColor: color, backgroundColor: color + '15' }
                        : {}
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className={isActive ? '' : 'text-gray-500'}>
                        {getPriorityLabel(p)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tọa độ */}
          {lat !== 0 && (
            <div className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-lg">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {lat.toFixed(6)}, {lng.toFixed(6)}
              {city && <span className="ml-1">· {city}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 mt-6">
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2.5 text-red-600 bg-red-50 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
            >
              🗑️ Xóa
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'add' ? '➕ Thêm' : '💾 Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
}
