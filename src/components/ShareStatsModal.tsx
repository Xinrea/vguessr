import React, { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ShareStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    averageAttempts: number;
  };
}

const ShareStatsModal: React.FC<ShareStatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawBackgroundPattern = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // 设置背景色
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 绘制装饰性圆圈
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1.5;

    // 左上角装饰
    ctx.beginPath();
    ctx.arc(80, 80, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(80, 80, 20, 0, Math.PI * 2);
    ctx.stroke();

    // 右上角装饰
    ctx.beginPath();
    ctx.arc(width - 80, 80, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width - 80, 80, 15, 0, Math.PI * 2);
    ctx.stroke();

    // 左下角装饰
    ctx.beginPath();
    ctx.arc(80, height - 80, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(80, height - 80, 25, 0, Math.PI * 2);
    ctx.stroke();

    // 右下角装饰
    ctx.beginPath();
    ctx.arc(width - 80, height - 80, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width - 80, height - 80, 30, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制装饰性线条
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    // 水平装饰线条
    for (let i = 0; i < 3; i++) {
      const y = 150 + i * 150;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();

      // 添加小圆点
      for (let j = 0; j < 5; j++) {
        const x = 100 + (j * (width - 200)) / 4;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#e5e7eb";
        ctx.fill();
      }
    }

    // 垂直装饰线条
    for (let i = 0; i < 2; i++) {
      const x = 200 + i * (width - 400);
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, height - 100);
      ctx.stroke();

      // 添加小圆点
      for (let j = 0; j < 3; j++) {
        const y = 150 + (j * (height - 300)) / 2;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#e5e7eb";
        ctx.fill();
      }
    }

    // 添加对角线装饰
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 0.5;

    // 左上到右下
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(width - 50, height - 50);
    ctx.stroke();

    // 右上到左下
    ctx.beginPath();
    ctx.moveTo(width - 50, 50);
    ctx.lineTo(50, height - 50);
    ctx.stroke();
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Draw background pattern
      drawBackgroundPattern(ctx, canvas.width, canvas.height);

      // Draw title
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#1a1a1a";
      ctx.textAlign = "center";
      ctx.fillText("VTuber Guessr 统计数据", canvas.width / 2, 80);

      // Draw stats grid
      const gridX = canvas.width / 2;
      const gridY = 200;
      const spacing = 120;

      // Draw total games
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#2563eb";
      ctx.fillText(stats.totalGames.toString(), gridX - spacing, gridY);
      ctx.font = "24px Arial";
      ctx.fillStyle = "#4b5563";
      ctx.fillText("总游戏局数", gridX - spacing, gridY + 40);

      // Draw wins
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#16a34a";
      ctx.fillText(stats.wins.toString(), gridX + spacing, gridY);
      ctx.font = "24px Arial";
      ctx.fillStyle = "#4b5563";
      ctx.fillText("胜利次数", gridX + spacing, gridY + 40);

      // Draw losses
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#dc2626";
      ctx.fillText(stats.losses.toString(), gridX - spacing, gridY + spacing);
      ctx.font = "24px Arial";
      ctx.fillStyle = "#4b5563";
      ctx.fillText("失败次数", gridX - spacing, gridY + spacing + 40);

      // Draw win rate
      const winRate = ((stats.wins / stats.totalGames) * 100).toFixed(1);
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#ca8a04";
      ctx.fillText(`${winRate}%`, gridX + spacing, gridY + spacing);
      ctx.font = "24px Arial";
      ctx.fillStyle = "#4b5563";
      ctx.fillText("胜率", gridX + spacing, gridY + spacing + 40);

      // Draw average attempts
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#9333ea";
      ctx.fillText(
        stats.averageAttempts.toFixed(1),
        gridX,
        gridY + spacing * 2
      );
      ctx.font = "24px Arial";
      ctx.fillStyle = "#4b5563";
      ctx.fillText("平均尝试次数", gridX, gridY + spacing * 2 + 40);

      // Draw website URL
      ctx.font = "italic 24px Arial";
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "center";
      ctx.fillText("vguessr.vjoi.cn", canvas.width / 2, canvas.height - 40);

      // Convert to image URL
      setImageUrl(canvas.toDataURL("image/png"));
    }
  }, [isOpen, stats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">分享统计数据</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" width={800} height={600} />

        {imageUrl && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 text-center">
              长按图片保存或复制以分享
            </div>
            <img
              src={imageUrl}
              alt="Stats"
              className="w-full rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareStatsModal;
