(function () {
  const groupByTeam = {
    mexico: "A",
    "south-africa": "A",
    "south-korea": "A",
    "korea-republic": "A",
    "czech-republic": "A",
    czechia: "A",
    canada: "B",
    "bosnia-herzegovina": "B",
    "bosnia-and-herzegovina": "B",
    qatar: "B",
    switzerland: "B",
    brazil: "C",
    morocco: "C",
    haiti: "C",
    scotland: "C",
    usa: "D",
    "united-states": "D",
    paraguay: "D",
    turkey: "D",
    turkiye: "D",
    australia: "D",
    germany: "E",
    curacao: "E",
    "ivory-coast": "E",
    "cote-d-ivoire": "E",
    ecuador: "E",
    netherlands: "F",
    japan: "F",
    sweden: "F",
    tunisia: "F",
    belgium: "G",
    iran: "G",
    egypt: "G",
    "new-zealand": "G",
    spain: "H",
    "cape-verde": "H",
    "cabo-verde": "H",
    "saudi-arabia": "H",
    uruguay: "H",
    france: "I",
    senegal: "I",
    iraq: "I",
    norway: "I",
    argentina: "J",
    algeria: "J",
    austria: "J",
    jordan: "J",
    portugal: "K",
    colombia: "K",
    uzbekistan: "K",
    "dr-congo": "K",
    "congo-dr": "K",
    england: "L",
    croatia: "L",
    ghana: "L",
    panama: "L"
  };

  const flagByTeam = {
    argentina: "🇦🇷",
    brazil: "🇧🇷",
    england: "🏴",
    france: "🇫🇷",
    spain: "🇪🇸",
    portugal: "🇵🇹",
    germany: "🇩🇪",
    netherlands: "🇳🇱",
    belgium: "🇧🇪",
    colombia: "🇨🇴",
    mexico: "🇲🇽",
    usa: "🇺🇸",
    "united-states": "🇺🇸",
    japan: "🇯🇵",
    morocco: "🇲🇦",
    uruguay: "🇺🇾",
    switzerland: "🇨🇭",
    croatia: "🇭🇷",
    norway: "🇳🇴",
    ecuador: "🇪🇨",
    senegal: "🇸🇳",
    austria: "🇦🇹",
    turkey: "🇹🇷",
    turkiye: "🇹🇷",
    iran: "🇮🇷",
    egypt: "🇪🇬",
    "south-korea": "🇰🇷",
    "korea-republic": "🇰🇷",
    sweden: "🇸🇪",
    algeria: "🇩🇿",
    "ivory-coast": "🇨🇮",
    "cote-d-ivoire": "🇨🇮",
    paraguay: "🇵🇾",
    australia: "🇦🇺",
    canada: "🇨🇦",
    scotland: "🏴",
    "czech-republic": "🇨🇿",
    czechia: "🇨🇿",
    ghana: "🇬🇭",
    tunisia: "🇹🇳",
    "south-africa": "🇿🇦",
    "saudi-arabia": "🇸🇦",
    qatar: "🇶🇦",
    uzbekistan: "🇺🇿",
    jordan: "🇯🇴",
    iraq: "🇮🇶",
    "dr-congo": "🇨🇩",
    "congo-dr": "🇨🇩",
    "bosnia-herzegovina": "🇧🇦",
    "bosnia-and-herzegovina": "🇧🇦",
    "new-zealand": "🇳🇿",
    panama: "🇵🇦",
    haiti: "🇭🇹",
    curacao: "🇨🇼",
    "cape-verde": "🇨🇻",
    "cabo-verde": "🇨🇻"
  };

  function normalizeTeamId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function worldCup2026GroupForTeam(teamId, fallbackGroup) {
    return groupByTeam[normalizeTeamId(teamId)] || fallbackGroup || "";
  }

  function worldCup2026FlagForTeam(teamId, fallbackFlag) {
    const flag = String(fallbackFlag || "").trim();
    if (flag && /[^\u0000-\u007f]/.test(flag)) return flag;
    return flagByTeam[normalizeTeamId(teamId)] || "";
  }

  window.WORLD_CUP_2026_GROUP_BY_TEAM = Object.freeze(groupByTeam);
  window.WORLD_CUP_2026_FLAG_BY_TEAM = Object.freeze(flagByTeam);
  window.worldCup2026GroupForTeam = worldCup2026GroupForTeam;
  window.worldCup2026FlagForTeam = worldCup2026FlagForTeam;
})();
