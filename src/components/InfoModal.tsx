'use client';

import { useState } from 'react';

interface Rule {
  title: string;
  description: string;
  items: string[];
}

const APP_RULES: Record<string, Rule> = {
  map: {
    title: '🗺️ Bản đồ',
    description: 'Khu vực hiển thị bản đồ chính với tất cả marker',
    items: [
      'Chạm/Click vào bản đồ → tự động lấy địa chỉ → mở form thêm điểm',
      'Chấm xanh dương nhấp nháy là vị trí hiện tại của bạn',
      '🔴 Đỏ = Gấp | 🟡 Vàng = Bình thường | 🟢 Xanh = Khi nào tiện',
      'Bấm vào marker để xem popup thông tin',
      'Dùng 2 ngón để zoom trên điện thoại',
      'Nút ⊕ góc dưới phải: về vị trí hiện tại',
      'Dữ liệu lưu trong máy (localStorage) — không cần internet để xem',
    ],
  },
  search: {
    title: '🔍 Tìm kiếm',
    description: 'Tìm kiếm địa chỉ qua Photon API (dữ liệu OpenStreetMap)',
    items: [
      'Gõ tên địa điểm hoặc địa chỉ (≥ 3 ký tự)',
      'Kết quả hiện sau 1.5 giây khi ngừng gõ',
      'Chọn kết quả → bay đến vị trí + mở form thêm điểm',
      'Phím tắt: "/" hoặc Ctrl+K để focus ô tìm kiếm',
      'Ưu tiên kết quả gần khu vực TP.HCM',
      'Trong form thêm điểm cũng có autocomplete riêng',
    ],
  },
  list: {
    title: '📋 Danh sách',
    description: 'Quản lý tất cả điểm đã lưu',
    items: [
      '📱 Mobile: kéo thanh dưới cùng lên để mở',
      '💻 Desktop: sidebar bên trái (nút ☰)',
      'Sắp xếp: 📏 Gần nhất | 🔥 Ưu tiên | 🔤 Tên',
      'Nhóm tự động theo thành phố',
      'Hiển thị khoảng cách từ vị trí hiện tại',
      'Bấm điểm → bay đến trên bản đồ',
      'Hover → hiện nút ✏️ chỉnh sửa',
    ],
  },
  shortcuts: {
    title: '⌨️ Phím tắt',
    description: 'Các phím tắt để thao tác nhanh (trên máy tính)',
    items: [
      '/ hoặc Ctrl+K — Focus ô tìm kiếm',
      'Escape — Đóng dialog/panel đang mở',
      'L — Mở/đóng danh sách điểm',
      'M — Về vị trí hiện tại trên bản đồ',
      'I — Mở/đóng hướng dẫn này',
    ],
  },
};

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const [activeSection, setActiveSection] = useState('map');

  if (!isOpen) return null;

  const rule = APP_RULES[activeSection];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">ℹ️ Quy tắc & Hướng dẫn</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {Object.entries(APP_RULES).map(([key, r]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeSection === key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[55vh]">
          {rule && (
            <div>
              <p className="text-sm text-gray-500 mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                {rule.description}
              </p>
              <ul className="space-y-2.5">
                {rule.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <span className="text-blue-500 font-bold mt-px">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

