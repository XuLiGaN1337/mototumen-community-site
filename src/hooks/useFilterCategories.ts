import { useState, useEffect } from "react";

const ADMIN_API = "https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f";

const cache: Record<string, string[]> = {};

export function useFilterCategories(section: string, fallback: string[] = []): string[] {
  const [categories, setCategories] = useState<string[]>(cache[section] || fallback);

  useEffect(() => {
    if (cache[section]) {
      setCategories(cache[section]);
      return;
    }
    fetch(`${ADMIN_API}?action=filter-categories&section=${section}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const labels = data.map((c: { label: string }) => c.label);
          cache[section] = labels;
          setCategories(labels);
        }
      })
      .catch(() => {});
  }, [section]);

  return categories;
}
