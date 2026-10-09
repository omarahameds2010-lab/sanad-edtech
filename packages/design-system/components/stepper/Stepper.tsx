import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '../../icon/icons';

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  isOptional?: boolean;
  validation?: (data: any) => boolean | Promise<boolean>;
}

export interface StepperProps {
  steps: StepperStep[];
  initialStep?: number;
  onComplete: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  onStepChange?: (stepIndex: number, step: any) => void;
  initialData?: any;
  validateOnStepChange?: boolean;
}

const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({ steps, initialStep = 0, onComplete, onCancel, onStepChange, initialData = {}, validateOnStepChange = true, ...props }, ref) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [formData, setFormData] = useState(initialData || {});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    const validateStep = async (stepIndex: number, data: any): Promise<boolean> => {
      const step = steps[stepIndex];
      if (!step.validation) return true;

      try {
        const isValid = await step.validation(data);
        if (!isValid) {
          setErrors(prev => ({ ...prev, [steps[stepIndex].id]: 'Validation failed' }));
          return false;
        }
        return true;
      } catch (error) {
        setErrors(prev => ({ ...prev, [steps[stepIndex].id]: 'Validation error' }));
        return false;
      }
    };

    const nextStep = async () => {
      if (validateOnStepChange) {
        const isValid = await validateStep(currentStep, formData);
        if (!isValid) return;
      }

      if (isLastStep) {
        setIsSubmitting(true);
        try {
          await onComplete(formData);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setCurrentStep(prev => prev + 1);
        onStepChange?.(currentStep + 1, steps[currentStep + 1]);
      }
    };

    const handleBack = () => {
      if (!isFirstStep) {
        setCurrentStep(prev => prev - 1);
        onStepChange?.(currentStep - 1, steps[currentStep - 1]);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.1 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: index < currentStep ? 'var(--color-success)' : index === currentStep ? 'var(--color-primary)' : 'var(--color-neutral-200)',
                    color: index <= currentStep ? 'white' : 'var(--color-neutral-400)',
                    fontWeight: 600,
                    fontSize: '14px',
                    position: 'relative',
                    zIndex: 1,
                    border: '3px solid var(--color-bg-primary)',
                  }}
                >
                  {index < currentStep ? (
                    <CheckIcon size={18} />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{index + 1}</span>
                  )}
                </motion.div>
                <p style={{ fontSize: '12px', textAlign: 'center', color: index <= currentStep ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: index <= currentStep ? 600 : 400 }}>
                  {step.label}
                </p>
              </motion.div>
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                  style={{
                    flex: 1,
                    height: '2px',
                    background: index < currentStep ? 'var(--color-success)' : 'var(--color-neutral-200)',
                    borderRadius: '2px',
                    marginTop: '16px',
                  }}
                />
              )}
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ flex: 1, padding: '24px 0', overflow: 'auto' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
              {steps[currentStep].label}
            </h2>
            {steps[currentStep].description && (
              <p style={{ color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
                {steps[currentStep].description}
              </p>
            )}
          </div>

          <div style={{ flex: 1, minHeight: '300px' }}>
            {steps[currentStep].content}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border-main)' }}>
            <motion.button
              onClick={handleBack}
              disabled={isFirstStep}
              style={{
                padding: '10px 20px',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-main)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              whileHover={{ background: 'var(--color-neutral-100)' }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeftIcon size={18} />
              Back
            </motion.button>

            <motion.button
              onClick={nextStep}
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              whileHover={{ background: 'var(--color-primary-hover)' }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : isLastStep ? (
                <>
                  Complete
                  <ChevronRightIcon size={18} />
                </>
              ) : (
                <>
                  Next
                  <ChevronRightIcon size={18} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }
);

Stepper.displayName = 'Stepper';

export { Stepper };
export type { StepperProps, StepperStep };