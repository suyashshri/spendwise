export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: "Food & Dining",
    icon: "🍔",
    color: "#FF6B6B",
    keywords: ["swiggy", "zomato", "restaurant", "cafe", "dominos"],
  },
  {
    name: "Groceries",
    icon: "🛒",
    color: "#4ECDC4",
    keywords: ["bigbasket", "blinkit", "dmart", "zepto", "supermarket"],
  },
  {
    name: "Transport",
    icon: "🚗",
    color: "#45B7D1",
    keywords: ["uber", "ola", "rapido", "metro", "fuel", "petrol"],
  },
  {
    name: "Shopping",
    icon: "🛍️",
    color: "#F7B731",
    keywords: ["amazon", "flipkart", "myntra", "ajio"],
  },
  {
    name: "Bills & Utilities",
    icon: "💡",
    color: "#5F27CD",
    keywords: ["electricity", "water", "gas", "broadband", "jio", "airtel"],
  },
  {
    name: "Rent & Housing",
    icon: "🏠",
    color: "#EE5A6F",
    keywords: ["rent", "maintenance", "society"],
  },
  {
    name: "Entertainment",
    icon: "🎬",
    color: "#A29BFE",
    keywords: ["netflix", "spotify", "hotstar", "pvr", "inox"],
  },
  {
    name: "Health & Medical",
    icon: "💊",
    color: "#26DE81",
    keywords: ["pharmacy", "hospital", "doctor", "apollo"],
  },
  {
    name: "Investment",
    icon: "📈",
    color: "#FD79A8",
    keywords: ["mutual fund", "stocks", "sip", "groww", "zerodha"],
  },
  {
    name: "Education",
    icon: "📚",
    color: "#54A0FF",
    keywords: ["course", "udemy", "books", "tuition"],
  },
  {
    name: "Miscellaneous",
    icon: "📦",
    color: "#95A5A6",
    keywords: [],
  },
];

export const DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORIES.map((c) => c.name);

export const OVERALL_BUDGET_SENTINEL = "Overall";

const MISCELLANEOUS = DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];

/** Looks up icon/color for a category name, falling back to the Miscellaneous appearance
 * for user-created categories (which have no icon/color of their own). */
export function getCategoryMeta(name: string): Pick<DefaultCategory, "icon" | "color"> {
  const match = DEFAULT_CATEGORIES.find((c) => c.name === name);
  return match ?? { icon: MISCELLANEOUS.icon, color: MISCELLANEOUS.color };
}
