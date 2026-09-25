/**
 * Utility for intelligent character consistency token extraction and suggestion
 */

export interface TokenCategory {
  id: string;
  name: string;
  icon?: string;
  tokens: string[];
}

export const POPULAR_TOKEN_CATEGORIES: TokenCategory[] = [
  {
    id: 'face_hair',
    name: 'Khuôn mặt & Tóc',
    icon: '👤',
    tokens: [
      'tóc đen vuốt gọn (neat black hair)',
      'tóc bạch kim bồng bềnh (flowing silver hair)',
      'mắt xanh biếc rực sáng (bright blue eyes)',
      'mắt nâu sâu thẳm (deep brown eyes)',
      'khuôn mặt góc cạnh cương nghị (sharp jawline)',
      'nụ cười tự tin rạng rỡ (confident smile)',
      'vết sẹo nhỏ trên đuôi mày (small scar over eyebrow)',
      'kính mắt gọng tròn trí thức (round intellectual glasses)',
      'làn da bánh mật khỏe khoắn (tanned glowing skin)',
    ],
  },
  {
    id: 'outfit',
    name: 'Trang phục & Giáp',
    icon: '👕',
    tokens: [
      'áo khoác da màu nâu cổ điển (vintage brown leather jacket)',
      'áo choàng phiêu lưu viền vàng (adventurer crimson cape with gold trim)',
      'bộ đồ công nghệ phi hành gia (high-tech neon astronaut suit)',
      'áo hoodie đen tối giản hiện đại (modern minimalist black hoodie)',
      'áo giáp chiến binh nhẹ (lightweight cyber tactical armor)',
      'áo sơ mi trắng cổ bẻ thanh lịch (crisp white buttoned shirt)',
      'ủng da cổ cao thám hiểm (tall rugged explorer leather boots)',
    ],
  },
  {
    id: 'accessories',
    name: 'Phụ kiện & Đạo cụ',
    icon: '🎒',
    tokens: [
      'huy hiệu ngôi sao bạc trước ngực (silver star chest badge)',
      'tai nghe over-ear phát sáng (glowing cyber headphones)',
      'ba lô du hành phản lực mini (compact jetpack backpack)',
      'vòng tay khắc hoa văn cổ đại (ancient patterned wristband)',
      'thanh bảo kiếm hộ thân sau lưng (ornate back sheath sword)',
      'mặt dây chuyền ngọc bích phát quang (luminescent jade pendant)',
    ],
  },
  {
    id: 'quality_style',
    name: 'Ghi chú Nhận Diện (Consistency Tags)',
    icon: '✨',
    tokens: [
      'same character model across scenes',
      'consistent face geometry and features',
      'identical clothing colors and textures',
      'master character keyframe',
      'cinematic high-detail character portrait',
    ],
  },
];

/**
 * Heuristics to automatically parse description into candidate consistency tokens
 */
export function extractConsistencyTokensFromText(text: string): string[] {
  if (!text || !text.trim()) return [];

  const raw = text.trim();
  const tokensSet = new Set<string>();

  // 1. Split by common delimiters (commas, semicolons, dashes, periods, newlines)
  const segments = raw
    .split(/[,;\n\.\-–•]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && s.length <= 60);

  segments.forEach((seg) => {
    // Clean leading articles or bullet points
    const cleanSeg = seg.replace(/^(cậu bé|cô bé|anh chàng|người|nhân vật|mặc|có|với|là|và)\s+/i, '').trim();
    if (cleanSeg.length >= 3) {
      tokensSet.add(cleanSeg);
    }
  });

  // 2. Keyword detection for high-impact traits
  const lower = raw.toLowerCase();

  // Age / Gender
  const ageMatch = lower.match(/(\d{1,2}\s*(?:tuổi|years old))/);
  if (ageMatch) {
    tokensSet.add(`độ tuổi: ${ageMatch[1]}`);
  }

  // Hair patterns
  if (lower.includes('tóc đen') || lower.includes('black hair')) tokensSet.add('tóc đen (black hair)');
  if (lower.includes('tóc vàng') || lower.includes('blonde')) tokensSet.add('tóc vàng (blonde hair)');
  if (lower.includes('tóc ngắn') || lower.includes('short hair')) tokensSet.add('tóc ngắn gọn gàng (short hair)');
  if (lower.includes('tóc dài') || lower.includes('long hair')) tokensSet.add('tóc dài bồng bềnh (long hair)');
  if (lower.includes('tóc bạc') || lower.includes('silver hair')) tokensSet.add('tóc bạch kim (silver hair)');

  // Eye patterns
  if (lower.includes('mắt xanh') || lower.includes('blue eyes')) tokensSet.add('mắt xanh biếc (blue eyes)');
  if (lower.includes('mắt nâu') || lower.includes('brown eyes')) tokensSet.add('mắt nâu (brown eyes)');
  if (lower.includes('mắt đen') || lower.includes('black eyes')) tokensSet.add('mắt đen sâu thẳm (black eyes)');

  // Clothing patterns
  if (lower.includes('áo choàng') || lower.includes('cape') || lower.includes('cloak')) tokensSet.add('áo choàng đặc trưng (distinctive cape)');
  if (lower.includes('áo khoác') || lower.includes('jacket')) tokensSet.add('áo khoác nhận diện (signature jacket)');
  if (lower.includes('phi hành gia') || lower.includes('astronaut')) tokensSet.add('bộ đồ phi hành gia (astronaut suit)');
  if (lower.includes('giáp') || lower.includes('armor')) tokensSet.add('bộ giáp nhận diện (signature armor)');
  if (lower.includes('kính') || lower.includes('glasses')) tokensSet.add('kính mắt nhận diện (signature glasses)');
  if (lower.includes('huy hiệu') || lower.includes('badge')) tokensSet.add('huy hiệu riêng biệt (signature badge)');
  if (lower.includes('ba lô') || lower.includes('balo') || lower.includes('backpack')) tokensSet.add('ba lô du hành (travel backpack)');

  return Array.from(tokensSet);
}

/**
 * Check if a token is present in the token string (case-insensitive substring or trimmed match)
 */
export function isTokenActive(tokenString: string, token: string): boolean {
  if (!tokenString || !token) return false;
  const normalizedList = tokenString
    .toLowerCase()
    .split(',')
    .map((s) => s.trim());
  const target = token.toLowerCase().trim();
  return normalizedList.some((item) => item === target || item.includes(target) || target.includes(item));
}

/**
 * Toggle a token in a comma-separated string
 */
export function toggleTokenInString(tokenString: string, token: string): string {
  const currentTokens = (tokenString || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const target = token.trim();
  const existsIndex = currentTokens.findIndex(
    (t) => t.toLowerCase() === target.toLowerCase() || t.includes(target) || target.includes(t)
  );

  if (existsIndex >= 0) {
    // Remove it
    currentTokens.splice(existsIndex, 1);
  } else {
    // Add it
    currentTokens.push(target);
  }

  return currentTokens.join(', ');
}

/**
 * Append tokens to existing string without duplicates
 */
export function appendTokensToString(current: string, newTokens: string[]): string {
  const list = (current || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  newTokens.forEach((tok) => {
    const trimmed = tok.trim();
    if (!trimmed) return;
    const exists = list.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase() || item.includes(trimmed) || trimmed.includes(item)
    );
    if (!exists) {
      list.push(trimmed);
    }
  });

  return list.join(', ');
}
