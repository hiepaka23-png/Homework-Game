export interface LevelConfig {
  levelNumber: number;
  name: string;
  description: string;
  meteorSpawnRate: number; // probability per frame
  ufoSpawnRate: number;
  ufoTypes: ('scout' | 'shooter' | 'shielded')[];
  bgTheme: {
    nebulaColor1: string;
    nebulaColor2: string;
    earthGlow: string;
  };
}

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    levelNumber: 1,
    name: 'VÀNH ĐAI THIÊN THẠCH',
    description: 'Bảo vệ Trái Đất khỏi cơn mưa thiên thạch dồn dập nguy hiểm từ vũ trụ.',
    meteorSpawnRate: 0.036,
    ufoSpawnRate: 0.008,
    ufoTypes: ['scout'],
    bgTheme: {
      nebulaColor1: 'rgba(56, 189, 248, 0.15)',
      nebulaColor2: 'rgba(30, 58, 138, 0.2)',
      earthGlow: '#0077ff',
    },
  },
  2: {
    levelNumber: 2,
    name: 'UFO TRINH SÁT',
    description: 'Hạm đội UFO trinh sát đã thâm nhập quỹ đạo. Tiêu diệt chúng trước khi chúng tấn công!',
    meteorSpawnRate: 0.030,
    ufoSpawnRate: 0.018,
    ufoTypes: ['scout', 'shooter'],
    bgTheme: {
      nebulaColor1: 'rgba(168, 85, 247, 0.15)',
      nebulaColor2: 'rgba(88, 28, 135, 0.2)',
      earthGlow: '#00f0ff',
    },
  },
  3: {
    levelNumber: 3,
    name: 'HẠM ĐỘI NGOÀI HÀNH TINH',
    description: 'Hạm đội alien siêu việt với tàu chiến mang khiên phòng thủ đang tiến vào!',
    meteorSpawnRate: 0.028,
    ufoSpawnRate: 0.022,
    ufoTypes: ['shooter', 'shielded'],
    bgTheme: {
      nebulaColor1: 'rgba(239, 68, 68, 0.15)',
      nebulaColor2: 'rgba(127, 29, 29, 0.2)',
      earthGlow: '#00ffaa',
    },
  },
  4: {
    levelNumber: 4,
    name: 'CĂN CỨ MẶT TRĂNG',
    description: 'Đánh phá căn cứ quân sự ngoài hành tinh đóng tại Mặt Trăng!',
    meteorSpawnRate: 0.025,
    ufoSpawnRate: 0.026,
    ufoTypes: ['scout', 'shooter', 'shielded'],
    bgTheme: {
      nebulaColor1: 'rgba(236, 72, 153, 0.15)',
      nebulaColor2: 'rgba(131, 24, 67, 0.2)',
      earthGlow: '#e040fb',
    },
  },
  5: {
    levelNumber: 5,
    name: 'BẢO VỆ TRÁI ĐẤT (MÀN CUỐI)',
    description: 'Trận chiến sinh tử cuối cùng chống lại Mẫu Hạm Hoàng Gia UFO Emperor!',
    meteorSpawnRate: 0.032,
    ufoSpawnRate: 0.032,
    ufoTypes: ['scout', 'shooter', 'shielded'],
    bgTheme: {
      nebulaColor1: 'rgba(245, 158, 11, 0.15)',
      nebulaColor2: 'rgba(120, 53, 15, 0.2)',
      earthGlow: '#ffaa00',
    },
  },
};
