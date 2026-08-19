export const defaultDailies = [
    { name: "Daily Activity", subtext: "100/100 points, free rewards" },
    { name: "Manage Cafe & Collect Fons", subtext: "Update Cafe with new trending items" },
    { name: "Make a Wish at Nacupeda's Pool" },
    { name: "Pray at the Fortune Shades Tree", subtext: "It's all random!"},
    { name: "Bond Event (Movies, Ferris Wheel)", subtext: "Once per day? Or per character?" },
    { name: "Give Gifts to Characters (Max 10)" },
    { name: "Get Daily Free Apartment Materials", subtext: "Module, Beetle Coins, Fluffy Cotton" },
    { name: "Farm Materials", subtext: "Anomaly Furniture, Monster Upgrade Materials" },
    { name: "Beat Up Civilians for Items", subtext: "Lost Wallet, Briefcases, Lunch Bags" },
    { name: "Witch's House Daily Fortune Readings" },
];
export const defaultWeeklies = [
    { name: "Defeat 3 Weekly Bosses", subtext: "Anomaly Pilgrimage" },
    { name: "Burn All City Stamina" },
    { name: "Steal DSD Toys", subtext: "Bridge Crossings (West + East), Miguel District (West), New Herland District" },
    { name: "Clear Special Delivery Commission (Old Mailbox)" },
    { name: "Enter Realm of Greed & defeat Mammon Boss", subtext: "Participate in auction first to upgrade" },
    { name: "Visit Ebisu's Auction House", subtext: "Prioritize Covetous Coins for Mammon Upgrade" },
    { name: "Complete Weekly Battle Pass Missions", subtext: "Daily play usually means overcapping on Battle Pass" }
];
export const defaultBiweeklies = [
    { name: "Pink Paws Heist", subtext: "Cap 1 million Fons" }
];
export const defaultMonthlies = [
    { name: "Otherworld Salvage Station", subtext: "Beyond the Rails Shop" },
    { name: "Lost Exchange", subtext: "(Roll Pieces) 350 + 350 + 1400 = 2100 Lost Pieces" }
];
export const defaultPatch = [
    { name: "Hunter Exchange", subtext: "Prioritize Annulith items - Lost Keys and Dice" }
];
export const defaultBeyondtheRails = { currentFloor: 1, challenges: 0 };

// 📅 ADJUST NEXT PATCH RESET DATE HERE (Year, Month [0-11], Day, Hour ET)
// Example:  Sept 30, 05:59 (UTC+8)
export const PATCH_RESET_ANCHOR = Date.UTC(2026, 8, 29, 21, 59, 0);