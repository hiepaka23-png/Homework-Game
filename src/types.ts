export type ControlType = 'keyboard' | 'mouse';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type ShipType = 'classic' | 'laser' | 'spread' | 'homing';

export interface ShipConfig {
  id: ShipType;
  name: string;
  tagline: string;
  description: string;
  color: string;
  glowColor: string;
  statSpeed: number; // 1-5
  statPower: number; // 1-5
  statFireRate: number; // 1-5
  icon: string;
}

export const SHIP_CONFIGS: Record<ShipType, ShipConfig> = {
  classic: {
    id: 'classic',
    name: 'HOẢ PHỤNG (PHUN LỬA DIỆN RỘNG)',
    tagline: 'Phun ngọn lửa thiêu rụi mục tiêu & đốt đạn',
    description: 'Phun chùm lửa cuồng bạo liên tục phía trước. Cấp độ đạn nâng cao kích thước ngọn lửa, tầm đốt xa và sát thương thiêu đốt cực lớn.',
    color: '#ff4d00',
    glowColor: '#ff0000',
    statSpeed: 4,
    statPower: 4,
    statFireRate: 5,
    icon: '🔥',
  },
  laser: {
    id: 'laser',
    name: 'TIÊN PHONG (LASER XUYÊN)',
    tagline: 'Laser chùm xuyên thấu cực mạnh',
    description: 'Trang bị pháo Laser năng lượng cao đâm xuyên qua hàng loạt mục tiêu theo hàng thẳng.',
    color: '#00ffff',
    glowColor: '#00bfff',
    statSpeed: 3,
    statPower: 5,
    statFireRate: 3,
    icon: '⚡',
  },
  spread: {
    id: 'spread',
    name: 'BÃO BÁO (ĐẠN CHÙM 5 TIA)',
    tagline: 'Đạn tỏa góc rộng diện rộng',
    description: 'Bắn hàng loạt đạn tỏa góc rộng 5 hướng dọn dẹp thiên thạch và UFO đông đúc cực nhanh.',
    color: '#ff9900',
    glowColor: '#ff5500',
    statSpeed: 5,
    statPower: 3,
    statFireRate: 5,
    icon: '🔥',
  },
  homing: {
    id: 'homing',
    name: 'BÓNG MA (ĐẠN ĐUỔI TỰ ĐỘNG)',
    tagline: 'Tên lửa khóa mục tiêu thông minh',
    description: 'Tự động phóng đạn đuổi theo và diệt mục tiêu thiên thạch hoặc UFO gần nhất.',
    color: '#e040fb',
    glowColor: '#a855f7',
    statSpeed: 4,
    statPower: 4,
    statFireRate: 3,
    icon: '🎯',
  },
};

export interface GameSettings {
  controlType: ControlType;
  difficulty: Difficulty;
  soundEnabled: boolean;
  volume: number; // 0 to 1
  shipType: ShipType;
}

export type GameMode = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

export enum PowerUpType {
  WEAPON_UPGRADE = 0,
  SHIP_HEAL = 1,
  EARTH_HEAL = 2,
  RAPID_FIRE = 3,
  DAMAGE_BOOST = 4,
  SHIELD_REFILL = 5,
  SPECIAL_RECHARGE = 6,
}

export interface PowerUpInfo {
  type: PowerUpType;
  label: string;
  color: string;
  icon: string;
}

export const POWERUP_CONFIGS: Record<PowerUpType, PowerUpInfo> = {
  [PowerUpType.WEAPON_UPGRADE]: { type: PowerUpType.WEAPON_UPGRADE, label: 'ĐẠN +1', color: '#ffea00', icon: '⚡' },
  [PowerUpType.SHIP_HEAL]: { type: PowerUpType.SHIP_HEAL, label: 'HỒI MÁU', color: '#00ff66', icon: '❤️' },
  [PowerUpType.EARTH_HEAL]: { type: PowerUpType.EARTH_HEAL, label: 'HỒI TRÁI ĐẤT', color: '#00bfff', icon: '🌍' },
  [PowerUpType.RAPID_FIRE]: { type: PowerUpType.RAPID_FIRE, label: 'TĂNG TỐC BẮN', color: '#ff9900', icon: '🔥' },
  [PowerUpType.DAMAGE_BOOST]: { type: PowerUpType.DAMAGE_BOOST, label: 'SÁT THƯƠNG', color: '#ff0055', icon: '💥' },
  [PowerUpType.SHIELD_REFILL]: { type: PowerUpType.SHIELD_REFILL, label: 'NẠP KHIÊN', color: '#00ffff', icon: '🛡️' },
  [PowerUpType.SPECIAL_RECHARGE]: { type: PowerUpType.SPECIAL_RECHARGE, label: 'NẠP TUYỆT CHIÊU', color: '#e040fb', icon: '🌟' },
};

export interface GameStats {
  score: number;
  level: number;
  meteorsDestroyed: number;
  ufosDestroyed: number;
  bossesDefeated: number;
  damageDealt: number;
}

export type UpgradeType =
  | 'damage'
  | 'max_hp'
  | 'earth_heal'
  | 'cooldown'
  | 'speed'
  | 'magnet'
  | 'fire_rate'
  | 'drone'
  | 'lifesteal';

export interface UpgradeOption {
  id: UpgradeType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const DRONE_UPGRADE: UpgradeOption = {
  id: 'drone',
  title: 'VỆ TINH TRỢ CHIẾN (DRONE PHỤ)',
  description: 'Triệu hồi 1 vệ tinh tự động bay quanh phi thuyền và xả đạn phụ bọc lót liên tục.',
  icon: '🛸',
  color: '#a855f7',
};

export const UPGRADE_POOL: UpgradeOption[] = [
  {
    id: 'damage',
    title: 'SÁT THƯƠNG ĐẠN (+10%)',
    description: 'Tăng 10% lực sát thương của tất cả các loại vũ khí và tên lửa.',
    icon: '💥',
    color: '#ff0055',
  },
  {
    id: 'max_hp',
    title: 'MÁU TỐI ĐA THUYỀN (+15 HP)',
    description: 'Tăng 15 HP tối đa của phi thuyền và hồi lập tức 20 HP.',
    icon: '❤️',
    color: '#00ff66',
  },
  {
    id: 'earth_heal',
    title: 'CỨU HỘ TRÁI ĐẤT (+150 HP)',
    description: 'Gia cố bầu khí quyển, hồi lập tức 150 HP sinh mệnh cho Trái Đất.',
    icon: '🌍',
    color: '#00bfff',
  },
  {
    id: 'cooldown',
    title: 'HỒI KỸ NĂNG & KHIÊN (-10%)',
    description: 'Giảm 10% thời gian hồi chiêu của Khiên bảo vệ và Tên lửa đuổi.',
    icon: '⚡',
    color: '#e040fb',
  },
  {
    id: 'speed',
    title: 'TỐC ĐỘ DI CHUYỂN (+10%)',
    description: 'Tăng 10% tốc độ di chuyển giúp phi thuyền né đạn linh hoạt hơn.',
    icon: '🚀',
    color: '#ff9900',
  },
  {
    id: 'magnet',
    title: 'NAM CHÂM HÚT EXP & ITEM (+25%)',
    description: 'Mở rộng 25% bán kính tự động hút pha lê EXP và vật phẩm nâng cấp.',
    icon: '🧲',
    color: '#00ffff',
  },
  {
    id: 'fire_rate',
    title: 'TỐC ĐỘ BẮN ĐẠN (+8%)',
    description: 'Tăng 8% tốc độ xả đạn liên tục của tất cả nòng pháo.',
    icon: '🔥',
    color: '#ffea00',
  },
  {
    id: 'lifesteal',
    title: 'HÚT MÁU CHIẾN ĐẤU (+4%)',
    description: 'Hút 4% lượng sát thương gây ra cho kẻ địch thành sinh mệnh hồi phục phi thuyền.',
    icon: '🩸',
    color: '#ff1744',
  },
];
