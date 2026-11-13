// Inline SVG icons. One stroke weight, currentColor, no emoji.

const NS = "http://www.w3.org/2000/svg";

function svgNode(paths, size = 16) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.flexShrink = "0";
  if (typeof paths === "string") {
    svg.innerHTML = paths;
  } else {
    for (const p of paths) {
      const node = document.createElementNS(NS, p.tag || "path");
      for (const [k, v] of Object.entries(p)) {
        if (k === "tag") continue;
        node.setAttribute(k, v);
      }
      svg.appendChild(node);
    }
  }
  return svg;
}

export const Icons = {
  skull: (s) => svgNode('<path d="M9 15h6M8 12a4 4 0 1 1 8 0v6l-2-1-2 1-2-1-2 1v-6z"/><path d="M9.5 10.5h.01M14.5 10.5h.01"/>', s),
  coin: (s) => svgNode('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5 2.5 1.1 2.5 2.5S13.4 17 12 17s-2.5-1.1-2.5-2.5"/>', s),
  sword: (s) => svgNode('<path d="M5 19l4-4m0 0l10-10 2-2-2 2L7 17m2-2l-4 4m4-4l2 2"/>', s),
  spear: (s) => svgNode('<path d="M12 3l3 4-3 2-3-2 3-4z"/><path d="M12 9v12M9 21h6"/>', s),
  sickle: (s) => svgNode('<path d="M20 6c-2 8-8 12-16 12 4-2 7-6 8-12"/><path d="M8 18l-2 2m10-12l-1 3"/>', s),
  chest: (s) => svgNode('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 12h18M8 8V6a4 4 0 0 1 8 0v2"/>', s),
  heart: (s) => svgNode('<path d="M12 21s-7-4.35-9.5-8.15C.85 10.3 2.1 7 5.3 7c2 0 3.4 1.2 4.2 2.4L12 12l2.5-2.6C15.3 8.2 16.7 7 18.7 7c3.2 0 4.45 3.3 2.8 5.85C19 16.65 12 21 12 21z"/>', s),
  star: (s) => svgNode('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>', s),
  check: (s) => svgNode('<path d="M5 13l4 4L19 7"/>', s),
  arrow: (s) => svgNode('<path d="M5 12h14M13 6l6 6-6 6"/>', s),
  volume: (s) => svgNode('<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a4.5 4.5 0 0 1 0 7M18 6a8 8 0 0 1 0 12"/>', s),
  genderMale: (s) => svgNode('<circle cx="11" cy="12" r="4"/><path d="M14.4 9.6L19 5M16.5 5h2.5v2.5"/>', s),
  genderFemale: (s) => svgNode('<circle cx="12" cy="9" r="4"/><path d="M12 13V20M9 17h6"/>', s),
  volumeOff: (s) => svgNode('<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M17 9l5 6M22 9l-5 6"/>', s),
  music: (s) => svgNode('<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>', s),
  musicOff: (s) => svgNode('<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/><path d="M3 3l18 18"/>', s),
  fire: (s) => svgNode('<path d="M12 3c3 4 4.5 6.5 4.5 9a4.5 4.5 0 1 1-9 0c0-1.5.7-2.8 1.8-4.1C10 9.5 12 12 12 12s-.5-3 0-9z"/>', s),
  water: (s) => svgNode('<path d="M12 3s6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 6-10 6-10z"/>', s),
  air: (s) => svgNode('<path d="M3 8h12a4 4 0 1 0-4-4M3 12h15a3 3 0 1 1-3 3M3 16h9"/>', s),
  earth: (s) => svgNode('<path d="M3 20l9-16 9 16H3z"/><path d="M8 12h8"/>', s),
  clock: (s) => svgNode('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', s),
  target: (s) => svgNode('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', s),
};

export function icon(name, size = 16) {
  const factory = Icons[name] || Icons.target;
  return factory(size);
}

export function iconSpan(name, size = 16, className = "") {
  const wrapper = document.createElement("span");
  wrapper.style.display = "inline-flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "6px";
  if (className) wrapper.className = className;
  wrapper.appendChild(icon(name, size));
  return wrapper;
}

export function weaponIcon(id, size = 18) {
  if (id === "spear") return icon("spear", size);
  if (id === "serp") return icon("sickle", size);
  return icon("sword", size);
}