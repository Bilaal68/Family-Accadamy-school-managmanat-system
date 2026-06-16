import { Check } from "lucide-react";

import { ENROLLMENT_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function StepIndicator({ currentStep }) {
  return (
    <>
      {/* Desktop: full stepper */}
      <ol className="hidden lg:flex lg:items-start lg:justify-between lg:gap-2">
        {ENROLLMENT_STEPS.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <li key={step.id} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      done || active ? "bg-[#10026B]" : "bg-[#E8E6FF]"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    done && "bg-[#10026B] text-white",
                    active && "bg-[#C2B30C] text-[#10026B] ring-4 ring-[#C2B30C]/30",
                    !done && !active && "bg-white text-[#6b63a3] ring-2 ring-[#E8E6FF]"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < ENROLLMENT_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      done ? "bg-[#10026B]" : "bg-[#E8E6FF]"
                    )}
                  />
                )}
              </div>
              <p
                className={cn(
                  "mt-2 text-center text-xs font-medium",
                  active ? "text-[#10026B]" : "text-[#6b63a3]"
                )}
              >
                {step.short}
              </p>
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact progress */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#10026B]">
            Step {currentStep + 1} of {ENROLLMENT_STEPS.length}
          </span>
          <span className="text-[#6b63a3]">{ENROLLMENT_STEPS[currentStep].title}</span>
        </div>
        <div className="mt-3 flex gap-1">
          {ENROLLMENT_STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index <= currentStep ? "bg-[#10026B]" : "bg-[#E8E6FF]"
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
}
