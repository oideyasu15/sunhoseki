import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  BookOpen,
  QrCode,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Smartphone,
  Tag,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
  FileText,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ManualPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualPdfModal: React.FC<ManualPdfModalProps> = ({ isOpen, onClose }) => {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');
  const [currentProgress, setCurrentProgress] = useState('');

  if (!isOpen) return null;

  // Direct High-Resolution Multi-Page PDF Download
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);
      setPdfSuccessMessage('PDFドキュメントを高品質生成中...');

      const pages = [page1Ref.current, page2Ref.current, page3Ref.current].filter(Boolean);
      if (pages.length === 0) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        setCurrentProgress(`ページ ${i + 1} / ${pages.length} をレンダリング中...`);

        const canvas = await html2canvas(pageEl, {
          scale: 2.2, // crisp high DPI
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794, // Standard A4 pixel width at 96 DPI
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        // Exact A4 Dimensions (210mm x 297mm)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      pdf.save('サン宝石_バーコード商品管理システム_取扱説明書.pdf');
      setPdfSuccessMessage('PDF（全3ページ）の保存が完了しました！');
      setCurrentProgress('');
      setTimeout(() => setPdfSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
      setCurrentProgress('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Export standalone HTML
  const handleDownloadHtml = () => {
    const p1 = page1Ref.current?.innerHTML || '';
    const p2 = page2Ref.current?.innerHTML || '';
    const p3 = page3Ref.current?.innerHTML || '';

    const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>サン宝石 バーコード商品・在庫管理システム 取扱説明書</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { background: #fff; margin: 0; padding: 0; }
      .a4-page { page-break-after: always; width: 210mm !important; height: 297mm !important; margin: 0 !important; }
    }
  </style>
</head>
<body class="bg-stone-100 p-4 sm:p-8 flex flex-col items-center gap-8 font-sans">
  <div class="a4-page bg-white p-8 rounded-2xl shadow border border-[#FFD1DC] w-full max-w-[210mm] min-h-[297mm]">
    ${p1}
  </div>
  <div class="a4-page bg-white p-8 rounded-2xl shadow border border-[#FFD1DC] w-full max-w-[210mm] min-h-[297mm]">
    ${p2}
  </div>
  <div class="a4-page bg-white p-8 rounded-2xl shadow border border-[#FFD1DC] w-full max-w-[210mm] min-h-[297mm]">
    ${p3}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'サン宝石_商品管理システム_取扱説明書.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden border border-[#FFD1DC]">
        {/* Top Control Header (Hidden in Print) */}
        <div className="no-print px-4 sm:px-6 py-3.5 bg-[#FFF0F5] border-b border-[#FFD1DC] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#1A1A1A]">取扱説明書 & PDFマニュアル（全3ページ）</h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#FF69B4] border border-[#FFD1DC] shadow-2xs">
                  全ページ完全対応
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                画像・図解・各操作ステップがすべて収まった完全版マニュアルです
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF69B4] hover:bg-[#ff52a5] disabled:opacity-60 text-white text-xs font-black rounded-full shadow-md shadow-pink-200 transition-transform active:scale-95 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentProgress || 'PDF作成中...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDFをダウンロード (全3頁)</span>
                </>
              )}
            </button>

            {/* Print Dialog Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-[#4A4A4A] text-xs font-bold rounded-full border border-[#FFD1DC] shadow-2xs transition-colors"
              title="ブラウザ印刷ダイアログ"
            >
              <Printer className="w-4 h-4 text-[#FF69B4]" />
              <span>印刷</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success / Notification Bar */}
        {pdfSuccessMessage && (
          <div className="no-print bg-emerald-50 text-emerald-800 text-xs font-bold px-6 py-2 border-b border-emerald-200 flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{pdfSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* Scrollable Preview Area Containing All 3 Independent A4 Pages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-stone-100/90 flex flex-col items-center gap-6">
          
          {/* ================= PAGE 1: 表紙 & 概要 & STEP 1 バーコード入出庫 ================= */}
          <div
            ref={page1Ref}
            className="a4-page w-full max-w-[794px] min-h-[1123px] bg-white p-7 sm:p-8 rounded-2xl shadow-md border border-[#FFD1DC] flex flex-col justify-between text-[#1A1A1A] box-border"
            style={{ width: '794px', minHeight: '1123px' }}
          >
            <div className="space-y-6">
              {/* Header Badge & Title */}
              <div className="bg-gradient-to-r from-[#FFF0F5] via-white to-[#FFE4EC] p-6 rounded-2xl border-2 border-[#FFD1DC] relative overflow-hidden shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-[#FFD1DC] text-[#FF69B4] text-[11px] font-black shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF69B4]" />
                      <span>サン宝石 公式ストア・催事在庫管理</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#1A1A1A] leading-tight tracking-tight">
                      バーコード商品・在庫管理システム<br />
                      <span className="text-[#FF69B4]">かんたん操作マニュアル</span>
                    </h1>
                    <p className="text-xs text-stone-600 font-medium max-w-md leading-relaxed">
                      ほっぺちゃん、アクセサリー、文具の在庫管理、スマホカメラでのバーコードスキャン、値札シール発行までの基本操作ガイドです。
                    </p>
                  </div>

                  {/* Thumbnail Badge */}
                  <div className="bg-white p-3 rounded-2xl border border-[#FFD1DC] shadow-xs flex flex-col items-center gap-1.5 shrink-0 text-center w-28">
                    <img
                      src="https://images.unsplash.com/photo-1582845512747-e42001c95638?w=200&auto=format&fit=crop&q=80"
                      alt="ほっぺちゃん"
                      className="w-14 h-14 rounded-xl object-cover border border-[#FFD1DC]"
                    />
                    <span className="text-[10px] font-bold text-[#FF69B4] bg-[#FFF0F5] px-1.5 py-0.5 rounded">
                      リアルタイム同期
                    </span>
                    <span className="text-[9px] text-stone-400 font-mono">Ver 2.0 (全スタッフ共有)</span>
                  </div>
                </div>

                {/* 3 Core Highlights */}
                <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-[#FFD1DC]/60">
                  <div className="bg-white p-2.5 rounded-xl border border-[#FFD1DC] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FF69B4] text-white flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px]">
                      <div className="font-bold text-[#1A1A1A]">全員でリアルタイム共有</div>
                      <div className="text-[9px] text-stone-500">どの端末でも即座に同期</div>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#FFD1DC] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FF69B4] text-white flex items-center justify-center shrink-0">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px]">
                      <div className="font-bold text-[#1A1A1A]">カメラバーコード対応</div>
                      <div className="text-[9px] text-stone-500">スマホカメラで瞬時に入出庫</div>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#FFD1DC] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FF69B4] text-white flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px]">
                      <div className="font-bold text-[#1A1A1A]">値札ラベル印刷</div>
                      <div className="text-[9px] text-stone-500">写真・JANコード付き出力</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 1: バーコードスキャン＆入出庫 */}
              <div className="bg-white p-5 rounded-2xl border-2 border-[#FFD1DC] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#FFD1DC]/60 pb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#FF69B4] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#1A1A1A] flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#FF69B4]" />
                      バーコードスキャンで入出庫・在庫照会
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      スマホのカメラやUSBバーコードリーダーで瞬時に在庫数を更新します。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Step 1-1 */}
                  <div className="bg-[#FFF5F7] p-3.5 rounded-xl border border-[#FFD1DC] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black text-[#FF69B4] mb-0.5">STEP 1</div>
                      <div className="text-xs font-bold text-[#1A1A1A] mb-1">「スキャン」をタップ</div>
                      <p className="text-[10px] text-stone-600 leading-relaxed">
                        画面上部または右下のピンクの「スキャン」ボタンを押してカメラを起動します。
                      </p>
                    </div>
                    <div className="mt-3 bg-white p-2 rounded-lg border border-[#FFD1DC] text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FF69B4] text-white text-[10px] font-bold rounded-full">
                        <QrCode className="w-3 h-3" /> スキャン / 照会
                      </span>
                    </div>
                  </div>

                  {/* Step 1-2 */}
                  <div className="bg-[#FFF5F7] p-3.5 rounded-xl border border-[#FFD1DC] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black text-[#FF69B4] mb-0.5">STEP 2</div>
                      <div className="text-xs font-bold text-[#1A1A1A] mb-1">バーコードを枠内に合わせる</div>
                      <p className="text-[10px] text-stone-600 leading-relaxed">
                        商品のJANコード（13桁または8桁）を枠に合わせると「ピピッ♪」と音が鳴り自動照会されます。
                      </p>
                    </div>
                    <div className="mt-3 bg-stone-900 text-white p-2 rounded-lg text-center font-mono text-[9px] flex items-center justify-center gap-1">
                      <Smartphone className="w-3 h-3 text-pink-400" />
                      <span>JAN: 4589991001018 読取</span>
                    </div>
                  </div>

                  {/* Step 1-3 */}
                  <div className="bg-[#FFF5F7] p-3.5 rounded-xl border border-[#FFD1DC] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black text-[#FF69B4] mb-0.5">STEP 3</div>
                      <div className="text-xs font-bold text-[#1A1A1A] mb-1">数量・種別を選んで更新</div>
                      <p className="text-[10px] text-stone-600 leading-relaxed">
                        <strong>入庫(+) / 出庫(-) / 棚卸実数</strong> を選択し、数量を入力して「確定」を押します。
                      </p>
                    </div>
                    <div className="mt-3 bg-white p-1.5 rounded-lg border border-[#FFD1DC] flex justify-center gap-1">
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded">
                        入庫 +10
                      </span>
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-bold rounded">
                        出庫 -1
                      </span>
                      <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[9px] font-bold rounded">
                        実数 50
                      </span>
                    </div>
                  </div>
                </div>

                {/* Practical Advice */}
                <div className="bg-[#FFF0F5] p-3 rounded-xl border border-[#FFD1DC] text-[11px] text-stone-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF69B4] shrink-0 mt-0.5" />
                  <span>
                    <strong>便利な機能</strong>：イベント会場や催事レジで連続して販売出庫する場合は、スキャン後に「出庫」を押すだけで履歴と在庫数が即時に全スタッフの端末へ反映されます。
                  </span>
                </div>
              </div>
            </div>

            {/* Page 1 Footer */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400">
              <span>サン宝石 バーコード商品・在庫管理システム 取扱説明書</span>
              <span className="font-bold text-[#FF69B4]">1 / 3 ページ</span>
            </div>
          </div>


          {/* ================= PAGE 2: STEP 2 商品登録 & STEP 3 値札ラベル印刷 ================= */}
          <div
            ref={page2Ref}
            className="a4-page w-full max-w-[794px] min-h-[1123px] bg-white p-7 sm:p-8 rounded-2xl shadow-md border border-[#FFD1DC] flex flex-col justify-between text-[#1A1A1A] box-border"
            style={{ width: '794px', minHeight: '1123px' }}
          >
            <div className="space-y-6">
              {/* SECTION 2: 商品新規登録 & 写真添付 & AIコピー */}
              <div className="bg-white p-5 rounded-2xl border-2 border-[#FFD1DC] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#FFD1DC]/60 pb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#FF69B4] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#1A1A1A] flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-[#FF69B4]" />
                      商品台帳の新規登録 & 写真添付・AIコピー生成
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      新商品や催事限定アイテムを写真付きで手軽に登録できます。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF69B4] shrink-0 mt-0.5" />
                      <div className="text-[11px] text-stone-700">
                        <strong>基本情報入力</strong>: 商品名、カテゴリー、売価（税込）、仕入原価、初期在庫数、保管棚番号（例: A-01）を入力します。
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF69B4] shrink-0 mt-0.5" />
                      <div className="text-[11px] text-stone-700">
                        <strong>写真アップロード</strong>: スマホで撮影した写真や画像ファイルをドラッグ＆ドロップで複数枚添付可能。
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF69B4] shrink-0 mt-0.5" />
                      <div className="text-[11px] text-stone-700">
                        <strong>✨ AIキャッチコピー生成</strong>: 「AIで説明文・キャッチコピー生成」を押すと、サン宝石らしいかわいいPOP風コピーが自動作成されます。
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF69B4] shrink-0 mt-0.5" />
                      <div className="text-[11px] text-stone-700">
                        <strong>JAN自動採番</strong>: バーコードがない新商品でも「自動採番」ボタンで13桁の標準JANコードが自動発行されます。
                      </div>
                    </div>
                  </div>

                  {/* Registered Item Card Sample */}
                  <div className="bg-[#FFF0F5] p-3.5 rounded-xl border border-[#FFD1DC] flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&auto=format&fit=crop&q=80"
                        alt="オーロラほっぺちゃん"
                        className="w-14 h-14 rounded-xl object-cover border border-[#FFD1DC]"
                      />
                      <div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF69B4] text-white">
                          ほっぺちゃん
                        </span>
                        <div className="text-xs font-black text-[#1A1A1A] mt-0.5">
                          オーロラレインボー ミニオブジェ
                        </div>
                        <div className="text-xs font-black text-[#FF69B4]">¥350 (税込)</div>
                      </div>
                    </div>
                    <div className="mt-2.5 bg-white p-2 rounded-lg border border-[#FFD1DC] text-[10px] text-stone-600">
                      ✨ <strong>AI生成コピー例</strong>: 「キラキラ輝くオーロラ魔法☆限定カラー！お部屋に飾って気分アップ♡」
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: 値札・バーコードラベルの印刷 */}
              <div className="bg-white p-5 rounded-2xl border-2 border-[#FFD1DC] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#FFD1DC]/60 pb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#FF69B4] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#1A1A1A] flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-[#FF69B4]" />
                      値札シール・バーコードラベルの印刷
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      A4シール紙やラベル用紙に、商品写真とバーコードが入った値札を面付け印刷します。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  <div className="p-3 bg-[#FFF5F7] rounded-xl border border-[#FFD1DC] text-center">
                    <div className="text-xs font-black text-[#1A1A1A]">標準POP値札</div>
                    <div className="text-[9px] text-stone-500 mt-0.5">写真・価格・コピー</div>
                    <div className="mt-2 text-[9px] font-bold text-[#FF69B4] bg-white py-0.5 rounded border border-[#FFD1DC]">
                      店頭陳列用
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFF5F7] rounded-xl border border-[#FFD1DC] text-center">
                    <div className="text-xs font-black text-[#1A1A1A]">棚札バーコード</div>
                    <div className="text-[9px] text-stone-500 mt-0.5">棚番号・JANコード</div>
                    <div className="mt-2 text-[9px] font-bold text-[#FF69B4] bg-white py-0.5 rounded border border-[#FFD1DC]">
                      陳列フック用
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFF5F7] rounded-xl border border-[#FFD1DC] text-center">
                    <div className="text-xs font-black text-[#1A1A1A]">小型ジュエリー</div>
                    <div className="text-[9px] text-stone-500 mt-0.5">リング・ヘアゴム用</div>
                    <div className="mt-2 text-[9px] font-bold text-[#FF69B4] bg-white py-0.5 rounded border border-[#FFD1DC]">
                      小袋貼り付け
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFF5F7] rounded-xl border border-[#FFD1DC] text-center">
                    <div className="text-xs font-black text-[#1A1A1A]">A4台帳シート</div>
                    <div className="text-[9px] text-stone-500 mt-0.5">一覧カタログ形式</div>
                    <div className="mt-2 text-[9px] font-bold text-[#FF69B4] bg-white py-0.5 rounded border border-[#FFD1DC]">
                      控え・保管用
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF0F5] p-3 rounded-xl border border-[#FFD1DC] text-[11px] text-stone-700 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF69B4] shrink-0 mt-0.5" />
                  <div>
                    <strong>印刷設定のコツ</strong>: ブラウザの印刷画面で <strong>「倍率: 100% (実際のサイズ)」「ヘッダーとフッター: オフ」</strong> に設定すると、市販のラベルシール台紙にズレなく綺麗に出力できます。
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 Footer */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400">
              <span>サン宝石 バーコード商品・在庫管理システム 取扱説明書</span>
              <span className="font-bold text-[#FF69B4]">2 / 3 ページ</span>
            </div>
          </div>


          {/* ================= PAGE 3: STEP 4 在庫集計 & STEP 5 CSV管理 & よくある質問 ================= */}
          <div
            ref={page3Ref}
            className="a4-page w-full max-w-[794px] min-h-[1123px] bg-white p-7 sm:p-8 rounded-2xl shadow-md border border-[#FFD1DC] flex flex-col justify-between text-[#1A1A1A] box-border"
            style={{ width: '794px', minHeight: '1123px' }}
          >
            <div className="space-y-5">
              {/* SECTION 4 & 5 GRID */}
              <div className="grid grid-cols-2 gap-4">
                {/* 4. 在庫集計 & 発注アラート */}
                <div className="bg-white p-4.5 rounded-2xl border-2 border-[#FFD1DC] shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-[#FFD1DC]/60 pb-2">
                    <span className="w-6 h-6 rounded-full bg-[#FF69B4] text-white font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <h3 className="text-xs font-black text-[#1A1A1A] flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#FF69B4]" />
                      在庫集計 & 発注アラート
                    </h3>
                  </div>
                  <p className="text-[10px] text-stone-600 leading-relaxed">
                    基準在庫を下回ると「要発注」のオレンジアラートが自動表示されます。「集計・アラート」から補充が必要な商品や在庫総額（売価・原価）を一目で把握できます。
                  </p>
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-[10px] text-amber-900 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>発注点を下回った商品はワンタップで入庫補充できます。</span>
                  </div>
                </div>

                {/* 5. CSVバックアップ */}
                <div className="bg-white p-4.5 rounded-2xl border-2 border-[#FFD1DC] shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-[#FFD1DC]/60 pb-2">
                    <span className="w-6 h-6 rounded-full bg-[#FF69B4] text-white font-black text-xs flex items-center justify-center">
                      5
                    </span>
                    <h3 className="text-xs font-black text-[#1A1A1A] flex items-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      CSV入出力 & 完全バックアップ
                    </h3>
                  </div>
                  <p className="text-[10px] text-stone-600 leading-relaxed">
                    「データ管理」メニューから、商品台帳をExcelで編集できるCSV形式でダウンロードまたは一括取り込みできます。写真を含めた完全バックアップ（JSON）も可能です。
                  </p>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[10px] text-emerald-900 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>他店舗や催事会場へのデータ移行もCSV/JSONで簡単に行えます。</span>
                  </div>
                </div>
              </div>

              {/* SECTION 6: リアルタイム同期の仕組みとスタッフ運用 */}
              <div className="bg-[#FFF0F5] p-4.5 rounded-2xl border border-[#FFD1DC] space-y-2.5">
                <div className="flex items-center gap-2 font-black text-xs text-[#1A1A1A]">
                  <Users className="w-4 h-4 text-[#FF69B4]" />
                  <span>スタッフ全員でのリアルタイム共有について</span>
                </div>
                <div className="text-[10px] text-stone-600 space-y-1 leading-relaxed">
                  <p>
                    ・共有URLをスタッフのスマホやレジPCのブラウザで開くだけで、ログイン不要で最新の商品台帳・在庫数が閲覧できます。
                  </p>
                  <p>
                    ・画面上部の「<strong className="text-emerald-700">🟢 クラウド共有同期中</strong>」が点灯していれば、誰かが在庫を変更した瞬間に全画面が自動更新されます。
                  </p>
                </div>
              </div>

              {/* SECTION 7: よくある質問 & トラブルシューティング (Q&A) */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#FFD1DC] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1A1A1A] border-b border-[#FFD1DC]/60 pb-2">
                  <HelpCircle className="w-4 h-4 text-[#FF69B4]" />
                  <span>よくあるご質問 & トラブルシューティング</span>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div>
                    <div className="font-bold text-[#1A1A1A] flex items-center gap-1">
                      <span className="text-[#FF69B4] font-black">Q.</span> カメラが起動しない・許可ダイアログが出ない
                    </div>
                    <div className="text-stone-600 ml-4">
                      A. ブラウザのアドレスバー左側の「鍵マーク」または「カメラ設定」からカメラアクセスを「許可」にしてください。
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-[#1A1A1A] flex items-center gap-1">
                      <span className="text-[#FF69B4] font-black">Q.</span> ハンディバーコードリーダー（USB/Bluetooth）は使えますか？
                    </div>
                    <div className="text-stone-600 ml-4">
                      A. はい、対応しています。検索窓にカーソルを合わせるか、スキャン画面でリーダーを読み取ると自動で該当商品が開きます。
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-[#1A1A1A] flex items-center gap-1">
                      <span className="text-[#FF69B4] font-black">Q.</span> 誤って在庫数や商品を変更してしまった場合は？
                    </div>
                    <div className="text-stone-600 ml-4">
                      A. 「入出庫履歴」メニューから直近の変更内容を確認し、再度スキャン画面または商品詳細から正しい数量を入力すれば修正できます。
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Operation Banner */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between text-[10px] text-stone-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-stone-700">安心の自動保存 & バックアップ対応</span>
                </div>
                <span>Sunhoseki Barcode Inventory System 2026</span>
              </div>
            </div>

            {/* Page 3 Footer */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400">
              <span>サン宝石 バーコード商品・在庫管理システム 取扱説明書</span>
              <span className="font-bold text-[#FF69B4]">3 / 3 ページ (完)</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar (Hidden in Print) */}
        <div className="no-print px-4 sm:px-6 py-3.5 bg-[#FFF0F5] border-t border-[#FFD1DC] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600 font-medium text-center sm:text-left">
            💡 「<strong>PDFをダウンロード (全3頁)</strong>」を押すと、全内容（表紙・STEP1〜5・Q&A）がきれいに収まったPDFが保存されます。
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-stone-50 text-stone-600 font-bold text-xs border border-[#FFD1DC] shadow-2xs transition-colors flex items-center gap-1.5"
              title="ブラウザでそのまま開けるHTML形式で保存"
            >
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>HTML保存</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] disabled:opacity-60 text-white font-black text-xs shadow-md shadow-pink-200 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentProgress || 'PDF作成中...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDFをダウンロード (全3頁)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold text-xs border border-[#FFD1DC] shadow-2xs transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
