export type AvatarAccessory = "none" | "bow" | "headband" | "glasses" | "cap" | "earring";

export interface AvatarSpec {
  id: string;
  name: string;
  gender: "girl" | "boy";
  skin: string;
  hair: string;
  hairLight: string;
  eye: string;
  outfit: string;
  accessory: AvatarAccessory;
  accessoryColor: string;
  hairBack: string;
  hairFront: string;
}

const LONG_BACK =
  "M24 120 C14 42 62 6 110 6 C160 6 208 42 196 122 C193 168 200 200 205 218 C186 210 170 208 154 216 C140 202 84 202 70 216 C54 208 38 210 18 218 C23 200 26 168 24 120 Z";
const STRAIGHT_BANGS =
  "M36 118 C28 48 70 16 110 16 C154 16 194 48 190 120 C183 92 172 80 160 92 C151 66 128 58 112 74 C104 52 76 50 66 72 C54 58 38 74 36 100 Z";
const TWINTAIL_BACK =
  "M30 118 C22 44 70 10 110 10 C152 10 198 44 190 120 C188 150 185 165 180 176 C164 166 150 164 132 174 C120 160 100 160 88 174 C70 164 56 166 40 176 C35 165 32 150 30 118 Z M16 150 C-2 164 -4 206 10 224 C24 238 44 226 38 204 C32 182 34 162 48 150 Z M204 150 C222 164 224 206 210 224 C196 238 176 226 182 204 C188 182 186 162 172 150 Z";
const BOB_BACK =
  "M30 118 C22 44 70 10 110 10 C152 10 198 44 190 120 C188 150 185 165 180 176 C164 166 150 164 132 174 C120 160 100 160 88 174 C70 164 56 166 40 176 C35 165 32 150 30 118 Z";
const SWEPT_BANGS =
  "M36 118 C34 56 78 18 116 20 C158 22 194 54 190 120 C184 94 170 82 152 90 C136 68 104 62 84 86 C66 78 48 90 40 112 Z";
const PONYTAIL_BACK =
  "M30 118 C22 44 70 10 110 10 C150 10 194 44 188 120 C186 148 184 162 178 174 C162 164 148 162 130 172 C118 158 98 158 86 172 C68 162 54 164 38 174 C33 162 32 148 30 118 Z M186 92 C214 96 226 132 218 174 C214 194 204 210 192 212 C200 186 204 156 196 130 C192 114 186 104 186 92 Z";
const BUN_BACK =
  "M42 116 C36 60 72 28 110 28 C150 28 184 60 178 116 C175 96 168 86 160 94 C154 78 130 68 118 82 C110 64 88 60 76 78 C62 66 48 78 46 96 Z M84 20 A26 26 0 1 1 136 20 A26 26 0 1 1 84 20 Z";
const BUN_FRONT =
  "M40 116 C34 56 74 22 110 22 C150 22 188 56 182 116 C176 92 166 82 156 92 C150 74 128 64 116 80 C108 62 84 58 72 78 C60 66 46 78 44 96 Z";
const SPIKY_BACK =
  "M30 122 C28 96 40 68 52 54 L64 88 L78 40 L92 84 L108 32 L124 82 L140 38 L154 86 L168 48 L180 92 L192 64 L194 122 C186 96 174 88 164 98 C158 74 134 64 120 80 C112 56 84 52 72 72 C58 58 36 72 34 102 Z";
const SHORT_CAP =
  "M34 116 C34 62 74 24 110 24 C148 24 186 62 186 116 C180 92 170 84 160 94 C154 74 130 64 118 80 C110 62 86 58 74 78 C60 66 42 76 36 98 Z";
const SHORT_BACK =
  "M32 122 C28 54 74 16 110 16 C150 16 192 54 188 122 C184 98 174 90 164 100 C158 76 134 66 120 82 C112 60 86 56 74 76 C60 62 40 74 36 98 Z";
const BUZZ_BACK =
  "M42 116 C36 60 72 26 110 26 C150 26 184 60 178 116 C175 96 168 86 160 94 C154 78 130 68 118 82 C110 64 88 60 76 78 C62 66 48 78 46 96 Z";
const WAVY_BACK =
  "M28 118 C20 44 68 8 110 8 C154 8 200 44 192 120 C190 146 196 164 190 180 C182 168 174 178 166 168 C158 178 148 168 140 178 C130 166 120 178 110 168 C100 178 90 166 80 178 C72 168 62 178 54 168 C46 178 36 166 30 178 C24 162 30 146 28 118 Z";
const UNDERCUT_BACK =
  "M34 122 C30 58 74 20 110 20 C150 20 190 58 186 122 C182 100 172 92 164 102 C158 80 136 70 122 86 C114 64 88 60 76 80 C62 66 42 78 40 100 Z";
const UNDERCUT_FRONT =
  "M40 106 C58 60 108 42 156 64 C142 62 124 72 114 88 C106 66 80 66 68 88 C58 80 48 92 40 106 Z";

export const AVATARS: AvatarSpec[] = [
  {
    id: "manga-1",
    name: "Ronja",
    gender: "girl",
    skin: "#ffe0c2",
    hair: "#7b3f2b",
    hairLight: "#a8674c",
    eye: "#6b3f2a",
    outfit: "#ff5fa2",
    accessory: "bow",
    accessoryColor: "#ffd23f",
    hairBack: LONG_BACK,
    hairFront: STRAIGHT_BANGS,
  },
  {
    id: "manga-2",
    name: "Yuki",
    gender: "girl",
    skin: "#ffe6cf",
    hair: "#2b2436",
    hairLight: "#514a6b",
    eye: "#3b3352",
    outfit: "#45d5ff",
    accessory: "none",
    accessoryColor: "#ff5fa2",
    hairBack: TWINTAIL_BACK,
    hairFront: STRAIGHT_BANGS,
  },
  {
    id: "manga-3",
    name: "Lena",
    gender: "girl",
    skin: "#ffe0c2",
    hair: "#f2c75c",
    hairLight: "#ffe08a",
    eye: "#4f7cff",
    outfit: "#8b5cf6",
    accessory: "headband",
    accessoryColor: "#ff5fa2",
    hairBack: BOB_BACK,
    hairFront: SWEPT_BANGS,
  },
  {
    id: "manga-4",
    name: "Sakura",
    gender: "girl",
    skin: "#ffe6cf",
    hair: "#ff7bb0",
    hairLight: "#ffb3d2",
    eye: "#2fd97b",
    outfit: "#ffd23f",
    accessory: "earring",
    accessoryColor: "#45d5ff",
    hairBack: PONYTAIL_BACK,
    hairFront: STRAIGHT_BANGS,
  },
  {
    id: "manga-5",
    name: "Nora",
    gender: "girl",
    skin: "#ffddc0",
    hair: "#e0552b",
    hairLight: "#ff8a5c",
    eye: "#ff9f1c",
    outfit: "#45d5ff",
    accessory: "glasses",
    accessoryColor: "#4f7cff",
    hairBack: BUN_BACK,
    hairFront: BUN_FRONT,
  },
  {
    id: "manga-6",
    name: "Ken",
    gender: "boy",
    skin: "#ffe0c2",
    hair: "#241f2e",
    hairLight: "#4a4258",
    eye: "#6b3f2a",
    outfit: "#4f7cff",
    accessory: "none",
    accessoryColor: "#ffd23f",
    hairBack: SPIKY_BACK,
    hairFront: SHORT_CAP,
  },
  {
    id: "manga-7",
    name: "Taro",
    gender: "boy",
    skin: "#ffe6cf",
    hair: "#6b4226",
    hairLight: "#96603a",
    eye: "#3b3352",
    outfit: "#2fd97b",
    accessory: "glasses",
    accessoryColor: "#17131f",
    hairBack: SHORT_BACK,
    hairFront: SHORT_CAP,
  },
  {
    id: "manga-8",
    name: "Ben",
    gender: "boy",
    skin: "#ffe0c2",
    hair: "#f2c75c",
    hairLight: "#ffe08a",
    eye: "#4f7cff",
    outfit: "#ff5fa2",
    accessory: "none",
    accessoryColor: "#2fd97b",
    hairBack: BUZZ_BACK,
    hairFront: SHORT_CAP,
  },
  {
    id: "manga-9",
    name: "Leo",
    gender: "boy",
    skin: "#ffddc0",
    hair: "#a8674c",
    hairLight: "#c98a68",
    eye: "#1f8f5a",
    outfit: "#ff9f1c",
    accessory: "none",
    accessoryColor: "#45d5ff",
    hairBack: WAVY_BACK,
    hairFront: SWEPT_BANGS,
  },
  {
    id: "manga-10",
    name: "Hiro",
    gender: "boy",
    skin: "#ffe0c2",
    hair: "#2b2436",
    hairLight: "#514a6b",
    eye: "#6b7280",
    outfit: "#8b5cf6",
    accessory: "cap",
    accessoryColor: "#ff4d4d",
    hairBack: UNDERCUT_BACK,
    hairFront: UNDERCUT_FRONT,
  },
];

export function getAvatar(id: string | null | undefined): AvatarSpec | null {
  if (!id) return null;
  return AVATARS.find((avatar) => avatar.id === id) ?? null;
}

export function isValidAvatar(id: string): boolean {
  return AVATARS.some((avatar) => avatar.id === id);
}
