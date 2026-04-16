"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AffiliateAccordionListProps = {
  items: Array<{
    answer: string;
    question: string;
  }>;
};

export function AffiliateAccordionList({
  items,
}: AffiliateAccordionListProps) {
  const [openIndex, setOpenIndex] = React.useState<number>(0);

  if (!items.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={`${item.question}-${index}`}
            className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04]"
          >
            <button
              type="button"
              data-haptic="light"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
            >
              <span className="text-sm font-semibold text-white">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-neutral-500 transition-transform duration-200",
                  isOpen && "rotate-180 text-white",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-sm leading-6 text-neutral-400">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
