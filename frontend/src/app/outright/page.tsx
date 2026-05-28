import React from 'react';
import { Metadata } from 'next';
import { OutrightPageClient } from './OutrightPageClient';

export const metadata: Metadata = {
  title: "Tiên tri Vô địch, Vua phá lưới & Vòng bảng - World Cup Predictor",
  description: "Trổ tài tiên tri dự đoán nhà vô địch thế giới, cầu thủ đoạt chiếc giày vàng và thứ hạng bảng đấu.",
};

export default function OutrightPage() {
  return <OutrightPageClient />;
}
