import { ELEMENT_EFFECTS, STATUSES } from "./elements.js";
import { MAX_RANK, skillStats } from "./progression.js";
import { damageRangeText } from "../core/damage.js";
import { skillsForElement } from "./skills/index.js";

export const RANK_TITLES = [
  "Новичок",
  "Ученик",
  "Подмастерье",
  "Адепт",
  "Умелец",
  "Мастер",
  "Магистр",
  "Великий мастер",
  "Легендарный мастер",
  "Божественный мастер",
];

export function rankTitle(rank) {
  const index = Math.min(RANK_TITLES.length, Math.max(1, rank)) - 1;
  return RANK_TITLES[index];
}

function elementEffectInfo(element) {
  const effect = ELEMENT_EFFECTS[element];
  if (!effect) return { key: "status", text: "—" };
  if (!effect.status) return { key: "effect", text: "Отталкивание" };
  const status = STATUSES[effect.status];
  const chance = effect.chance ?? 1;
  return {
    key: "status",
    text:
      chance < 1
        ? `${status.title} ${Math.round(chance * 100)}% · ${status.duration.toFixed(2)} с`
        : status.title,
  };
}

function createSkillCard(skill) {
  const effectInfo = elementEffectInfo(skill.element);
  return {
    id: `skill.${skill.id}`,
    kind: "skill",
    skillId: skill.id,
    caption: "Навык",
    title: skill.name,
    icon: skill.icon,
    maxRank: MAX_RANK,
    rankOf({ skills }) {
      return skills?.rankOf?.(skill.id) ?? 0;
    },
    needsFreeSlot({ skills }) {
      return Boolean(skills) && typeof skills.hasFreeSlot === "function" && !skills.hasFreeSlot();
    },
    apply({ skills }) {
      skills?.grant(skill.id);
    },
    stats(rank) {
      const row = skillStats(skill, rank);
      return [
        { key: "damage", label: "Урон", text: damageRangeText(row.damage) },
        { key: "cooldown", label: "Кулдаун", text: `${row.cooldown.toFixed(2)} с` },
        {
          key: effectInfo.key,
          label: effectInfo.key === "status" ? "Статус" : "Эффект",
          text: effectInfo.text,
        },
      ];
    },
  };
}

export function runCardsForElement(element) {
  return skillsForElement(element).map(createSkillCard);
}
