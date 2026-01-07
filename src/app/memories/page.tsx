"use client";

import { TopBar } from "@/components/navigation";
import { AdvancedSearch } from "@/components/search";

export default function MemoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Memories" />

      <main className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <AdvancedSearch />
      </main>
    </div>
  );
}
