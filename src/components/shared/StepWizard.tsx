import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
}

export function StepWizard({ steps, currentStep }: StepWizardProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={index} className="flex items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                    isCompleted && 'bg-emerald-500 text-white shadow-md shadow-emerald-200',
                    isActive && 'bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-md shadow-emerald-200',
                    !isCompleted && !isActive && 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : stepNumber}
                </div>
                <div className="mt-2.5 text-center">
                  <p
                    className={cn(
                      'text-xs sm:text-sm font-semibold transition-colors',
                      (isActive || isCompleted) ? 'text-gray-900' : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className={cn(
                      'text-[10px] sm:text-xs mt-0.5 hidden sm:block',
                      (isActive || isCompleted) ? 'text-gray-500' : 'text-gray-300'
                    )}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-14 sm:w-28 h-0.5 mx-2 sm:mx-4 mb-8 rounded-full transition-colors duration-300',
                    stepNumber < currentStep ? 'bg-emerald-400' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
