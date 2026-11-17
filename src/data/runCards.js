import { getStatusByElement } from "./elements.js";
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

function createSkillCard(skill) {
  const status = getStatusByElement(skill.element);
  return {
    id: `skill.${skill.id}`,
    kind: "skill",
    skillId: skill.id,
    title: skill.name,
    icon: skill.icon,
    maxRank: skill.ranks.length,
    apply({ skills }) {
      skills?.grant(skill.id);
    },
    stats(rank) {
      const index = Math.min(skill.ranks.length, Math.max(1, rank)) - 1;
      const row = skill.ranks[index];
      return [
        { key: "damage", label: "Урон", text: `${row.damage}` },
        { key: "cooldown", label: "Кулдаун", text: `${row.cooldown.toFixed(2)} с` },
        { key: "status", label: "Статус", text: status?.title ?? "—" },
      ];
    },
  };
}

export function runCardsForElement(element) {
  return skillsForElement(element).map(createSkillCard);
}
