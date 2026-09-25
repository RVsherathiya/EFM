import { useState, useCallback } from 'react';
import { FieldErrors, FieldValues } from 'react-hook-form';

/**
 * Hook to enforce sequential / line-by-line form validation:
 * 1. When submitting with multiple empty/invalid fields, ONLY the first invalid field displays its error.
 * 2. As the user types in that field, its validation updates live.
 * 3. Subsequent fields only show their error after preceding fields are valid AND the user presses submit.
 */
export function useSequentialValidation<T extends FieldValues>(
  fieldOrder: (keyof T)[],
  errors: FieldErrors<T>
) {
  const [maxRevealedIndex, setMaxRevealedIndex] = useState<number>(-1);

  // Pass this to handleSubmit as the second parameter: handleSubmit(onValid, handleInvalid)
  const handleInvalid = useCallback(
    (fieldErrors: FieldErrors<T>) => {
      for (let i = 0; i < fieldOrder.length; i++) {
        const fieldName = fieldOrder[i];
        if (fieldErrors[fieldName]) {
          setMaxRevealedIndex((prev) => Math.max(prev, i));
          break; // Stop at the first failing field
        }
      }
    },
    [fieldOrder]
  );

  const resetValidation = useCallback(() => {
    setMaxRevealedIndex(-1);
  }, []);

  // Returns error message for field ONLY if it has been reached and all preceding fields are valid
  const getFieldError = useCallback(
    (fieldName: keyof T): string | undefined => {
      const fieldIndex = fieldOrder.indexOf(fieldName);
      if (fieldIndex === -1 || fieldIndex > maxRevealedIndex) {
        return undefined;
      }

      // Check if any preceding field in the order has an error
      for (let i = 0; i < fieldIndex; i++) {
        const prevField = fieldOrder[i];
        if (errors[prevField]) {
          return undefined;
        }
      }

      const err = errors[fieldName];
      return err?.message as string | undefined;
    },
    [fieldOrder, maxRevealedIndex, errors]
  );

  return {
    handleInvalid,
    resetValidation,
    getFieldError,
    maxRevealedIndex,
  };
}
