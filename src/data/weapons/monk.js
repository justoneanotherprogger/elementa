import { PLACEHOLDER_BASE } from "./base.js";

export const MONK_WEAPONS = {
  daibo: {
    id: "daibo",
    classId: "monk",
    element: "fire",
    title: "Дайбо",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  chain_sickle: {
    id: "chain_sickle",
    classId: "monk",
    element: "water",
    title: "Коса на цепи",
    behavior: "pull",
    base: { ...PLACEHOLDER_BASE.pull },
  },
  sai: {
    id: "sai",
    classId: "monk",
    element: "air",
    title: "Саи",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  nunchaku: {
    id: "nunchaku",
    classId: "monk",
    element: "earth",
    title: "Нунчаки",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
};
