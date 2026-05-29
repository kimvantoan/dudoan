import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Quy tắc & Luật tính điểm - World Cup Predictor",
  description: "Chi tiết cơ cấu điểm số dự đoán trận đấu, tiên tri dài hạn và tiêu chí xếp hạng phụ (Tie-break).",
};

export default function GuidePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col gap-1 pl-1">
        <h2 className="text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent uppercase tracking-wider">
          Luật Tính Điểm Dự Đoán
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Tìm hiểu cách hệ thống tính toán điểm số và cơ chế phân hạng bảng xếp hạng của bạn.
        </p>
      </div>

      {/* 1. Điểm Từng Trận Đấu */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <span className="text-2xl">⚽</span>
          <div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              1. Dự Đoán Tỷ Số Trận Đấu
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">Cập nhật ngay sau khi trận đấu kết thúc chính thức</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Cột 1 */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl space-y-1.5 text-center">
            <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              +3 Điểm
            </span>
            <h4 className="text-xs font-extrabold text-slate-250">Tỷ số chính xác</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Trùng khớp 100% tỷ số trận đấu.<br />
              <span className="text-slate-500 italic">(Ví dụ: Đoán 2-1, kết quả 2-1)</span>
            </p>
          </div>

          {/* Cột 2 */}
          <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl space-y-1.5 text-center">
            <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              +1 Điểm
            </span>
            <h4 className="text-xs font-extrabold text-slate-250">Đúng xu hướng</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Đoán đúng kết quả Thắng/Bại/Hòa nhưng sai tỷ số cụ thể.<br />
              <span className="text-slate-500 italic">(Ví dụ: Đoán 1-0, kết quả 2-1)</span>
            </p>
          </div>

          {/* Cột 3 */}
          <div className="bg-rose-950/10 border border-rose-950/30 p-4 rounded-xl space-y-1.5 text-center">
            <span className="inline-block px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-450 text-[10px] font-black uppercase tracking-wider">
              0 Điểm
            </span>
            <h4 className="text-xs font-extrabold text-slate-250">Sai hoàn toàn</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Dự đoán sai lệch hoàn toàn kết quả chung cuộc.<br />
              <span className="text-slate-500 italic">(Ví dụ: Đoán 0-1, kết quả 1-1)</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Tiên Tri Giải Đấu (Dài Hạn) */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <span className="text-2xl">🔮</span>
          <div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              2. Tiên Tri Giải Đấu
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">
              Khóa dự đoán 15 phút trước trận khai mạc | Tính điểm khi kết thúc giải đấu
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Vòng bảng */}
          <div className="flex items-start gap-4 p-3.5 bg-slate-950/50 border border-slate-850 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 text-lg font-black shrink-0">
              📊
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-250">Thứ Hạng Vòng Bảng</h4>
                <span className="text-[10px] text-indigo-400 font-black bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-lg">
                  +10đ / Bảng
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Được cộng <strong>10 điểm</strong> cho mỗi bảng đấu mà bạn đoán trúng chính xác cả hai đội <strong>Nhất bảng (1st)</strong> và <strong>Nhì bảng (2nd)</strong> (yêu cầu đúng cả tên đội lẫn vị trí). Dự đoán sai 1 trong 2 đội hoặc sai vị trí sẽ nhận 0 điểm của bảng đó. Vị trí thứ 3 và 4 không xét điểm.
              </p>
            </div>
          </div>

          {/* Vô địch */}
          <div className="flex items-start gap-4 p-3.5 bg-slate-950/50 border border-slate-850 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-lg font-black shrink-0">
              👑
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-250">Nhà Vô Địch (Winner)</h4>
                <span className="text-[10px] text-amber-400 font-black bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-lg">
                  +20đ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Đoán chính xác đội tuyển nâng cao chiếc cúp vô địch thế giới.
              </p>
            </div>
          </div>

          {/* Vua phá lưới */}
          <div className="flex items-start gap-4 p-3.5 bg-slate-950/50 border border-slate-850 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 text-lg font-black shrink-0">
              👟
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-250">Vua Phá Lưới (Golden Boot)</h4>
                <span className="text-[10px] text-purple-400 font-black bg-purple-950/40 border border-purple-900/40 px-2 py-0.5 rounded-lg">
                  +15đ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Đoán chính xác cầu thủ giành danh hiệu Vua Phá Lưới (ghi nhiều bàn thắng nhất). Nếu có nhiều cầu thủ cùng đứng đầu danh sách ghi bàn, mọi người chơi dự đoán trúng một trong các cầu thủ đó đều được nhận 15 điểm.
              </p>
            </div>
          </div>

          {/* Rời giải sớm */}
          <div className="flex items-start gap-4 p-3.5 bg-slate-950/50 border border-slate-850 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-450 text-lg font-black shrink-0">
              ❌
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-250">Rời Giải Sớm Nhất (First Out)</h4>
                <span className="text-[10px] text-rose-400 font-black bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded-lg">
                  +10đ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Đoán chính xác đội tuyển bét bảng (đứng thứ 4) mà bảng đấu của họ kết thúc lượt trận cuối cùng sớm nhất giải đấu theo thời gian thực.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Thứ Tự Phân Hạng (Tie-break) */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              3. Cơ Chế Phân Hạng
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">Áp dụng tự động để xếp hạng các thành viên khi bằng điểm</p>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-3">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Nếu có hai hoặc nhiều người chơi đạt tổng số điểm bằng nhau trong Nhóm, hệ thống sẽ thực hiện so sánh theo thứ tự ưu tiên giảm dần dưới đây để xác định người xếp trên:
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-300">1</span>
              <span className="font-bold text-slate-350">Tổng điểm cao hơn</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-300">2</span>
              <span className="font-bold text-slate-350">Đoán chính xác Đội vô địch (Winner)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-300">3</span>
              <span className="font-bold text-slate-350">Sở hữu số trận đoán trúng tỷ số tuyệt đối (+3đ) nhiều nhất</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-300">4</span>
              <span className="font-bold text-slate-350">Thời gian lưu dự đoán Tiên tri dài hạn sớm nhất</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
