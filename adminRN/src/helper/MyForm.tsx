'use client';

import React from 'react';
import { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import Select from 'react-select';
import JoditEditor from 'jodit-react';
import { debounce } from 'lodash';

class JoditErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Jodit Editor Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-gray-500 mb-2">Editor failed to load</div>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const MyForm = memo(
  ({
    errors,
    fields = [],
    initialValues,
    validSchema,
    onSubmit = () => Promise.resolve(),
    isReset = false,
    disabled = false,
  }: {
    errors?: any;
    fields?: any[];
    initialValues: any;
    validSchema: any;
    onSubmit?: (values: any) => Promise<void>;
    isReset?: boolean;
    disabled?: boolean;
  }) => {
    const [inactive, setInActive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const submitRef = useRef(false);
    const formikRef = useRef<any>(null);

    // FIXED: Enhanced submit function with proper error handling and no blank screen
    const handleSubmit = useCallback(
      async (
        values: any,
        { resetForm, setSubmitting: setFormikSubmitting }: any,
      ) => {
        console.log('🚀 Form Submit Called with values:', values);

        // Prevent multiple submissions and blank screen
        if (submitRef.current || disabled || submitting) {
          console.log('⚠️ Submit blocked - already submitting or disabled');
          return;
        }

        try {
          submitRef.current = true;
          setSubmitting(true);
          setInActive(true);
          setFormikSubmitting(true);

          console.log('📡 Calling onSubmit function...');

          // FIXED: Proper async handling to prevent blank screen
          await onSubmit(values);

          console.log('✅ Form submitted successfully');

          if (isReset) {
            console.log('🔄 Resetting form...');
            resetForm();
          }
        } catch (error) {
          console.error('❌ Form submission error:', error);
          // Don't throw error to prevent blank screen
          // Let parent handle via error state
        } finally {
          // FIXED: Proper cleanup to prevent blank screen
          setTimeout(() => {
            submitRef.current = false;
            setInActive(false);
            setSubmitting(false);
            setFormikSubmitting(false);
          }, 500); // Reduced timeout
        }
      },
      [disabled, onSubmit, isReset, submitting],
    );

    // FIXED: Cleanup on unmount to prevent memory leaks
    useEffect(() => {
      return () => {
        if (submitRef.current) {
          submitRef.current = false;
        }
        setSubmitting(false);
        setInActive(false);
      };
    }, []);

    return (
      <Formik
        ref={formikRef}
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={validSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          setFieldValue,
          errors: formikErrors,
          touched,
          submitForm,
          isSubmitting,
        }) => {
          return (
            <FormikForm
              autoComplete="off"
              className="w-full max-w-full bg-white rounded-xl"
            >
              <div>
                {/* Global Form Error Display */}
                {errors && errors?.id && (
                  <div
                    className="flex items-center gap-3 p-4 mb-6 text-sm 2xl:text-base font-medium text-red-800 rounded-lg bg-red-50 border-l-4 border-red-500"
                    role="alert"
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <div>
                      <span className="font-medium">Error:</span> {errors?.id}
                      <ErrorMessage name="id" />
                    </div>
                  </div>
                )}

                {/* Form Fields Grid */}
                <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                  {fields?.map(({ isDisabled = false, ...field }, i) => {
                    const fieldError =
                      (formikErrors &&
                        formikErrors[field?.name] &&
                        touched[field?.name]) ||
                      (errors && errors[field?.name]);
                    return (
                      <div
                        className={`${
                          field?.col == 6 ? 'col-span-6' : 'col-span-12'
                        }`}
                        key={`${field?.name}-${i}`}
                      >
                        {field?.type === 'line' ? (
                          <div className="col-span-12 my-6">
                            <div className="flex items-center gap-3">
                              <div className="h-px flex-1 bg-slate-200"></div>
                              <h3 className="text-base font-medium text-slate-700">
                                {field?.label}
                              </h3>
                              <div className="h-px flex-1 bg-slate-200"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative space-y-1">
                            {/* Label for Form Elements */}
                            {!['submit', 'file', 'hidden'].includes(
                              field?.type,
                            ) && (
                              <label
                                htmlFor={field?.name}
                                className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1"
                              >
                                {field?.label}
                                {field?.required && (
                                  <span className="ml-1 text-rose-500">*</span>
                                )}
                              </label>
                            )}

                            {/* Field Types Rendering */}
                            {(() => {
                              const fieldProps = { ...field };
                              delete fieldProps.hideLabel;

                              switch (field?.type) {
                                // For Select Input
                                case 'select':
                                  const field2 = { ...fieldProps };
                                  delete field2.options;
                                  return (
                                    <div className="relative">
                                      <Field
                                        id={field?.name}
                                        disabled={disabled || isDisabled}
                                        className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
                                          fieldError
                                            ? 'border-rose-500 ring-1 ring-rose-500'
                                            : 'border-slate-300 hover:border-slate-400'
                                        } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
                                        {...field2}
                                        name={field?.name}
                                        as="select"
                                      >
                                        <option value="" disabled>
                                          Select {field?.label}
                                        </option>
                                        {field?.options?.map(
                                          (option: any, optIndex: any) => (
                                            <option
                                              value={
                                                option?.id || option?.value
                                              }
                                              key={`${
                                                option?.id || option?.value
                                              }-${optIndex}`}
                                            >
                                              {option?.name || option?.label}
                                            </option>
                                          ),
                                        )}
                                      </Field>
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <svg
                                          className="h-5 w-5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                          aria-hidden="true"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  );

                                // For Select2 Input
                                case 'select2':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      {...fieldProps}
                                      options={field?.options || []}
                                      component={Select2}
                                      error={fieldError}
                                      // FIXED: Pass initial values for automatic prefilling
                                      initialValue={values[field?.name]}
                                    />
                                  );

                                // For Select Multiple Input
                                case 'select-multiple':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      isMulti={true}
                                      {...fieldProps}
                                      options={field?.options || []}
                                      component={SelectMultiple}
                                      error={fieldError}
                                      // FIXED: Pass initial values for automatic prefilling
                                      initialValue={values[field?.name]}
                                    />
                                  );

                                // For Date Input
                                case 'date':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      type="date"
                                      name={field?.name}
                                      className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
                                        fieldError
                                          ? 'border-rose-500 ring-1 ring-rose-500'
                                          : 'border-slate-300 hover:border-slate-400'
                                      } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
                                      {...fieldProps}
                                    />
                                  );

                                // For DateTime Local Input
                                case 'datetime-local':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      type="datetime-local"
                                      name={field?.name}
                                      className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
                                        fieldError
                                          ? 'border-rose-500 ring-1 ring-rose-500'
                                          : 'border-slate-300 hover:border-slate-400'
                                      } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
                                      {...fieldProps}
                                    />
                                  );

                                // For Textarea Input
                                case 'textarea':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
                                        fieldError
                                          ? 'border-rose-500 ring-1 ring-rose-500'
                                          : 'border-slate-300 hover:border-slate-400'
                                      } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed resize-none min-h-[120px] text-base`}
                                      placeholder={field?.label}
                                      as="textarea"
                                      {...fieldProps}
                                    />
                                  );

                                // FIXED: For Html Editor Input - WITH AUTOMATIC PREFILLING
                                case 'text-editer':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      name={field?.name}
                                      component={TextEditer}
                                      {...fieldProps}
                                      error={fieldError}
                                      fieldIndex={i}
                                      // FIXED: Pass initial content for automatic prefilling
                                      initialContent={
                                        values[field?.name] ||
                                        field?.value ||
                                        ''
                                      }
                                      currentValue={values[field?.name]}
                                    />
                                  );

                                // For File Input
                                case 'file':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      name={field?.name}
                                      component={PictureInput}
                                      {...fieldProps}
                                      error={fieldError}
                                      // FIXED: Pass initial value for automatic prefilling
                                      initialValue={values[field?.name]}
                                      existingValue={
                                        values[`${field?.name}_existing`]
                                      }
                                    />
                                  );

                                case 'multi-file':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      name={field?.name}
                                      multiple
                                      component={PictureInputPreview}
                                      {...fieldProps}
                                      error={fieldError}
                                      // FIXED: Pass both current and existing values for automatic prefilling
                                      initialValue={values[field?.name]}
                                      existingValue={
                                        values[`${field?.name}_existing`]
                                      }
                                    />
                                  );

                                case 'image-file':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      name={field?.name}
                                      component={PictureInputPreview}
                                      {...fieldProps}
                                      error={fieldError}
                                      // FIXED: Pass both current and existing values for automatic prefilling
                                      initialValue={values[field?.name]}
                                      existingValue={
                                        values[`${field?.name}_existing`]
                                      }
                                    />
                                  );

                                case 'check':
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      type="checkbox"
                                      name={field?.name}
                                      label={field?.label}
                                      component={Checkbox}
                                      error={fieldError}
                                      // FIXED: Pass initial value for automatic prefilling
                                      initialValue={values[field?.name]}
                                    />
                                  );

                                // For Read Only Input
                                case 'readOnly':
                                  return (
                                    <div>
                                      <Field
                                        id={field?.name}
                                        disabled={disabled || isDisabled}
                                        type="text"
                                        name={field?.name}
                                        value={field?.value}
                                        readOnly
                                        className="appearance-none block w-full px-4 py-2.5 bg-slate-50 text-slate-500 border border-slate-300 rounded-lg focus:outline-none text-base"
                                      />
                                      <Field
                                        type="hidden"
                                        name={field?.name}
                                        value={field?.hiddenValue}
                                      />
                                    </div>
                                  );

                                // FIXED: For Submit Input - NO MORE BLANK SCREEN
                                case 'submit':
                                  return (
                                    <div className="flex justify-end mt-2">
                                      <button
                                        type="button"
                                        disabled={
                                          disabled ||
                                          isDisabled ||
                                          inactive ||
                                          submitting ||
                                          isSubmitting
                                        }
                                        className="inline-flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-2.5 font-medium text-white bg-sky-600 rounded-lg shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200"
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log(
                                            '🔥 Submit button clicked - calling submitForm',
                                          );

                                          // FIXED: Prevent blank screen with proper error handling
                                          try {
                                            if (!submitting && !isSubmitting) {
                                              await submitForm();
                                            }
                                          } catch (error) {
                                            console.error(
                                              'Submit error:',
                                              error,
                                            );
                                            // Don't throw to prevent blank screen
                                          }
                                        }}
                                      >
                                        {submitting || isSubmitting ? (
                                          <>
                                            <svg
                                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                              xmlns="http://www.w3.org/2000/svg"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                            >
                                              <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                              ></circle>
                                              <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                              ></path>
                                            </svg>
                                            Processing...
                                          </>
                                        ) : (
                                          field?.label
                                        )}
                                      </button>
                                    </div>
                                  );

                                case 'features':
                                  return (
                                    <div>
                                      <FeatureManager
                                        values={values}
                                        setFieldValue={setFieldValue}
                                        options={field.options}
                                        error={fieldError}
                                      />
                                    </div>
                                  );

                                // For Rest of Input Fields (Default)
                                default:
                                  return (
                                    <Field
                                      id={field?.name}
                                      disabled={disabled || isDisabled}
                                      className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
                                        fieldError
                                          ? 'border-rose-500 ring-1 ring-rose-500'
                                          : 'border-slate-300 hover:border-slate-400'
                                      } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
                                      placeholder={field?.label}
                                      {...fieldProps}
                                      autoComplete="off"
                                    />
                                  );
                              }
                            })()}

                            {/* Error Messages */}
                            {fieldError && (
                              <div className="mt-1.5 text-sm 2xl:text-base text-rose-600 flex items-center gap-1.5">
                                <svg
                                  className="w-4 h-4 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                                {errors && errors[field?.name]}
                                <ErrorMessage name={field?.name} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </FormikForm>
          );
        }}
      </Formik>
    );
  },
);

// COMPLETELY FIXED Jodit Editor with AUTOMATIC PREFILLING and NO BLANK SCREEN
const TextEditer = ({ form, field, disabled, height = '400', placeholder="",  }:any) => {
  const editor = useRef(null);
  const [content, setContent] = useState(field?.value || '');
  const updateTimeout = useRef(null);
  const lastContent = useRef(field?.value || '');
  const selectionRange = useRef(null);
  const isUserTyping = useRef(false);

  // Sync editor content with form field value only if no user changes are pending
  useEffect(() => {
    if (field?.value !== lastContent.current && field?.value !== content && !isUserTyping.current) {
      setContent(field?.value || '');
      lastContent.current = field?.value || '';
      if (editor.current && selectionRange.current) {
        editor.current.selection.restore(selectionRange.current);
      }
    }
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, [field?.value, content]);

  // Debounced update for form field
  const updateFormField = useCallback((newContent:any) => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }
    isUserTyping.current = true;
    updateTimeout.current = setTimeout(() => {
      form.setFieldValue(field?.name, newContent);
      lastContent.current = newContent;
      isUserTyping.current = false;
    }, 300);
  }, [form, field?.name]);

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    if (editor.current && editor.current.selection) {
      selectionRange.current = editor.current.selection.save();
    }
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback(() => {
    if (editor.current && selectionRange.current) {
      editor.current.selection.restore(selectionRange.current);
    }
  }, []);

  // Categorized symbols for mathematics, physics, education, and government exams
  const symbolCategories = {
    greekLetters: {
      label: 'Greek Letters',
      symbols: [
        'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω',
        'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'
      ]
    },
    mathOperators: {
      label: 'Mathematical Operators',
      symbols: [
        '∑', '∏', '∫', '∮', '∂', '∇', '∆', '∞', '∝', '∴', '∵', '∀', '∃', '∄', '∈', '∉', '∋', '∌',
        '⊂', '⊃', '⊆', '⊇', '∪', '∩', '≠', '≈', '≡', '≤', '≥', '≪', '≫', '≺', '≻', '≼', '≽',
        '±', '∓', '×', '÷', '⋅', '∘', '√', '∛', '∜', '½', '⅓', '⅔', '¼', '¾', '⅕', '⅖', '⅗', '⅘', '⅙', '⅚', '⅛', '⅜', '⅝', '⅞'
      ]
    },
    physics: {
      label: 'Physics Symbols',
      symbols: [
        'ℏ', 'ℎ', 'ℓ', 'ℯ', 'ℰ', 'ℱ', 'ℳ', 'ℴ', 'Ω', 'μ₀', 'ε₀', 'σ', 'γ', 'λ', 'ω', 'φ', 'ψ', 'θ',
        'α', 'β', 'ρ', 'τ', 'ν', 'κ', 'χ', 'ξ', 'ζ', 'η', '∆E', '∆t', '∆p', '∆x', 'ħ', 'c', 'G', 'k', 'R'
      ]
    },
    education: {
      label: 'Education & Exams',
      symbols: [
        '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰', '₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉',
        '₊', '₋', '₌', '₍', '₎', 'ₐ', 'ₑ', 'ₕ', 'ᵢ', 'ⱼ', 'ₖ', 'ₗ', 'ₘ', 'ₙ', 'ₒ', 'ₚ', 'ᵣ', 'ₛ', 'ₜ', 'ᵤ', 'ᵥ', 'ₓ',
        '°', '′', '″', '‴', '℃', '℉', '€', '£', '¥', '¢', '₹', '©', '®', '™', '§', '¶', '†', '‡', '•', '‰', '‱'
      ]
    },
    geometry: {
      label: 'Geometry',
      symbols: [
        '○', '●', '□', '■', '△', '▲', '▼', '▽', '◆', '◇', '◊', '⊥', '∥', '∠', '≅', '∼', '≐', '≑', '≒', '≓'
      ]
    },
    arrows: {
      label: 'Arrows',
      symbols: [
        '←', '→', '↑', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '⇐', '⇒', '⇑', '⇓', '⇔', '⇕'
      ]
    },
    logic: {
      label: 'Logic',
      symbols: [
        '∧', '∨', '¬', '⊕', '⊗', '⊙', '⊤', '⊥', '∀', '∃', '∄'
      ]
    }
  };

  // JoditEditor configuration
  const config = useMemo(
    () => ({
      readonly: disabled,
      activeButtonsInReadOnly: ['source', 'fullsize', 'print', 'about', 'dots'],
      saveModeInCookie: false,
      spellcheck: true,
      editorCssClass: false,
      triggerChangeEvent: true,
      width: 'auto',
        height: Number.parseInt(height) || 400,
      minHeight: 200,
      direction: '',
      language: 'en',
      debugLanguage: false,
      i18n: 'en',
      tabIndex: -1,
      toolbar: true,
      enter: 'P',
      useSplitMode: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      enableDragAndDropFileToEditor: true,
      clipboard: {
        useDefault: true,
        pasteAsHTML: true,
        cleanOnPaste: false,
        defaultAction: 'insert',
      },
      history: {
        enable: true,
        maxHistory: 100,
        undoDepth: 100,
        redoDepth: 100,
      },
      link: {
        modeClassName: 'jodit-link',
        noFollow: false,
        openInNewTab: true,
        processPastedLinks: true,
      },
      uploader: {
        insertImageAsBase64URI: false,
        url: `${import.meta.env?.VITE_API_BASE_URL}upload-editor-image`,
        format: 'json',
        pathVariableName: 'path',
        filesVariableName: () => 'file',
        headers: {
          'x-api-key': import.meta.env?.VITE_LICENCE,
        },
        prepareData: (formData:any) => formData,
        isSuccess: (resp:any) => !resp.error,
        getMsg: (resp:any) => (Array.isArray(resp.msg) ? resp.msg.join(' ') : resp.msg || 'Unknown error'),
        process: (resp:any) => ({
          files: [resp.data],
          path: '',
          baseurl: '',
          error: resp.error ? 1 : 0,
          msg: resp.msg,
        }),
        defaultHandlerSuccess: function (data:any) {
          const files = data.files || [];
          if (files.length) {
            this.selection.insertImage(files[0], null, 250);
          }
        },
        defaultHandlerError: function (resp:any) {
          this.events?.fire('errorPopap', this.i18n(resp.msg || 'Upload failed'));
        },
        withCredentials: false,
      },
      popup: {
        defaultTimeout: 0,
      },
      buttons: [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'image', 'video', 'table', 'link', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'eraser', 'copyformat', '|',
        'symbol', 'fullsize', 'print', 'about',
      ],
      buttonsXS: [
        'bold', 'italic', 'image', '|',
        'brush', 'paragraph', '|',
        'align', 'undo', 'redo', '|',
        'eraser', 'dots',
      ],
      preserveCursor: true,
      autofocus: false,
      saveSelectionOnBlur: true,

      controls: {
        symbol: {
          popup: (editor:any, current:any, self:any, close:any) => {
            try {
              const div = editor.create.div('jodit-symbols-popup');
              div.style.cssText = `
                display: flex;
                flex-direction: column;
                max-width: 600px;
                max-height: 400px;
                overflow-y: auto;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 999999;
                padding: 10px;
                font-family: Arial, sans-serif;
              `;

              // Create category tabs
              const categoryTabs = editor.create.div('jodit-category-tabs');
              categoryTabs.style.cssText = `
                display: flex;
                border-bottom: 1px solid #ddd;
                margin-bottom: 10px;
              `;

              const symbolsContainer = editor.create.div('jodit-symbols-container');
              symbolsContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
                gap: 5px;
                padding: 10px;
              `;

              let activeCategory = Object.keys(symbolCategories)[0];

              // Function to render symbols for a category
              const renderSymbols = (category:any) => {
                symbolsContainer.innerHTML = '';
                symbolCategories[category].symbols.forEach((symbol:any) => {
                  try {
                    const button = editor.create.element('button');
                    button.textContent = symbol;
                    button.title = symbol;
                    button.style.cssText = `
                      padding: 8px;
                      border: 1px solid #ddd;
                      background: white;
                      cursor: pointer;
                      border-radius: 4px;
                      font-size: 18px;
                      font-family: 'Times New Roman', serif;
                      transition: all 0.2s;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 35px;
                    `;

                    button.addEventListener('mouseenter', () => {
                      button.style.backgroundColor = '#e3f2fd';
                      button.style.borderColor = '#2196f3';
                      button.style.transform = 'scale(1.1)';
                    });

                    button.addEventListener('mouseleave', () => {
                      button.style.backgroundColor = 'white';
                      button.style.borderColor = '#ddd';
                      button.style.transform = 'scale(1)';
                    });

                    button.addEventListener('click', (e:any) => {
                      try {
                        e.preventDefault();
                        e.stopPropagation();
                        if (editor.selection) {
                          editor.selection.insertHTML(symbol);
                        } else {
                          editor.value += symbol;
                        }
                        close();
                      } catch (error) {
                        console.error('Symbol insertion error:', error);
                      }
                    });

                    symbolsContainer.appendChild(button);
                  } catch (error) {
                    console.error('Error creating symbol button:', error);
                  }
                });
              };

              // Create category buttons
              Object.keys(symbolCategories).forEach((categoryKey) => {
                const tabButton = editor.create.element('button');
                tabButton.textContent = symbolCategories[categoryKey].label;
                tabButton.style.cssText = `
                  padding: 8px 12px;
                  border: none;
                  background: ${categoryKey === activeCategory ? '#e3f2fd' : 'white'};
                  cursor: pointer;
                  font-size: 14px;
                  color: ${categoryKey === activeCategory ? '#2196f3' : '#333'};
                  border-bottom: ${categoryKey === activeCategory ? '2px solid #2196f3' : 'none'};
                  transition: all 0.2s;
                `;

                tabButton.addEventListener('click', () => {
                  activeCategory = categoryKey;
                  // Update tab styles
                  categoryTabs.querySelectorAll('button').forEach((btn:any) => {
                    btn.style.background = 'white';
                    btn.style.color = '#333';
                    btn.style.borderBottom = 'none';
                  });
                  tabButton.style.background = '#e3f2fd';
                  tabButton.style.color = '#2196f3';
                  tabButton.style.borderBottom = '2px solid #2196f3';
                  renderSymbols(categoryKey);
                });

                categoryTabs.appendChild(tabButton);
              });

              // Initial render
              renderSymbols(activeCategory);

              div.appendChild(categoryTabs);
              div.appendChild(symbolsContainer);

              return div;
            } catch (error) {
              console.error('Error creating symbol popup:', error);
              return editor.create.div();
            }
          },
          tooltip: 'Insert Symbol',
          icon: 'symbol',
        },
      },

      events: {
        afterPaste: (e:any) => {
          console.log('Paste event:', e);
          saveCursorPosition();
          return true;
        },
        beforeLinkInsert: (link:any) => {
          console.log('Inserting link:', link);
          saveCursorPosition();
          return true;
        },
        error: (error:any) => {
          console.error('JoditEditor error:', error);
        },
        beforeChange: () => {
          saveCursorPosition();
        },
        afterInit: () => {
          if (editor.current) {
            editor.current.events?.on('focus', () => {
              restoreCursorPosition();
            });
          }
        },
      },
    }),
    [disabled, saveCursorPosition, restoreCursorPosition, height]
  );

  return (
    <JoditEditor
      ref={editor}
      value={content}
      config={config}
      onBlur={(newContent) => {
        if (newContent !== content) {
          setContent(newContent);
          form.setFieldValue(field?.name, newContent);
          lastContent.current = newContent;
          saveCursorPosition();
        }
      }}
    />
  );
};

// FIXED: PictureInput with automatic prefilling
const PictureInput = memo(
  ({
    form,
    field,
    multiple,
    label,
    disabled,
    error,
    initialValue,
    existingValue,
  }: {
    form: any;
    field: any;
    multiple?: boolean;
    label?: string;
    disabled?: boolean;
    error?: boolean;
    initialValue?: any;
    existingValue?: any;
  }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [urls, setUrls] = useState<string[]>([]);
    const [fileSelected, setFileSelected] = useState(false);

    // FIXED: Automatic prefilling for file inputs with existingValue support
    useEffect(() => {
      try {
        // FIXED: Check existingValue first, then initialValue, then field.value
        const data = existingValue || initialValue || field?.value;

        console.log('🔍 PictureInput prefilling check:', {
          fieldName: field?.name,
          existingValue,
          initialValue,
          fieldValue: field?.value,
          finalData: data,
        });

        if (data != null && Array.isArray(data)) {
          const validUrls = data.filter(
            (item) => item && typeof item === 'string' && item.trim() !== '',
          );
          setUrls(validUrls);
          if (validUrls.length > 0) {
            console.log(
              `📎 File input automatically prefilled for ${field?.name}:`,
              validUrls.length,
              'files',
            );
          }
        } else if (
          data != null &&
          typeof data === 'string' &&
          data.trim() !== ''
        ) {
          setUrl(data);
          console.log(
            `📎 File input automatically prefilled for ${field?.name}:`,
            data,
          );
        } else {
          setUrl(null);
          setUrls([]);
        }
      } catch (error) {
        console.error('Error in PictureInput prefilling:', error);
        setUrl(null);
        setUrls([]);
      }
    }, [existingValue, initialValue, field?.value, field?.name]);

    return (
      <>
        <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">
          {label}
          {url && (
            <a
              className="ml-2 text-xs font-normal text-sky-600 hover:text-sky-800 transition-colors duration-200"
              target="_blank"
              href={url}
              rel="noopener noreferrer"
            >
              View Current Attachment
            </a>
          )}
        </label>

        <div className="relative group">
          <div
            className={`flex flex-col rounded-lg border-2 border-dashed ${
              error
                ? 'border-rose-400 bg-rose-50'
                : fileSelected
                ? 'border-sky-400 bg-sky-50'
                : 'border-slate-300 bg-slate-50'
            } transition-all duration-200 hover:border-sky-400 hover:bg-sky-50 focus-within:border-sky-500 focus-within:bg-sky-50`}
          >
            <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
              <svg
                className={`mb-3 h-10 w-10 ${
                  error
                    ? 'text-rose-400'
                    : fileSelected
                    ? 'text-sky-500'
                    : 'text-slate-400'
                }`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                className={`text-sm 2xl:text-base ${
                  error
                    ? 'text-rose-500'
                    : fileSelected
                    ? 'text-sky-600'
                    : 'text-slate-600'
                }`}
              >
                <label
                  htmlFor={`file-upload-${field.name}`}
                  className="relative cursor-pointer rounded-md font-medium text-sky-600 hover:text-sky-700 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id={`file-upload-${field.name}`}
                    name={field?.name}
                    type="file"
                    multiple={multiple}
                    disabled={disabled}
                    className="sr-only"
                    onChange={(e: any) => {
                      try {
                        if (e.target.files && e.target.files.length > 0) {
                          setFileSelected(true);
                          multiple
                            ? form.setFieldValue(field?.name, e.target.files)
                            : form.setFieldValue(
                                field?.name,
                                e.target.files[0],
                              );
                        } else {
                          setFileSelected(false);
                        }
                      } catch (error) {
                        console.error('Error handling file selection:', error);
                      }
                    }}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p
                className={`text-xs ${
                  error ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {fileSelected
                  ? 'File selected'
                  : 'PDF, PNG, JPG, GIF up to 10MB'}
              </p>
            </div>
          </div>
        </div>

        {/* Previous Attachments Display */}
        {urls.length > 0 && (
          <div className="mt-3">
            <p className="text-sm 2xl:text-base font-medium text-slate-700 mb-2">
              Previous Attachments:
            </p>
            <div className="flex flex-wrap gap-2">
              {urls.map((item, i) => (
                <a
                  key={`attachment-${i}`}
                  href={item}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Attachment {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </>
    );
  },
);

// FIXED: PictureInputPreview with COMPLETE automatic image prefilling and no memory leaks
const PictureInputPreview = memo(
  ({
    form,
    field,
    multiple = false,
    label,
    disabled,
    error,
    initialValue,
    existingValue,
  }: {
    form: any;
    field: any;
    multiple?: boolean;
    label?: string;
    disabled?: boolean;
    error?: boolean;
    initialValue?: any;
    existingValue?: any;
  }) => {
    const [previews, setPreviews] = useState<string[]>([]);
    const [fileSelected, setFileSelected] = useState(false);
    const objectUrlsRef = useRef<string[]>([]);

    console.log('🖼️ PictureInputPreview Debug:', {
      fieldName: field?.name,
      existingValue,
      initialValue,
      fieldValue: field?.value,
      formInitialValues: form?.initialValues,
    });

    // FIXED: Cleanup object URLs to prevent memory leaks
    const cleanupObjectUrls = useCallback(() => {
      try {
        objectUrlsRef.current.forEach((url) => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        objectUrlsRef.current = [];
      } catch (error) {
        console.error('Error cleaning up object URLs:', error);
      }
    }, []);

    // FIXED: COMPLETE automatic image prefilling with proper priority order
    useEffect(() => {
      try {
        // FIXED: Priority order - existingValue > initialValue > field.value
        const data = initialValue || existingValue || field?.value;

        console.log('🔍 Image prefilling analysis:', {
          fieldName: field?.name,
          existingValue,
          initialValue,
          fieldValue: field?.value,
          finalData: data,
          dataType: typeof data,
        });

        if (data) {
          cleanupObjectUrls();

          if (Array.isArray(data)) {
            const newPreviews = data
              .map((file: any) => {
                try {
                  if (typeof file === 'string' && file.trim() !== '') {
                    return file;
                  } else if (file instanceof File) {
                    const objectUrl = URL.createObjectURL(file);
                    objectUrlsRef.current.push(objectUrl);
                    return objectUrl;
                  }
                  return null;
                } catch (error) {
                  console.error('Error processing file for preview:', error);
                  return null;
                }
              })
              .filter(Boolean);

            setPreviews(newPreviews);
            setFileSelected(data.length > 0);
            if (newPreviews.length > 0) {
              console.log(
                `🖼️ ✅ Image preview automatically prefilled for ${field?.name}:`,
                newPreviews.length,
                'images',
              );
            }
          } else if (typeof data === 'string' && data.trim() !== '') {
            setPreviews([data]);
            setFileSelected(true);
            console.log(
              `🖼️ ✅ Image preview automatically prefilled for ${field?.name}:`,
              data,
            );
          } else if (data instanceof File) {
            try {
              const objectUrl = URL.createObjectURL(data);
              objectUrlsRef.current.push(objectUrl);
              setPreviews([objectUrl]);
              setFileSelected(true);
              console.log(
                `🖼️ ✅ Image preview automatically prefilled for ${field?.name}: File object`,
              );
            } catch (error) {
              console.error('Error creating object URL:', error);
              setPreviews([]);
              setFileSelected(false);
            }
          }
        } else {
          cleanupObjectUrls();
          setPreviews([]);
          setFileSelected(false);
          console.log(`🖼️ ❌ No image data found for ${field?.name}`);
        }
      } catch (error) {
        console.error('Error in PictureInputPreview prefilling:', error);
        cleanupObjectUrls();
        setPreviews([]);
        setFileSelected(false);
      }
    }, [
      existingValue,
      initialValue,
      field?.value,
      field?.name,
      cleanupObjectUrls,
    ]);

    // FIXED: Cleanup on unmount to prevent memory leaks
    useEffect(() => {
      return () => {
        cleanupObjectUrls();
      };
    }, [cleanupObjectUrls]);

    const handleFileChange = useCallback(
      (e: any) => {
        try {
          const files = Array.from(e.target.files);
          if (files.length > 0) {
            setFileSelected(true);
            if (multiple) {
              form.setFieldValue(field?.name, files);
            } else {
              form.setFieldValue(field?.name, files[0]);
            }
          } else {
            setFileSelected(false);
          }
        } catch (error) {
          console.error('Error handling file change:', error);
        }
      },
      [form, field?.name, multiple],
    );

    return (
      <>
        <div className="relative group">
          <div
            className={`flex flex-col rounded-lg border-2 border-dashed ${
              error
                ? 'border-rose-400 bg-rose-50'
                : fileSelected
                ? 'border-sky-400 bg-sky-50'
                : 'border-slate-300 bg-slate-50'
            } transition-all duration-200 hover:border-sky-400 hover:bg-sky-50 focus-within:border-sky-500 focus-within:bg-sky-50`}
          >
            <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
              <svg
                className={`mb-3 h-10 w-10 ${
                  error
                    ? 'text-rose-400'
                    : fileSelected
                    ? 'text-sky-500'
                    : 'text-slate-400'
                }`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                className={`text-sm 2xl:text-base ${
                  error
                    ? 'text-rose-500'
                    : fileSelected
                    ? 'text-sky-600'
                    : 'text-slate-600'
                }`}
              >
                <label
                  htmlFor={`file-upload-multi-${field.name}`}
                  className="relative cursor-pointer rounded-md font-medium text-sky-600 hover:text-sky-700 focus-within:outline-none"
                >
                  <span>Upload images</span>
                  <input
                    id={`file-upload-multi-${field.name}`}
                    name={field?.name}
                    type="file"
                    multiple={multiple}
                    disabled={disabled}
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p
                className={`text-xs ${
                  error ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {fileSelected
                  ? `${previews.length} image${
                      previews.length !== 1 ? 's' : ''
                    } selected`
                  : 'PNG, JPG, GIF up to 10MB'}
              </p>
            </div>
          </div>
        </div>

        {/* FIXED: Image Preview with COMPLETE automatic prefilling */}
        {previews.length > 0 && (
          <div className="mt-4">
            <p className="text-sm 2xl:text-base font-medium text-slate-700 mb-2">
              {existingValue ? 'Current Image:' : 'Image Preview:'}
            </p>
            <div className="flex flex-wrap gap-3">
              {previews.map((src: string, index: number) => (
                <div
                  key={`preview-${index}`}
                  className="relative group overflow-hidden rounded-lg shadow-sm border border-slate-200"
                >
                  {src ? (
                    <img
                      src={src || '/placeholder.svg'}
                      alt={`Preview ${index + 1}`}
                      className="h-50 w-full object-contain transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        try {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        } catch (error) {
                          console.error('Error handling image error:', error);
                        }
                      }}
                    />
                  ) : (
                    <div className="h-20 w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No preview</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center p-2">
                    <span className="text-white text-xs font-medium">{`Image ${
                      index + 1
                    }`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  },
);

// FIXED: Checkbox with automatic prefilling
const Checkbox = memo(
  ({
    form,
    field,
    disabled = false,
    size = 'lg',
    onChangeCustom = () => null,
    className = '',
    checked = false,
    error = false,
    initialValue,
  }: {
    form: any;
    field: any;
    disabled?: boolean;
    size?: string;
    onChangeCustom?: (value: number) => void;
    className?: string;
    checked?: boolean;
    error?: boolean;
    initialValue?: any;
  }) => {
    const [isChecked, setIsChecked] = useState(false);

    // FIXED: Automatic prefilling for checkbox
    useEffect(() => {
      try {
        const value = initialValue !== undefined ? initialValue : field.value;
        const checkedState = value === 1 || value === true || checked;
        setIsChecked(checkedState);
        if (checkedState && initialValue !== undefined) {
          console.log(
            `☑️ Checkbox automatically prefilled for ${field?.name}:`,
            checkedState,
          );
        }
      } catch (error) {
        console.error('Error in Checkbox prefilling:', error);
        setIsChecked(false);
      }
    }, [initialValue, field.value, checked, field?.name]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
          const newValue = e.target.checked;
          setIsChecked(newValue);
          onChangeCustom(newValue ? 1 : 0);
          form.setFieldValue(field?.name, newValue);
        } catch (error) {
          console.error('Error handling checkbox change:', error);
        }
      },
      [form, field?.name, onChangeCustom],
    );

    const sizeClasses = {
      sm: { wrapper: 'w-8 h-4', toggle: 'after:h-3 after:w-3 after:left-0.5' },
      md: { wrapper: 'w-10 h-5', toggle: 'after:h-4 after:w-4 after:left-0.5' },
      lg: { wrapper: 'w-12 h-6', toggle: 'after:h-5 after:w-5 after:left-0.5' },
    };

    return (
      <div className={`flex items-center ${className}`}>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id={field?.name}
            type="checkbox"
            checked={isChecked}
            disabled={disabled}
            className="sr-only peer"
            onChange={handleChange}
          />
          <div
            className={`
          ${
            sizeClasses[size as keyof typeof sizeClasses]?.wrapper ||
            sizeClasses.md.wrapper
          }
          ${
            error
              ? 'bg-rose-100 peer-checked:bg-rose-500'
              : 'bg-slate-200 peer-checked:bg-sky-500'
          }
          rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 
          dark:peer-focus:ring-sky-800 peer-checked:after:translate-x-full 
          rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] 
          after:bg-white after:border-slate-300 after:border after:rounded-full 
          ${
            sizeClasses[size as keyof typeof sizeClasses]?.toggle ||
            sizeClasses.md.toggle
          }
          after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
        `}
          ></div>
        </label>
        <span className="sr-only">{field?.label || 'Toggle'}</span>
      </div>
    );
  },
);

// FIXED: Select2 with automatic prefilling
const Select2 = memo(
  ({
    form,
    field,
    options = [],
    label = '',
    menuPortalTarget = null,
    className = '',
    classNamePrefix = 'react-select',
    disabled = false,
    onChange = () => null,
    onChangeCustom = () => null,
    onBlur = () => null,
    onChangeUpdateToNull = false,
    error = false,
    initialValue,
  }: {
    form: any;
    field: any;
    options: any[];
    label: string;
    menuPortalTarget: any;
    className: string;
    classNamePrefix: string;
    disabled: boolean;
    onChange: (value: any) => void;
    onChangeCustom: (value: any) => void;
    onBlur: (value: any) => void;
    onChangeUpdateToNull: boolean;
    error: boolean;
    initialValue?: any;
  }) => {
    const [selectedValue, setSelectedValue] = useState<any>(null);

    // FIXED: Automatic prefilling for Select2
    useEffect(() => {
      try {
        if (!options.length) return;

        const fieldValue =
          initialValue !== undefined ? initialValue : field?.value;
        if (!fieldValue) {
          setSelectedValue(null);
          return;
        }

        let foundOption = null;

        if (typeof fieldValue === 'object' && fieldValue !== null) {
          const id = fieldValue._id || fieldValue.id;
          foundOption = options.find((opt: any) =>
            [opt.id, opt._id, opt.value].includes(id),
          );
        } else {
          foundOption = options.find((opt: any) =>
            [opt.id, opt._id, opt.value].includes(fieldValue),
          );
        }

        setSelectedValue(
          foundOption || (onChangeUpdateToNull ? null : fieldValue),
        );

        if (foundOption && initialValue !== undefined) {
          console.log(
            `🔽 Select2 automatically prefilled for ${field?.name}:`,
            foundOption.name || foundOption.label,
          );
        }
      } catch (error) {
        console.error('Error in Select2 prefilling:', error);
        setSelectedValue(null);
      }
    }, [
      initialValue,
      field?.value,
      options,
      onChangeUpdateToNull,
      field?.name,
    ]);

    const handleSelectChange = useCallback(
      (value: any) => {
        try {
          setSelectedValue(value);
          const selectedId = value?.id || value?._id || value?.value || '';
          form.setFieldValue(field?.name, selectedId);
          onChange(value);
          onChangeCustom(value);
        } catch (error) {
          console.error('Error handling Select2 change:', error);
        }
      },
      [form, field?.name, onChange, onChangeCustom],
    );

    const customStyles = useMemo(
      () => ({
        control: (provided: any, state: any) => ({
          ...provided,
          borderColor: error
            ? '#F43F5E'
            : state.isFocused
            ? '#0EA5E9'
            : '#D1D5DB',
          boxShadow: error
            ? '0 0 0 1px #F43F5E'
            : state.isFocused
            ? '0 0 0 1px #0EA5E9'
            : 'none',
          '&:hover': {
            borderColor: error
              ? '#F43F5E'
              : state.isFocused
              ? '#0EA5E9'
              : '#9CA3AF',
          },
          borderRadius: '0.5rem',
          backgroundColor: disabled ? '#F3F4F6' : 'white',
          padding: '2px 4px',
          minHeight: '42px',
        }),
        option: (provided: any, state: any) => ({
          ...provided,
          backgroundColor: state.isSelected
            ? '#0EA5E9'
            : state.isFocused
            ? '#E0F2FE'
            : null,
          color: state.isSelected ? 'white' : '#111827',
          '&:active': { backgroundColor: '#38BDF8' },
          padding: '10px 12px',
        }),
        menu: (provided: any) => ({
          ...provided,
          borderRadius: '0.5rem',
          boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          overflow: 'hidden',
        }),
        placeholder: (provided: any) => ({ ...provided, color: '#9CA3AF' }),
        indicatorSeparator: (provided: any) => ({
          ...provided,
          display: 'none',
        }),
        dropdownIndicator: (provided: any) => ({
          ...provided,
          color: '#6B7280',
        }),
        singleValue: (provided: any) => ({
          ...provided,
          color: disabled ? '#9CA3AF' : '#111827',
        }),
      }),
      [error, disabled],
    );

    return (
      <Select
        closeMenuOnSelect={true}
        options={options}
        isDisabled={disabled}
        menuPortalTarget={menuPortalTarget}
        placeholder={`Select ${label}`}
        className={className}
        classNamePrefix={classNamePrefix}
        styles={customStyles}
        getOptionLabel={(option: any) => option?.name || option?.label || ''}
        getOptionValue={(option: any) =>
          option?.id || option?._id || option?.value || ''
        }
        value={selectedValue}
        onBlur={() => onBlur(selectedValue)}
        onChange={handleSelectChange}
        isClearable
      />
    );
  },
);

// FIXED: SelectMultiple with automatic prefilling
const SelectMultiple = memo(
  ({
    className = '',
    placeholder = '',
    field,
    form,
    disabled = false,
    options = [],
    isMulti = false,
    error = false,
    initialValue,
  }: {
    className?: string;
    placeholder?: string;
    field: any;
    form: any;
    disabled?: boolean;
    options: any[];
    isMulti?: boolean;
    error?: boolean;
    initialValue?: any;
  }) => {
    const handleChange = useCallback(
      (selectedOptions: any) => {
        try {
          const values = isMulti
            ? selectedOptions?.map(
                (item: any) => item.id || item._id || item.value,
              ) || []
            : selectedOptions?.id ||
              selectedOptions?._id ||
              selectedOptions?.value ||
              '';
          form.setFieldValue(field?.name, values);
        } catch (error) {
          console.error('Error handling SelectMultiple change:', error);
        }
      },
      [form, field?.name, isMulti],
    );

    // FIXED: Automatic prefilling for SelectMultiple
    const getValue = useCallback(() => {
      try {
        if (!options.length) return isMulti ? [] : null;

        const fieldValue =
          initialValue !== undefined ? initialValue : field?.value;

        if (isMulti) {
          const fieldValues = fieldValue || [];
          const selectedOptions = options.filter((option: any) =>
            fieldValues.includes(option?.id || option?._id || option?.value),
          );

          if (selectedOptions.length > 0 && initialValue !== undefined) {
            console.log(
              `🔽 SelectMultiple automatically prefilled for ${field?.name}:`,
              selectedOptions.length,
              'options',
            );
          }

          return selectedOptions;
        } else {
          const selectedOption =
            options.find(
              (option: any) =>
                (option?.id || option?._id || option?.value) === fieldValue,
            ) || null;

          if (selectedOption && initialValue !== undefined) {
            console.log(
              `🔽 SelectMultiple automatically prefilled for ${field?.name}:`,
              selectedOption.name || selectedOption.label,
            );
          }

          return selectedOption;
        }
      } catch (error) {
        console.error('Error in SelectMultiple getValue:', error);
        return isMulti ? [] : null;
      }
    }, [options, initialValue, field?.value, isMulti, field?.name]);

    const customStyles = useMemo(
      () => ({
        control: (provided: any, state: any) => ({
          ...provided,
          borderColor: error
            ? '#F43F5E'
            : state.isFocused
            ? '#0EA5E9'
            : '#D1D5DB',
          boxShadow: error
            ? '0 0 0 1px #F43F5E'
            : state.isFocused
            ? '0 0 0 1px #0EA5E9'
            : 'none',
          '&:hover': {
            borderColor: error
              ? '#F43F5E'
              : state.isFocused
              ? '#0EA5E9'
              : '#9CA3AF',
          },
          borderRadius: '0.5rem',
          backgroundColor: disabled ? '#F3F4F6' : 'white',
          padding: '2px 4px',
          minHeight: '42px',
        }),
        multiValue: (provided: any) => ({
          ...provided,
          backgroundColor: '#E0F2FE',
          borderRadius: '0.375rem',
          padding: '1px 2px',
          margin: '2px',
        }),
        multiValueLabel: (provided: any) => ({
          ...provided,
          color: '#0369A1',
          fontSize: '0.875rem',
          padding: '0 4px',
        }),
        multiValueRemove: (provided: any) => ({
          ...provided,
          color: '#0EA5E9',
          borderRadius: '0 0.375rem 0.375rem 0',
          '&:hover': { backgroundColor: '#BAE6FD', color: '#0369A1' },
        }),
        option: (provided: any, state: any) => ({
          ...provided,
          backgroundColor: state.isSelected
            ? '#0EA5E9'
            : state.isFocused
            ? '#E0F2FE'
            : null,
          color: state.isSelected ? 'white' : '#111827',
          '&:active': { backgroundColor: '#38BDF8' },
          padding: '10px 12px',
        }),
        menu: (provided: any) => ({
          ...provided,
          borderRadius: '0.5rem',
          boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          overflow: 'hidden',
        }),
        placeholder: (provided: any) => ({ ...provided, color: '#9CA3AF' }),
        indicatorSeparator: (provided: any) => ({
          ...provided,
          display: 'none',
        }),
        dropdownIndicator: (provided: any) => ({
          ...provided,
          color: '#6B7280',
        }),
      }),
      [error, disabled],
    );

    return (
      <Select
        className={className}
        isDisabled={disabled}
        name={field?.name}
        value={getValue()}
        onChange={handleChange}
        placeholder={placeholder}
        options={options}
        styles={customStyles}
        getOptionLabel={(option: any) => option?.name || option?.label || ''}
        getOptionValue={(option: any) =>
          option?.id || option?._id || option?.value || ''
        }
        isMulti={isMulti}
        isClearable
      />
    );
  },
);

// FIXED: FeatureManager with error handling
const FeatureManager = memo(
  ({
    options = [],
    values,
    setFieldValue,
    error,
  }: {
    options: any[];
    values: any;
    setFieldValue: (field: string, value: any) => void;
    error?: boolean;
  }) => {
    const [selectedFeature, setSelectedFeature] = useState<any>(null);
    const [featureValue, setFeatureValue] = useState('');
    const [featureDescription, setFeatureDescription] = useState('');
    const [formError, setFormError] = useState('');

    const handleAddFeature = useCallback(() => {
      try {
        if (!selectedFeature) {
          setFormError('Please select a feature');
          return;
        }

        if (!featureValue) {
          setFormError('Please enter a value');
          return;
        }

        setFormError('');
        const newFeatures = {
          ...values.features,
          [selectedFeature.id]: {
            name: selectedFeature.name,
            description: featureDescription,
            value: Number.parseInt(featureValue),
          },
        };

        setFieldValue('features', newFeatures);
        setSelectedFeature(null);
        setFeatureValue('');
        setFeatureDescription('');
      } catch (error) {
        console.error('Error adding feature:', error);
        setFormError('Failed to add feature');
      }
    }, [
      selectedFeature,
      featureValue,
      featureDescription,
      values.features,
      setFieldValue,
    ]);

    const handleRemoveFeature = useCallback(
      (featureKey: string) => {
        try {
          const newFeatures = { ...values.features };
          delete newFeatures[featureKey];
          setFieldValue('features', newFeatures);
        } catch (error) {
          console.error('Error removing feature:', error);
        }
      },
      [values.features, setFieldValue],
    );

    const editFeature = useCallback(
      (key: string, feature: any) => {
        try {
          setSelectedFeature(
            options.find(
              (option: any) =>
                option.id === Number.parseInt(key) ||
                option.name === feature.name,
            ),
          );
          setFeatureValue(feature.value.toString());
          setFeatureDescription(feature.description || '');
          handleRemoveFeature(key);
        } catch (error) {
          console.error('Error editing feature:', error);
        }
      },
      [options, handleRemoveFeature],
    );

    return (
      <div className="space-y-4">
        <div
          className={`p-5 rounded-lg border ${
            error
              ? 'border-rose-300 bg-rose-50'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <h3 className="font-medium text-slate-800 mb-3">Add Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">
                Feature
              </label>
              <Field
                name="featureSelector"
                component={Select2}
                options={options}
                value={selectedFeature}
                onChange={setSelectedFeature}
                placeholder="Select Feature"
                className="w-full"
              />
            </div>
            <div className="md:col-span-5">
              <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                name="feature_description"
                placeholder="Feature description"
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                className="appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">
                Value
              </label>
              <input
                type="number"
                name="featureValue"
                placeholder="Value"
                value={featureValue}
                onChange={(e) => setFeatureValue(e.target.value)}
                className="appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base"
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="button"
                className="w-full flex justify-center items-center px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200"
                onClick={handleAddFeature}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {formError && (
            <div className="mt-2 text-sm 2xl:text-base text-rose-600 flex items-center gap-1.5">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {formError}
            </div>
          )}
        </div>

        {Object.keys(values.features || {}).length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Feature Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {Object.entries(values.features || {}).map(
                    ([key, feature]) => {
                      const typedFeature = feature as {
                        name: string;
                        description: string;
                        value: number;
                      };
                      return (
                        <tr
                          key={key}
                          className="hover:bg-slate-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base font-medium text-slate-700">
                            {key}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base text-slate-600">
                            {typedFeature.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base text-slate-600">
                            {typedFeature.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base text-slate-600">
                            {typedFeature.value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm 2xl:text-base font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="text-sky-600 hover:text-sky-800 focus:outline-none focus:underline transition-colors duration-200"
                                onClick={() => editFeature(key, typedFeature)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-rose-600 hover:text-rose-800 focus:outline-none focus:underline transition-colors duration-200"
                                onClick={() => handleRemoveFeature(key)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  },
);

// Set display names for better debugging
MyForm.displayName = 'MyForm';
TextEditer.displayName = 'TextEditer';
PictureInput.displayName = 'PictureInput';
PictureInputPreview.displayName = 'PictureInputPreview';
Checkbox.displayName = 'Checkbox';
Select2.displayName = 'Select2';
SelectMultiple.displayName = 'SelectMultiple';
FeatureManager.displayName = 'FeatureManager';

export {
  PictureInput,
  Checkbox,
  Select2,
  SelectMultiple,
  TextEditer,
  PictureInputPreview,
  FeatureManager,
};

export default MyForm;

// "use client"

// import React from "react"
// import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react"
// import { Formik, Form as FormikForm, Field, ErrorMessage } from "formik"
// import Select from "react-select"
// import JoditEditor from "jodit-react"
// import { debounce } from "lodash"

// class JoditErrorBoundary extends React.Component<
//   { children: React.ReactNode; fallback?: React.ReactNode },
//   { hasError: boolean; error?: Error }
// > {
//   constructor(props: any) {
//     super(props)
//     this.state = { hasError: false }
//   }

//   static getDerivedStateFromError(error: Error) {
//     return { hasError: true, error }
//   }

//   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
//     console.error("Jodit Editor Error:", error, errorInfo)
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         this.props.fallback || (
//           <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
//             <div className="text-center">
//               <div className="text-gray-500 mb-2">Editor failed to load</div>
//               <button
//                 onClick={() => this.setState({ hasError: false })}
//                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         )
//       )
//     }

//     return this.props.children
//   }
// }

// const MyForm = memo(
//   ({
//     errors,
//     fields = [],
//     initialValues,
//     validSchema,
//     onSubmit = () => null,
//     isReset = false,
//     disabled = false,
//   }: {
//     errors?: any
//     fields?: any[]
//     initialValues: any
//     validSchema: any
//     onSubmit?: (values: any) => void
//     isReset?: boolean
//     disabled?: boolean
//   }) => {
//     const [inactive, setInActive] = useState(false)
//     const [submitting, setSubmitting] = useState(false)
//     const submitRef = useRef(false) // Prevent multiple submissions

//     // Enhanced submit function with proper API call handling
//     const handleSubmit = useCallback(
//       async (values: any, { resetForm }: any) => {
//         console.log("🚀 Form Submit Called with values:", values)

//         // Prevent multiple submissions
//         if (submitRef.current || disabled || submitting) {
//           console.log("⚠️ Submit blocked - already submitting or disabled")
//           return
//         }

//         try {
//           submitRef.current = true
//           setSubmitting(true)
//           setInActive(true)

//           console.log("📡 Calling onSubmit function...")

//           // Call the actual submit function (this should trigger API call)
//           const result = await onSubmit(values)

//           console.log("✅ Form submitted successfully", result)

//           if (isReset) {
//             console.log("🔄 Resetting form...")
//             resetForm()
//           }
//         } catch (error) {
//           console.error("❌ Form submission error:", error)
//           throw error // Re-throw to let parent handle
//         } finally {
//           setTimeout(() => {
//             submitRef.current = false
//             setInActive(false)
//             setSubmitting(false)
//           }, 1000) // Shorter timeout
//         }
//       },
//       [disabled, onSubmit, isReset, submitting],
//     )

//     return (
//       <Formik
//         initialValues={initialValues}
//         enableReinitialize={true}
//         validationSchema={validSchema}
//         onSubmit={handleSubmit}
//       >
//         {({ values, setFieldValue, errors: formikErrors, touched, submitForm }) => {
//           return (
//             <FormikForm autoComplete="off" className="w-full max-w-full bg-white rounded-xl">
//               <div>
//                 {/* Global Form Error Display */}
//                 {errors && errors?.id && (
//                   <div
//                     className="flex items-center gap-3 p-4 mb-6 text-sm 2xl:text-base font-medium text-red-800 rounded-lg bg-red-50 border-l-4 border-red-500"
//                     role="alert"
//                   >
//                     <svg
//                       className="w-5 h-5 flex-shrink-0"
//                       fill="currentColor"
//                       viewBox="0 0 20 20"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
//                         clipRule="evenodd"
//                       ></path>
//                     </svg>
//                     <div>
//                       <span className="font-medium">Error:</span> {errors?.id}
//                       <ErrorMessage name="id" />
//                     </div>
//                   </div>
//                 )}

//                 {/* Form Fields Grid */}
//                 <div className="grid grid-cols-12 gap-x-6 gap-y-4">
//                   {fields?.map(({ isDisabled = false, ...field }, i) => {
//                     const fieldError =
//                       (formikErrors && formikErrors[field?.name] && touched[field?.name]) ||
//                       (errors && errors[field?.name])
//                     return (
//                       <div className={`${field?.col == 6 ? "col-span-6" : "col-span-12"}`} key={`${field?.name}-${i}`}>
//                         {field?.type === "line" ? (
//                           <div className="col-span-12 my-6">
//                             <div className="flex items-center gap-3">
//                               <div className="h-px flex-1 bg-slate-200"></div>
//                               <h3 className="text-base font-medium text-slate-700">{field?.label}</h3>
//                               <div className="h-px flex-1 bg-slate-200"></div>
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="relative space-y-1">
//                             {/* Label for Form Elements */}
//                             {!["submit", "file", "hidden"].includes(field?.type) && (
//                               <label
//                                 htmlFor={field?.name}
//                                 className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1"
//                               >
//                                 {field?.label}
//                                 {field?.required && <span className="ml-1 text-rose-500">*</span>}
//                               </label>
//                             )}

//                             {/* Field Types Rendering */}
//                             {(() => {
//                               const fieldProps = { ...field }
//                               delete fieldProps.hideLabel

//                               switch (field?.type) {
//                                 // For Select Input
//                                 case "select":
//                                   const field2 = { ...fieldProps }
//                                   delete field2.options
//                                   return (
//                                     <div className="relative">
//                                       <Field
//                                         id={field?.name}
//                                         disabled={disabled || isDisabled}
//                                         className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
//                                           fieldError
//                                             ? "border-rose-500 ring-1 ring-rose-500"
//                                             : "border-slate-300 hover:border-slate-400"
//                                         } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
//                                         {...field2}
//                                         name={field?.name}
//                                         as="select"
//                                       >
//                                         <option value="" disabled>
//                                           Select {field?.label}
//                                         </option>
//                                         {field?.options?.map((option: any, optIndex: any) => (
//                                           <option
//                                             value={option?.id || option?.value}
//                                             key={`${option?.id || option?.value}-${optIndex}`}
//                                           >
//                                             {option?.name || option?.label}
//                                           </option>
//                                         ))}
//                                       </Field>
//                                       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
//                                         <svg
//                                           className="h-5 w-5"
//                                           xmlns="http://www.w3.org/2000/svg"
//                                           viewBox="0 0 20 20"
//                                           fill="currentColor"
//                                           aria-hidden="true"
//                                         >
//                                           <path
//                                             fillRule="evenodd"
//                                             d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//                                             clipRule="evenodd"
//                                           />
//                                         </svg>
//                                       </div>
//                                     </div>
//                                   )

//                                 // For Select2 Input
//                                 case "select2":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       {...fieldProps}
//                                       options={field?.options || []}
//                                       component={Select2}
//                                       error={fieldError}
//                                     />
//                                   )

//                                 // For Select Multiple Input
//                                 case "select-multiple":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       isMulti={true}
//                                       {...fieldProps}
//                                       options={field?.options || []}
//                                       component={SelectMultiple}
//                                       error={fieldError}
//                                     />
//                                   )

//                                 // For Date Input
//                                 case "date":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       type="date"
//                                       name={field?.name}
//                                       className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
//                                         fieldError
//                                           ? "border-rose-500 ring-1 ring-rose-500"
//                                           : "border-slate-300 hover:border-slate-400"
//                                       } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
//                                       {...fieldProps}
//                                     />
//                                   )

//                                 // For DateTime Local Input
//                                 case "datetime-local":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       type="datetime-local"
//                                       name={field?.name}
//                                       className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
//                                         fieldError
//                                           ? "border-rose-500 ring-1 ring-rose-500"
//                                           : "border-slate-300 hover:border-slate-400"
//                                       } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
//                                       {...fieldProps}
//                                     />
//                                   )

//                                 // For Textarea Input
//                                 case "textarea":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
//                                         fieldError
//                                           ? "border-rose-500 ring-1 ring-rose-500"
//                                           : "border-slate-300 hover:border-slate-400"
//                                       } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed resize-none min-h-[120px] text-base`}
//                                       placeholder={field?.label}
//                                       as="textarea"
//                                       {...fieldProps}
//                                     />
//                                   )

//                                 // For Html Editor Input
//                                 case "text-editer":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       name={field?.name}
//                                       component={TextEditer}
//                                       {...fieldProps}
//                                       error={fieldError}
//                                       fieldIndex={i} // Pass index for unique identification
//                                     />
//                                   )

//                                 // For File Input
//                                 case "file":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       name={field?.name}
//                                       component={PictureInput}
//                                       {...fieldProps}
//                                       error={fieldError}
//                                     />
//                                   )

//                                 case "multi-file":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       name={field?.name}
//                                       multiple
//                                       component={PictureInputPreview}
//                                       {...fieldProps}
//                                       error={fieldError}
//                                     />
//                                   )

//                                 case "image-file":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       name={field?.name}
//                                       component={PictureInputPreview}
//                                       {...fieldProps}
//                                       error={fieldError}
//                                     />
//                                   )

//                                 case "check":
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       type="checkbox"
//                                       name={field?.name}
//                                       label={field?.label}
//                                       component={Checkbox}
//                                       error={fieldError}
//                                     />
//                                   )

//                                 // For Read Only Input
//                                 case "readOnly":
//                                   return (
//                                     <div>
//                                       <Field
//                                         id={field?.name}
//                                         disabled={disabled || isDisabled}
//                                         type="text"
//                                         name={field?.name}
//                                         value={field?.value}
//                                         readOnly
//                                         className="appearance-none block w-full px-4 py-2.5 bg-slate-50 text-slate-500 border border-slate-300 rounded-lg focus:outline-none text-base"
//                                       />
//                                       <Field type="hidden" name={field?.name} value={field?.hiddenValue} />
//                                     </div>
//                                   )

//                                 // For Submit Input - FIXED VERSION
//                                 case "submit":
//                                   return (
//                                     <div className="flex justify-end mt-2">
//                                       <button
//                                         type="button" // Changed to button to prevent default form submission
//                                         disabled={disabled || isDisabled || inactive || submitting}
//                                         className="inline-flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-2.5 font-medium text-white bg-sky-600 rounded-lg shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200"
//                                         onClick={async (e) => {
//                                           e.preventDefault()
//                                           e.stopPropagation()
//                                           console.log("🔥 Submit button clicked - calling submitForm")

//                                           try {
//                                             await submitForm() // This will trigger handleSubmit
//                                           } catch (error) {
//                                             console.error("Submit error:", error)
//                                           }
//                                         }}
//                                       >
//                                         {submitting ? (
//                                           <>
//                                             <svg
//                                               className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                                               xmlns="http://www.w3.org/2000/svg"
//                                               fill="none"
//                                               viewBox="0 0 24 24"
//                                             >
//                                               <circle
//                                                 className="opacity-25"
//                                                 cx="12"
//                                                 cy="12"
//                                                 r="10"
//                                                 stroke="currentColor"
//                                                 strokeWidth="4"
//                                               ></circle>
//                                               <path
//                                                 className="opacity-75"
//                                                 fill="currentColor"
//                                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                                               ></path>
//                                             </svg>
//                                             Processing...
//                                           </>
//                                         ) : (
//                                           field?.label
//                                         )}
//                                       </button>
//                                     </div>
//                                   )

//                                 case "features":
//                                   return (
//                                     <div>
//                                       <FeatureManager
//                                         values={values}
//                                         setFieldValue={setFieldValue}
//                                         options={field.options}
//                                         error={fieldError}
//                                       />
//                                     </div>
//                                   )

//                                 // For Rest of Input Fields (Default)
//                                 default:
//                                   return (
//                                     <Field
//                                       id={field?.name}
//                                       disabled={disabled || isDisabled}
//                                       className={`appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border ${
//                                         fieldError
//                                           ? "border-rose-500 ring-1 ring-rose-500"
//                                           : "border-slate-300 hover:border-slate-400"
//                                       } rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-base`}
//                                       placeholder={field?.label}
//                                       {...fieldProps}
//                                       autoComplete="off"
//                                     />
//                                   )
//                               }
//                             })()}

//                             {/* Error Messages */}
//                             {fieldError && (
//                               <div className="mt-1.5 text-sm 2xl:text-base text-rose-600 flex items-center gap-1.5">
//                                 <svg
//                                   className="w-4 h-4 flex-shrink-0"
//                                   fill="currentColor"
//                                   viewBox="0 0 20 20"
//                                   xmlns="http://www.w3.org/2000/svg"
//                                 >
//                                   <path
//                                     fillRule="evenodd"
//                                     d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
//                                     clipRule="evenodd"
//                                   ></path>
//                                 </svg>
//                                 {errors && errors[field?.name]}
//                                 <ErrorMessage name={field?.name} />
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>
//             </FormikForm>
//           )
//         }}
//       </Formik>
//     )
//   },
// )

// // COMPLETELY FIXED Jodit Editor with comprehensive symbols and perfect focus management
// const TextEditer = memo(
//   ({
//     form,
//     field,
//     disabled = false,
//     height = "400",
//     error = false,
//     placeholder = "Start typing...",
//     fieldIndex = 0,
//   }: {
//     form: any
//     field: any
//     disabled?: boolean
//     height?: string
//     error?: boolean
//     placeholder?: string
//     fieldIndex?: number
//   }) => {
//     const editorRef = useRef<any>(null)
//     const containerRef = useRef<any>(null)
//     const [content, setContent] = useState(field?.value || "")
//     const [isMounted, setIsMounted] = useState(false)
//     const [isEditorReady, setIsEditorReady] = useState(false)
//     const [uploadProgress, setUploadProgress] = useState(0)
//     const [isUploading, setIsUploading] = useState(false)
//     const [uploadError, setUploadError] = useState("")
//     const focusTimeoutRef = useRef<any>(null)
//     const lastFocusTime = useRef<number>(0)
//     const uniqueId = `jodit-editor-${field?.name}-${fieldIndex}-${Math.random().toString(36).substr(2, 9)}`

//     // Debounced content update
//     const debouncedUpdate = useMemo(
//       () =>
//         debounce((newContent: string) => {
//           if (newContent !== content && form && form.setFieldValue) {
//             setContent(newContent)
//             form.setFieldValue(field?.name, newContent)
//           }
//         }, 300),
//       [form, field?.name, content],
//     )

//     // Initialize content and mount state
//     useEffect(() => {
//       setIsMounted(true)
//       if (field?.value !== content) {
//         setContent(field?.value || "")
//       }
//     }, [field?.value])

//     // Cleanup on unmount
//     useEffect(() => {
//       return () => {
//         debouncedUpdate.cancel()
//         if (focusTimeoutRef.current) {
//           clearTimeout(focusTimeoutRef.current)
//         }
//       }
//     }, [debouncedUpdate])

//     // Intelligent focus management - only focus when needed
//     const handleFocus = useCallback(() => {
//       const now = Date.now()
//       // Prevent rapid focus calls
//       if (now - lastFocusTime.current < 100) return

//       lastFocusTime.current = now

//       if (focusTimeoutRef.current) {
//         clearTimeout(focusTimeoutRef.current)
//       }

//       focusTimeoutRef.current = setTimeout(() => {
//         try {
//           if (editorRef.current && editorRef.current.editor && isEditorReady) {
//             // Only focus if no other element is currently focused or if clicking in editor area
//             const activeElement = document.activeElement
//             const isEditorFocused =
//               activeElement === editorRef.current.editor || editorRef.current.editor.contains(activeElement)

//             if (!isEditorFocused && containerRef.current && containerRef.current.contains(activeElement)) {
//               editorRef.current.editor.focus()
//             }
//           }
//         } catch (error) {
//           console.warn("Focus error:", error)
//         }
//       }, 50)
//     }, [isEditorReady])

//     // Custom upload function with progress tracking
//     const handleImageUpload = useCallback(async (file: File): Promise<string> => {
//       return new Promise((resolve, reject) => {
//         setIsUploading(true)
//         setUploadProgress(0)
//         setUploadError("")

//         const formData = new FormData()
//         formData.append("file", file)

//         const xhr = new XMLHttpRequest()

//         // Track upload progress
//         xhr.upload.addEventListener("progress", (e) => {
//           if (e.lengthComputable) {
//             const percentComplete = Math.round((e.loaded / e.total) * 100)
//             setUploadProgress(percentComplete)
//           }
//         })

//         xhr.addEventListener("load", () => {
//           setIsUploading(false)
//           setUploadProgress(0)

//           if (xhr.status === 200) {
//             try {
//               const response = JSON.parse(xhr.responseText)
//               if (response.error) {
//                 setUploadError(response.msg || "Upload failed")
//                 reject(new Error(response.msg || "Upload failed"))
//               } else {
//                 resolve(response.data)
//               }
//             } catch (error) {
//               setUploadError("Invalid server response")
//               reject(new Error("Invalid server response"))
//             }
//           } else {
//             setUploadError(`Upload failed with status: ${xhr.status}`)
//             reject(new Error(`Upload failed with status: ${xhr.status}`))
//           }
//         })

//         xhr.addEventListener("error", () => {
//           setIsUploading(false)
//           setUploadProgress(0)
//           setUploadError("Network error during upload")
//           reject(new Error("Network error during upload"))
//         })

//         xhr.addEventListener("timeout", () => {
//           setIsUploading(false)
//           setUploadProgress(0)
//           setUploadError("Upload timeout")
//           reject(new Error("Upload timeout"))
//         })

//         xhr.open("POST", (import.meta.env?.VITE_API_BASE_URL || "") + "upload-editor-image")
//         xhr.setRequestHeader("x-api-key", import.meta.env?.VITE_LICENCE || "")
//         xhr.timeout = 30000 // 30 second timeout
//         xhr.send(formData)
//       })
//     }, [])

//     // Add custom file drop handler
//     const handleFileDrop = useCallback(
//       (editor: any) => {
//         if (!editor.editor) return

//         editor.editor.addEventListener("drop", async (e: DragEvent) => {
//           e.preventDefault()

//           const files = e.dataTransfer?.files
//           if (!files || files.length === 0) return

//           const file = files[0]
//           if (!file.type.startsWith("image/")) {
//             setUploadError("Please select an image file")
//             return
//           }

//           try {
//             setIsUploading(true)
//             setUploadProgress(0)
//             setUploadError("")

//             const imageUrl = await handleImageUpload(file)

//             // Insert the image at drop position
//             if (editor.selection) {
//               editor.selection.insertImage(
//                 imageUrl,
//                 {
//                   alt: "Uploaded image",
//                   style: "max-width: 100%; height: auto;",
//                 },
//                 250,
//               )

//               // Update content
//               setTimeout(() => {
//                 if (editorRef.current && typeof editorRef.current.value !== "undefined") {
//                   const newContent = editorRef.current.value
//                   debouncedUpdate(newContent)
//                 }
//               }, 100)
//             }
//           } catch (error) {
//             console.error("Drag and drop upload error:", error)
//             setUploadError(error.message || "Upload failed")
//           }
//         })

//         editor.editor.addEventListener("dragover", (e: DragEvent) => {
//           e.preventDefault()
//         })
//       },
//       [handleImageUpload, debouncedUpdate],
//     )

//     // Comprehensive Math and Physics Symbols (keeping the same as before)
//     const mathPhysicsSymbols = [
//       // Greek Letters (Uppercase)
//       "Α",
//       "Β",
//       "Γ",
//       "Δ",
//       "Ε",
//       "Ζ",
//       "Η",
//       "Θ",
//       "Ι",
//       "Κ",
//       "Λ",
//       "Μ",
//       "Ν",
//       "Ξ",
//       "Ο",
//       "Π",
//       "Ρ",
//       "Σ",
//       "Τ",
//       "Υ",
//       "Φ",
//       "Χ",
//       "Ψ",
//       "Ω",
//       // Greek Letters (Lowercase)
//       "α",
//       "β",
//       "γ",
//       "δ",
//       "ε",
//       "ζ",
//       "η",
//       "θ",
//       "ι",
//       "κ",
//       "λ",
//       "μ",
//       "ν",
//       "ξ",
//       "ο",
//       "π",
//       "ρ",
//       "σ",
//       "τ",
//       "υ",
//       "φ",
//       "χ",
//       "ψ",
//       "ω",
//       // Mathematical Operators
//       "∑",
//       "∏",
//       "∫",
//       "∮",
//       "∂",
//       "∇",
//       "∆",
//       "∞",
//       "∝",
//       "∴",
//       "∵",
//       "∀",
//       "∃",
//       "∄",
//       "∈",
//       "∉",
//       "∋",
//       "∌",
//       "⊂",
//       "⊃",
//       "⊆",
//       "⊇",
//       "∪",
//       "∩",
//       // Comparison and Equality
//       "≠",
//       "≈",
//       "≡",
//       "≤",
//       "≥",
//       "≪",
//       "≫",
//       "≺",
//       "≻",
//       "≼",
//       "≽",
//       "≾",
//       "≿",
//       "⊀",
//       "⊁",
//       "⊄",
//       "⊅",
//       "⊈",
//       "⊉",
//       "⊊",
//       "⊋",
//       // Arithmetic
//       "±",
//       "∓",
//       "×",
//       "÷",
//       "⋅",
//       "∘",
//       "√",
//       "∛",
//       "∜",
//       "∝",
//       "∞",
//       "∑",
//       "∏",
//       // Fractions and Powers
//       "½",
//       "⅓",
//       "⅔",
//       "¼",
//       "¾",
//       "⅕",
//       "⅖",
//       "⅗",
//       "⅘",
//       "⅙",
//       "⅚",
//       "⅛",
//       "⅜",
//       "⅝",
//       "⅞",
//       "¹",
//       "²",
//       "³",
//       "⁴",
//       "⁵",
//       "⁶",
//       "⁷",
//       "⁸",
//       "⁹",
//       "⁰",
//       // Subscripts
//       "₀",
//       "₁",
//       "₂",
//       "₃",
//       "₄",
//       "₅",
//       "₆",
//       "₇",
//       "₈",
//       "₉",
//       "₊",
//       "₋",
//       "₌",
//       "₍",
//       "₎",
//       "ₐ",
//       "ₑ",
//       "ₕ",
//       "ᵢ",
//       "ⱼ",
//       "ₖ",
//       "ₗ",
//       "ₘ",
//       "ₙ",
//       "ₒ",
//       "ₚ",
//       "ᵣ",
//       "ₛ",
//       "ₜ",
//       "ᵤ",
//       "ᵥ",
//       "ₓ",
//       // Physics Symbols
//       "ℏ",
//       "ℎ",
//       "ℓ",
//       "℮",
//       "ℯ",
//       "ℰ",
//       "ℱ",
//       "ℳ",
//       "ℴ",
//       "ℵ",
//       "ℶ",
//       "ℷ",
//       "ℸ",
//       "⅁",
//       "⅂",
//       "⅃",
//       "⅄",
//       // Arrows
//       "←",
//       "→",
//       "↑",
//       "↓",
//       "↔",
//       "↕",
//       "↖",
//       "↗",
//       "↘",
//       "↙",
//       "⇐",
//       "⇒",
//       "⇑",
//       "⇓",
//       "⇔",
//       "⇕",
//       // Geometric Shapes
//       "○",
//       "●",
//       "□",
//       "■",
//       "△",
//       "▲",
//       "▼",
//       "▽",
//       "◆",
//       "◇",
//       "◊",
//       // Logic Symbols
//       "∧",
//       "∨",
//       "¬",
//       "⊕",
//       "⊗",
//       "⊙",
//       "⊥",
//       "⊤",
//       // Currency and Units
//       "°",
//       "′",
//       "″",
//       "‴",
//       "℃",
//       "℉",
//       "Ω",
//       "€",
//       "£",
//       "¥",
//       "¢",
//       "₹",
//       // Miscellaneous
//       "©",
//       "®",
//       "™",
//       "§",
//       "¶",
//       "†",
//       "‡",
//       "•",
//       "‰",
//       "‱",
//     ]

//     // Enhanced Jodit configuration with better focus management and upload progress
//     const config = useMemo(
//       () => ({
//         readonly: disabled,
//         height: Number.parseInt(height) || 400,
//         placeholder,
//         language: "en",
//         theme: "default",
//         saveModeInCookie: false,
//         spellcheck: true,
//         editorCssClass: "jodit-editor-enhanced",
//         namespace: uniqueId,

//         // Better focus management
//         autofocus: false,
//         tabIndex: 1,

//         // Toolbar configuration
//         buttons: [
//           "source",
//           "|",
//           "bold",
//           "italic",
//           "underline",
//           "strikethrough",
//           "|",
//           "superscript",
//           "subscript",
//           "|",
//           "ul",
//           "ol",
//           "|",
//           "outdent",
//           "indent",
//           "|",
//           "font",
//           "fontsize",
//           "brush",
//           "paragraph",
//           "|",
//           "image",
//           "file",
//           "video",
//           "table",
//           "link",
//           "|",
//           "align",
//           "undo",
//           "redo",
//           "|",
//           "hr",
//           "eraser",
//           "copyformat",
//           "|",
//           "symbol",
//           "fullsize",
//         ],

//         buttonsMD: [
//           "source",
//           "|",
//           "bold",
//           "italic",
//           "|",
//           "ul",
//           "ol",
//           "|",
//           "image",
//           "link",
//           "|",
//           "align",
//           "undo",
//           "redo",
//           "|",
//           "symbol",
//         ],

//         buttonsXS: ["bold", "italic", "|", "ul", "ol", "|", "image", "link", "symbol"],

//         // Enhanced options
//         toolbarAdaptive: true,
//         toolbarSticky: true,
//         showCharsCounter: false,
//         showWordsCounter: false,
//         showXPathInStatusbar: false,

//         // Paste configuration
//         askBeforePasteHTML: false,
//         askBeforePasteFromWord: false,
//         defaultActionOnPaste: "insert_clear_html",

//         // Image and file handling
//         enableDragAndDropFileToEditor: true,

//         // Custom controls
//         controls: {
//           symbol: {
//             popup: (editor: any, current: any, self: any, close: any) => {
//               const div = editor.create.div("jodit-symbols-popup")
//               div.style.cssText = `
//                 display: grid;
//                 grid-template-columns: repeat(12, 1fr);
//                 gap: 3px;
//                 padding: 15px;
//                 max-width: 600px;
//                 max-height: 400px;
//                 overflow-y: auto;
//                 background: white;
//                 border: 1px solid #ccc;
//                 border-radius: 8px;
//                 box-shadow: 0 4px 20px rgba(0,0,0,0.15);
//                 z-index: 999999;
//               `

//               mathPhysicsSymbols.forEach((symbol) => {
//                 const button = editor.create.element("button")
//                 button.textContent = symbol
//                 button.title = symbol
//                 button.style.cssText = `
//                   padding: 8px 4px;
//                   border: 1px solid #ddd;
//                   background: white;
//                   cursor: pointer;
//                   border-radius: 4px;
//                   font-size: 18px;
//                   font-family: 'Times New Roman', serif;
//                   transition: all 0.2s;
//                   display: flex;
//                   align-items: center;
//                   justify-content: center;
//                   min-height: 35px;
//                 `

//                 button.addEventListener("mouseenter", () => {
//                   button.style.backgroundColor = "#e3f2fd"
//                   button.style.borderColor = "#2196f3"
//                   button.style.transform = "scale(1.1)"
//                 })

//                 button.addEventListener("mouseleave", () => {
//                   button.style.backgroundColor = "white"
//                   button.style.borderColor = "#ddd"
//                   button.style.transform = "scale(1)"
//                 })

//                 button.addEventListener("click", (e) => {
//                   e.preventDefault()
//                   e.stopPropagation()

//                   try {
//                     if (editor.selection) {
//                       editor.selection.insertHTML(symbol)
//                     } else {
//                       editor.value += symbol
//                     }
//                     close()
//                   } catch (error) {
//                     console.error("Symbol insertion error:", error)
//                   }
//                 })

//                 div.appendChild(button)
//               })

//               return div
//             },
//             tooltip: "Insert Math/Physics Symbol",
//             icon: "symbol",
//           },
//         },

//         // Custom uploader with progress tracking - FIXED VERSION
//         uploader: {
//           insertImageAsBase64URI: false,
//           url: (import.meta.env?.VITE_API_BASE_URL || "") + "upload-editor-image",
//           format: "json",
//           pathVariableName: "path",
//           filesVariableName: () => "file",
//           headers: {
//             "x-api-key": import.meta.env?.VITE_LICENCE || "",
//           },

//           // Fix the response processing
//           isSuccess: (resp: any) => {
//             console.log("📤 Upload response:", resp)
//             return !resp.error && resp.data
//           },

//           getMsg: (resp: any) => {
//             return resp.msg || "Upload completed"
//           },

//           // FIXED: Properly process the server response
//           process: (resp: any) => {
//             console.log("🔄 Processing upload response:", resp)

//             setIsUploading(false)
//             setUploadProgress(0)

//             if (resp.error) {
//               setUploadError(resp.msg || "Upload failed")
//               return {
//                 files: [],
//                 path: "",
//                 baseurl: "",
//                 error: 1,
//                 msg: resp.msg || "Upload failed",
//               }
//             }

//             // Return the correct format for Jodit
//             return {
//               files: [resp.data], // The URL from server response
//               path: "",
//               baseurl: "",
//               error: 0,
//               msg: resp.msg || "Upload successful",
//             }
//           },

//           // FIXED: Custom success handler
//           defaultHandlerSuccess: function (data: any) {
//             console.log("✅ Upload success handler called with:", data)

//             try {
//               const files = data.files || []
//               if (files.length > 0 && this.selection) {
//                 const imageUrl = files[0]
//                 console.log("🖼️ Inserting image:", imageUrl)

//                 // Insert the image with proper attributes
//                 this.selection.insertImage(
//                   imageUrl,
//                   {
//                     alt: "Uploaded image",
//                     style: "max-width: 100%; height: auto;",
//                   },
//                   250,
//                 )

//                 // Update form content
//                 setTimeout(() => {
//                   if (isEditorReady && editorRef?.current && typeof editorRef?.current?.value !== "undefined") {
//                     const newContent = editorRef?.current?.value
//                     console.log("📝 Updating content after image insert")
//                     debouncedUpdate(newContent)
//                   }
//                 }, 100)
//               } else {
//                 console.error("❌ No files in upload response or no selection")
//               }
//             } catch (error) {
//               console.error("❌ Upload success handler error:", error)
//               setUploadError("Failed to insert image into editor")
//             }
//           },

//           // FIXED: Error handler
//           defaultHandlerError: function (resp: any) {
//             console.error("❌ Upload error handler called with:", resp)

//             try {
//               const errorMsg = resp.msg || resp.message || "Upload failed"
//               setUploadError(errorMsg)

//               if (this.events && this.events.fire) {
//                 this.events.fire("errorPopap", errorMsg)
//               }
//             } catch (error) {
//               console.error("Upload error handler error:", error)
//             }
//           },

//           withCredentials: false,
//         },

//         // Improved event handling
//         events: {
//           afterInit: (editor: any) => {
//             try {
//               setIsEditorReady(true)
//               if (editor && content) {
//                 editor.value = content
//               }

//               // Setup file drop handler
//               handleFileDrop(editor)

//               // Better focus management - less aggressive
//               if (editor.editor) {
//                 // Handle clicks in editor
//                 editor.editor.addEventListener("click", () => {
//                   // Natural focus on click
//                   setTimeout(() => {
//                     if (editor.editor && !editor.editor.contains(document.activeElement)) {
//                       editor.editor.focus()
//                     }
//                   }, 10)
//                 })

//                 // Handle keyboard navigation
//                 editor.editor.addEventListener("keydown", (e: KeyboardEvent) => {
//                   // Don't interfere with normal typing
//                   if (e.key === "Tab") {
//                     // Allow tab navigation
//                     return
//                   }
//                 })

//                 // Handle paste events
//                 editor.editor.addEventListener("paste", () => {
//                   setTimeout(() => {
//                     if (isEditorReady && editorRef.current && typeof editorRef.current.value !== "undefined") {
//                       const newContent = editorRef.current.value
//                       debouncedUpdate(newContent)
//                     }
//                   }, 100)
//                 })
//               }

//               console.log("✅ Jodit Editor initialized successfully")
//             } catch (error) {
//               console.error("Editor afterInit error:", error)
//             }
//           },

//           change: (newContent: string) => {
//             try {
//               if (isEditorReady) {
//                 debouncedUpdate(newContent)
//               }
//             } catch (error) {
//               console.error("Editor change error:", error)
//             }
//           },

//           focus: () => {
//             console.log("🎯 Editor focused")
//           },

//           blur: () => {
//             // Natural blur handling - don't force focus on blur
//             console.log("👋 Editor blurred")
//           },

//           beforeDestruct: () => {
//             try {
//               setIsEditorReady(false)
//               debouncedUpdate.cancel()
//               if (focusTimeoutRef.current) {
//                 clearTimeout(focusTimeoutRef.current)
//               }
//             } catch (error) {
//               console.error("Editor beforeDestruct error:", error)
//             }
//           },
//         },
//       }),
//       [
//         disabled,
//         height,
//         placeholder,
//         debouncedUpdate,
//         content,
//         isEditorReady,
//         uniqueId,
//         handleImageUpload,
//         handleFileDrop,
//       ],
//     )

//     // Prevent rendering on server side
//     if (!isMounted) {
//       return (
//         <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
//           <div className="text-gray-500">Loading editor...</div>
//         </div>
//       )
//     }

//     return (
//       <div
//         ref={containerRef}
//         className={`jodit-text-editor-container rounded-lg overflow-hidden ${
//           error ? "ring-2 ring-rose-500" : "ring-1 ring-gray-200"
//         }`}
//         onClick={handleFocus}
//       >
//         {/* Upload Progress Indicator */}
//         {isUploading && (
//           <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <svg
//                   className="h-5 w-5 text-blue-400 animate-spin"
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                   ></path>
//                 </svg>
//               </div>
//               <div className="ml-3 flex-1">
//                 <p className="text-sm text-blue-700">Uploading image... {uploadProgress}%</p>
//                 <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
//                   <div
//                     className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${uploadProgress}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Upload Error Display */}
//         {uploadError && (
//           <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
//             <div className="flex">
//               <div className="flex-shrink-0">
//                 <svg
//                   className="h-5 w-5 text-red-400"
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 20 20"
//                   fill="currentColor"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm text-red-700">Upload failed: {uploadError}</p>
//                 <button
//                   onClick={() => setUploadError("")}
//                   className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
//                 >
//                   Dismiss
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         <JoditErrorBoundary>
//           <JoditEditor
//             ref={editorRef}
//             value={content}
//             config={config}
//             tabIndex={1}
//             onBlur={() => {
//               // Natural blur handling - don't force focus
//             }}
//             onChange={(newContent) => {
//               try {
//                 if (newContent !== content && isEditorReady) {
//                   debouncedUpdate(newContent)
//                 }
//               } catch (error) {
//                 console.error("Editor onChange error:", error)
//               }
//             }}
//           />
//         </JoditErrorBoundary>
//       </div>
//     )
//   },
// )

// // Rest of the components remain the same but with proper display names...
// const PictureInput = memo(
//   ({
//     form,
//     field,
//     multiple,
//     label,
//     disabled,
//     error,
//   }: {
//     form: any
//     field: any
//     multiple?: boolean
//     label?: string
//     disabled?: boolean
//     error?: boolean
//   }) => {
//     const [url, setUrl] = useState<string | null>(null)
//     const [urls, setUrls] = useState<string[]>([])
//     const [fileSelected, setFileSelected] = useState(false)

//     useEffect(() => {
//       const data = field?.value
//       if (data != null && Array.isArray(data)) {
//         const validUrls = data.filter((item) => item && typeof item === "string" && item.trim() !== "")
//         setUrls(validUrls)
//       } else if (data != null && typeof data === "string" && data.trim() !== "") {
//         setUrl(data)
//       } else {
//         setUrl(null)
//         setUrls([])
//       }
//     }, [field?.value])

//     return (
//       <>
//         <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">
//           {label}
//           {url && (
//             <a
//               className="ml-2 text-xs font-normal text-sky-600 hover:text-sky-800 transition-colors duration-200"
//               target="_blank"
//               href={url}
//               rel="noopener noreferrer"
//             >
//               View Current Attachment
//             </a>
//           )}
//         </label>

//         <div className="relative group">
//           <div
//             className={`flex flex-col rounded-lg border-2 border-dashed ${
//               error
//                 ? "border-rose-400 bg-rose-50"
//                 : fileSelected
//                   ? "border-sky-400 bg-sky-50"
//                   : "border-slate-300 bg-slate-50"
//             } transition-all duration-200 hover:border-sky-400 hover:bg-sky-50 focus-within:border-sky-500 focus-within:bg-sky-50`}
//           >
//             <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
//               <svg
//                 className={`mb-3 h-10 w-10 ${
//                   error ? "text-rose-400" : fileSelected ? "text-sky-500" : "text-slate-400"
//                 }`}
//                 stroke="currentColor"
//                 fill="none"
//                 viewBox="0 0 48 48"
//                 aria-hidden="true"
//               >
//                 <path
//                   d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//               <div
//                 className={`text-sm 2xl:text-base ${
//                   error ? "text-rose-500" : fileSelected ? "text-sky-600" : "text-slate-600"
//                 }`}
//               >
//                 <label
//                   htmlFor={`file-upload-${field.name}`}
//                   className="relative cursor-pointer rounded-md font-medium text-sky-600 hover:text-sky-700 focus-within:outline-none"
//                 >
//                   <span>Upload a file</span>
//                   <input
//                     id={`file-upload-${field.name}`}
//                     name={field?.name}
//                     type="file"
//                     multiple={multiple}
//                     disabled={disabled}
//                     className="sr-only"
//                     onChange={(e: any) => {
//                       if (e.target.files && e.target.files.length > 0) {
//                         setFileSelected(true)
//                         multiple
//                           ? form.setFieldValue(field?.name, e.target.files)
//                           : form.setFieldValue(field?.name, e.target.files[0])
//                       } else {
//                         setFileSelected(false)
//                       }
//                     }}
//                   />
//                 </label>
//                 <p className="pl-1">or drag and drop</p>
//               </div>
//               <p className={`text-xs ${error ? "text-rose-500" : "text-slate-500"}`}>
//                 {fileSelected ? "File selected" : "PDF, PNG, JPG, GIF up to 10MB"}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Previous Attachments Display */}
//         {urls.length > 0 && (
//           <div className="mt-3">
//             <p className="text-sm 2xl:text-base font-medium text-slate-700 mb-2">Previous Attachments:</p>
//             <div className="flex flex-wrap gap-2">
//               {urls.map((item, i) => (
//                 <a
//                   key={`attachment-${i}`}
//                   href={item}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors duration-200"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-4 w-4"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
//                     />
//                   </svg>
//                   Attachment {i + 1}
//                 </a>
//               ))}
//             </div>
//           </div>
//         )}
//       </>
//     )
//   },
// )

// const PictureInputPreview = memo(
//   ({
//     form,
//     field,
//     multiple = false,
//     label,
//     disabled,
//     error,
//   }: {
//     form: any
//     field: any
//     multiple?: boolean
//     label?: string
//     disabled?: boolean
//     error?: boolean
//   }) => {
//     const [previews, setPreviews] = useState<string[]>([])
//     const [fileSelected, setFileSelected] = useState(false)
//     const objectUrlsRef = useRef<string[]>([])

// console.log("OK INSIDE PREVIEW", objectUrlsRef)

//     const cleanupObjectUrls = useCallback(() => {
//       objectUrlsRef.current.forEach((url) => {
//         if (url.startsWith("blob:")) {
//           URL.revokeObjectURL(url)
//         }
//       })
//       objectUrlsRef.current = []
//     }, [])

//     useEffect(() => {
//       if (field?.value) {
//         cleanupObjectUrls()

//         if (Array.isArray(field?.value)) {
//           const newPreviews = field.value
//             .map((file: any) => {
//               if (typeof file === "string" && file.trim() !== "") {
//                 return file
//               } else if (file instanceof File) {
//                 const objectUrl = URL.createObjectURL(file)
//                 objectUrlsRef.current.push(objectUrl)
//                 return objectUrl
//               }
//               return null
//             })
//             .filter(Boolean)

//           setPreviews(newPreviews)
//           setFileSelected(field.value.length > 0)
//         } else if (typeof field?.value === "string" && field.value.trim() !== "") {
//           setPreviews([field.value])
//           setFileSelected(true)
//         } else if (field?.value instanceof File) {
//           const objectUrl = URL.createObjectURL(field.value)
//           objectUrlsRef.current.push(objectUrl)
//           setPreviews([objectUrl])
//           setFileSelected(true)
//         }
//       } else {
//         cleanupObjectUrls()
//         setPreviews([])
//         setFileSelected(false)
//       }
//     }, [field?.value, cleanupObjectUrls])

//     useEffect(() => {
//       return () => {
//         cleanupObjectUrls()
//       }
//     }, [cleanupObjectUrls])

//     const handleFileChange = useCallback(
//       (e: any) => {
//         const files = Array.from(e.target.files)
//         if (files.length > 0) {
//           setFileSelected(true)
//           if (multiple) {
//             form.setFieldValue(field?.name, files)
//           } else {
//             form.setFieldValue(field?.name, files[0])
//           }
//         } else {
//           setFileSelected(false)
//         }
//       },
//       [form, field?.name, multiple],
//     )

//     return (
//       <>
//         <div className="relative group">
//           <div
//             className={`flex flex-col rounded-lg border-2 border-dashed ${
//               error
//                 ? "border-rose-400 bg-rose-50"
//                 : fileSelected
//                   ? "border-sky-400 bg-sky-50"
//                   : "border-slate-300 bg-slate-50"
//             } transition-all duration-200 hover:border-sky-400 hover:bg-sky-50 focus-within:border-sky-500 focus-within:bg-sky-50`}
//           >
//             <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
//               <svg
//                 className={`mb-3 h-10 w-10 ${
//                   error ? "text-rose-400" : fileSelected ? "text-sky-500" : "text-slate-400"
//                 }`}
//                 stroke="currentColor"
//                 fill="none"
//                 viewBox="0 0 48 48"
//                 aria-hidden="true"
//               >
//                 <path
//                   d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//               <div
//                 className={`text-sm 2xl:text-base ${
//                   error ? "text-rose-500" : fileSelected ? "text-sky-600" : "text-slate-600"
//                 }`}
//               >
//                 <label
//                   htmlFor={`file-upload-multi-${field.name}`}
//                   className="relative cursor-pointer rounded-md font-medium text-sky-600 hover:text-sky-700 focus-within:outline-none"
//                 >
//                   <span>Upload images</span>
//                   <input
//                     id={`file-upload-multi-${field.name}`}
//                     name={field?.name}
//                     type="file"
//                     multiple={multiple}
//                     disabled={disabled}
//                     accept="image/*"
//                     className="sr-only"
//                     onChange={handleFileChange}
//                   />
//                 </label>
//                 <p className="pl-1">or drag and drop</p>
//               </div>
//               <p className={`text-xs ${error ? "text-rose-500" : "text-slate-500"}`}>
//                 {fileSelected
//                   ? `${previews.length} image${previews.length !== 1 ? "s" : ""} selected`
//                   : "PNG, JPG, GIF up to 10MB"}
//               </p>
//             </div>
//           </div>
//         </div>

//         {previews.length > 0 && (
//           <div className="mt-4">
//             <p className="text-sm 2xl:text-base font-medium text-slate-700 mb-2">Image Preview:</p>
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
//               {previews.map((src: string, index: number) => (
//                 <div
//                   key={`preview-${index}`}
//                   className="relative group overflow-hidden rounded-lg shadow-sm border border-slate-200"
//                 >
//                   {src ? (
//                     <img
//                       src={src || "/placeholder.svg"}
//                       alt={`Preview ${index + 1}`}
//                       className="h-20 w-full object-cover transition-transform duration-200 group-hover:scale-105"
//                       onError={(e) => {
//                         const target = e.target as HTMLImageElement
//                         target.style.display = "none"
//                       }}
//                     />
//                   ) : (
//                     <div className="h-20 w-full bg-gray-200 flex items-center justify-center">
//                       <span className="text-gray-400 text-xs">No preview</span>
//                     </div>
//                   )}
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center p-2">
//                     <span className="text-white text-xs font-medium">{`Image ${index + 1}`}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </>
//     )
//   },
// )

// const Checkbox = memo(
//   ({
//     form,
//     field,
//     disabled = false,
//     size = "lg",
//     onChangeCustom = () => null,
//     className = "",
//     checked = false,
//     error = false,
//   }: {
//     form: any
//     field: any
//     disabled?: boolean
//     size?: string
//     onChangeCustom?: (value: number) => void
//     className?: string
//     checked?: boolean
//     error?: boolean
//   }) => {
//     const [isChecked, setIsChecked] = useState(checked || field.value === 1 || field.value === true)

//     useEffect(() => {
//       setIsChecked(field.value === 1 || field.value === true || checked)
//     }, [field.value, checked])

//     const handleChange = useCallback(
//       (e: React.ChangeEvent<HTMLInputElement>) => {
//         const newValue = e.target.checked
//         setIsChecked(newValue)
//         onChangeCustom(newValue ? 1 : 0)
//         form.setFieldValue(field?.name, newValue)
//       },
//       [form, field?.name, onChangeCustom],
//     )

//     const sizeClasses = {
//       sm: { wrapper: "w-8 h-4", toggle: "after:h-3 after:w-3 after:left-0.5" },
//       md: { wrapper: "w-10 h-5", toggle: "after:h-4 after:w-4 after:left-0.5" },
//       lg: { wrapper: "w-12 h-6", toggle: "after:h-5 after:w-5 after:left-0.5" },
//     }

//     return (
//       <div className={`flex items-center ${className}`}>
//         <label className="relative inline-flex items-center cursor-pointer">
//           <input
//             id={field?.name}
//             type="checkbox"
//             checked={isChecked}
//             disabled={disabled}
//             className="sr-only peer"
//             onChange={handleChange}
//           />
//           <div
//             className={`
//           ${sizeClasses[size as keyof typeof sizeClasses]?.wrapper || sizeClasses.md.wrapper}
//           ${error ? "bg-rose-100 peer-checked:bg-rose-500" : "bg-slate-200 peer-checked:bg-sky-500"}
//           rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300
//           dark:peer-focus:ring-sky-800 peer-checked:after:translate-x-full
//           rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px]
//           after:bg-white after:border-slate-300 after:border after:rounded-full
//           ${sizeClasses[size as keyof typeof sizeClasses]?.toggle || sizeClasses.md.toggle}
//           after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
//         `}
//           ></div>
//         </label>
//         <span className="sr-only">{field?.label || "Toggle"}</span>
//       </div>
//     )
//   },
// )

// const Select2 = memo(
//   ({
//     form,
//     field,
//     options = [],
//     label = "",
//     menuPortalTarget = null,
//     className = "",
//     classNamePrefix = "react-select",
//     disabled = false,
//     onChange = () => null,
//     onChangeCustom = () => null,
//     onBlur = () => null,
//     onChangeUpdateToNull = false,
//     error = false,
//   }: {
//     form: any
//     field: any
//     options: any[]
//     label: string
//     menuPortalTarget: any
//     className: string
//     classNamePrefix: string
//     disabled: boolean
//     onChange: (value: any) => void
//     onChangeCustom: (value: any) => void
//     onBlur: (value: any) => void
//     onChangeUpdateToNull: boolean
//     error: boolean
//   }) => {
//     const [selectedValue, setSelectedValue] = useState<any>(null)

//     useEffect(() => {
//       if (!options.length) return

//       const fieldValue = field?.value
//       if (!fieldValue) {
//         setSelectedValue(null)
//         return
//       }

//       let foundOption = null

//       if (typeof fieldValue === "object" && fieldValue !== null) {
//         const id = fieldValue._id || fieldValue.id
//         foundOption = options.find((opt: any) => [opt.id, opt._id, opt.value].includes(id))
//       } else {
//         foundOption = options.find((opt: any) => [opt.id, opt._id, opt.value].includes(fieldValue))
//       }

//       setSelectedValue(foundOption || (onChangeUpdateToNull ? null : fieldValue))
//     }, [field?.value, options, onChangeUpdateToNull])

//     const handleSelectChange = useCallback(
//       (value: any) => {
//         setSelectedValue(value)
//         const selectedId = value?.id || value?._id || value?.value || ""
//         form.setFieldValue(field?.name, selectedId)
//         onChange(value)
//         onChangeCustom(value)
//       },
//       [form, field?.name, onChange, onChangeCustom],
//     )

//     const customStyles = useMemo(
//       () => ({
//         control: (provided: any, state: any) => ({
//           ...provided,
//           borderColor: error ? "#F43F5E" : state.isFocused ? "#0EA5E9" : "#D1D5DB",
//           boxShadow: error ? "0 0 0 1px #F43F5E" : state.isFocused ? "0 0 0 1px #0EA5E9" : "none",
//           "&:hover": {
//             borderColor: error ? "#F43F5E" : state.isFocused ? "#0EA5E9" : "#9CA3AF",
//           },
//           borderRadius: "0.5rem",
//           backgroundColor: disabled ? "#F3F4F6" : "white",
//           padding: "2px 4px",
//           minHeight: "42px",
//         }),
//         option: (provided: any, state: any) => ({
//           ...provided,
//           backgroundColor: state.isSelected ? "#0EA5E9" : state.isFocused ? "#E0F2FE" : null,
//           color: state.isSelected ? "white" : "#111827",
//           "&:active": { backgroundColor: "#38BDF8" },
//           padding: "10px 12px",
//         }),
//         menu: (provided: any) => ({
//           ...provided,
//           borderRadius: "0.5rem",
//           boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
//           zIndex: 9999,
//           overflow: "hidden",
//         }),
//         placeholder: (provided: any) => ({ ...provided, color: "#9CA3AF" }),
//         indicatorSeparator: (provided: any) => ({ ...provided, display: "none" }),
//         dropdownIndicator: (provided: any) => ({ ...provided, color: "#6B7280" }),
//         singleValue: (provided: any) => ({ ...provided, color: disabled ? "#9CA3AF" : "#111827" }),
//       }),
//       [error, disabled],
//     )

//     return (
//       <Select
//         closeMenuOnSelect={true}
//         options={options}
//         isDisabled={disabled}
//         menuPortalTarget={menuPortalTarget}
//         placeholder={`Select ${label}`}
//         className={className}
//         classNamePrefix={classNamePrefix}
//         styles={customStyles}
//         getOptionLabel={(option: any) => option?.name || option?.label || ""}
//         getOptionValue={(option: any) => option?.id || option?._id || option?.value || ""}
//         value={selectedValue}
//         onBlur={() => onBlur(selectedValue)}
//         onChange={handleSelectChange}
//         isClearable
//       />
//     )
//   },
// )

// const SelectMultiple = memo(
//   ({
//     className = "",
//     placeholder = "",
//     field,
//     form,
//     disabled = false,
//     options = [],
//     isMulti = false,
//     error = false,
//   }: {
//     className?: string
//     placeholder?: string
//     field: any
//     form: any
//     disabled?: boolean
//     options: any[]
//     isMulti?: boolean
//     error?: boolean
//   }) => {
//     const handleChange = useCallback(
//       (selectedOptions: any) => {
//         const values = isMulti
//           ? selectedOptions?.map((item: any) => item.id || item._id || item.value) || []
//           : selectedOptions?.id || selectedOptions?._id || selectedOptions?.value || ""
//         form.setFieldValue(field?.name, values)
//       },
//       [form, field?.name, isMulti],
//     )

//     const getValue = useCallback(() => {
//       if (!options.length) return isMulti ? [] : null

//       if (isMulti) {
//         const fieldValues = field?.value || []
//         return options.filter((option: any) => fieldValues.includes(option?.id || option?._id || option?.value))
//       } else {
//         return options.find((option: any) => (option?.id || option?._id || option?.value) === field?.value) || null
//       }
//     }, [options, field?.value, isMulti])

//     const customStyles = useMemo(
//       () => ({
//         control: (provided: any, state: any) => ({
//           ...provided,
//           borderColor: error ? "#F43F5E" : state.isFocused ? "#0EA5E9" : "#D1D5DB",
//           boxShadow: error ? "0 0 0 1px #F43F5E" : state.isFocused ? "0 0 0 1px #0EA5E9" : "none",
//           "&:hover": {
//             borderColor: error ? "#F43F5E" : state.isFocused ? "#0EA5E9" : "#9CA3AF",
//           },
//           borderRadius: "0.5rem",
//           backgroundColor: disabled ? "#F3F4F6" : "white",
//           padding: "2px 4px",
//           minHeight: "42px",
//         }),
//         multiValue: (provided: any) => ({
//           ...provided,
//           backgroundColor: "#E0F2FE",
//           borderRadius: "0.375rem",
//           padding: "1px 2px",
//           margin: "2px",
//         }),
//         multiValueLabel: (provided: any) => ({
//           ...provided,
//           color: "#0369A1",
//           fontSize: "0.875rem",
//           padding: "0 4px",
//         }),
//         multiValueRemove: (provided: any) => ({
//           ...provided,
//           color: "#0EA5E9",
//           borderRadius: "0 0.375rem 0.375rem 0",
//           "&:hover": { backgroundColor: "#BAE6FD", color: "#0369A1" },
//         }),
//         option: (provided: any, state: any) => ({
//           ...provided,
//           backgroundColor: state.isSelected ? "#0EA5E9" : state.isFocused ? "#E0F2FE" : null,
//           color: state.isSelected ? "white" : "#111827",
//           "&:active": { backgroundColor: "#38BDF8" },
//           padding: "10px 12px",
//         }),
//         menu: (provided: any) => ({
//           ...provided,
//           borderRadius: "0.5rem",
//           boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
//           zIndex: 9999,
//           overflow: "hidden",
//         }),
//         placeholder: (provided: any) => ({ ...provided, color: "#9CA3AF" }),
//         indicatorSeparator: (provided: any) => ({ ...provided, display: "none" }),
//         dropdownIndicator: (provided: any) => ({ ...provided, color: "#6B7280" }),
//       }),
//       [error, disabled],
//     )

//     return (
//       <Select
//         className={className}
//         isDisabled={disabled}
//         name={field?.name}
//         value={getValue()}
//         onChange={handleChange}
//         placeholder={placeholder}
//         options={options}
//         styles={customStyles}
//         getOptionLabel={(option: any) => option?.name || option?.label || ""}
//         getOptionValue={(option: any) => option?.id || option?._id || option?.value || ""}
//         isMulti={isMulti}
//         isClearable
//       />
//     )
//   },
// )

// const FeatureManager = memo(
//   ({
//     options = [],
//     values,
//     setFieldValue,
//     error,
//   }: {
//     options: any[]
//     values: any
//     setFieldValue: (field: string, value: any) => void
//     error?: boolean
//   }) => {
//     const [selectedFeature, setSelectedFeature] = useState<any>(null)
//     const [featureValue, setFeatureValue] = useState("")
//     const [featureDescription, setFeatureDescription] = useState("")
//     const [formError, setFormError] = useState("")

//     const handleAddFeature = useCallback(() => {
//       if (!selectedFeature) {
//         setFormError("Please select a feature")
//         return
//       }

//       if (!featureValue) {
//         setFormError("Please enter a value")
//         return
//       }

//       setFormError("")
//       const newFeatures = {
//         ...values.features,
//         [selectedFeature.id]: {
//           name: selectedFeature.name,
//           description: featureDescription,
//           value: Number.parseInt(featureValue),
//         },
//       }

//       setFieldValue("features", newFeatures)
//       setSelectedFeature(null)
//       setFeatureValue("")
//       setFeatureDescription("")
//     }, [selectedFeature, featureValue, featureDescription, values.features, setFieldValue])

//     const handleRemoveFeature = useCallback(
//       (featureKey: string) => {
//         const newFeatures = { ...values.features }
//         delete newFeatures[featureKey]
//         setFieldValue("features", newFeatures)
//       },
//       [values.features, setFieldValue],
//     )

//     const editFeature = useCallback(
//       (key: string, feature: any) => {
//         setSelectedFeature(
//           options.find((option: any) => option.id === Number.parseInt(key) || option.name === feature.name),
//         )
//         setFeatureValue(feature.value.toString())
//         setFeatureDescription(feature.description || "")
//         handleRemoveFeature(key)
//       },
//       [options, handleRemoveFeature],
//     )

//     return (
//       <div className="space-y-4">
//         <div
//           className={`p-5 rounded-lg border ${error ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"}`}
//         >
//           <h3 className="font-medium text-slate-800 mb-3">Add Features</h3>

//           <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
//             <div className="md:col-span-4">
//               <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">Feature</label>
//               <Field
//                 name="featureSelector"
//                 component={Select2}
//                 options={options}
//                 value={selectedFeature}
//                 onChange={setSelectedFeature}
//                 placeholder="Select Feature"
//                 className="w-full"
//               />
//             </div>
//             <div className="md:col-span-5">
//               <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">Description</label>
//               <input
//                 type="text"
//                 name="feature_description"
//                 placeholder="Feature description"
//                 value={featureDescription}
//                 onChange={(e) => setFeatureDescription(e.target.value)}
//                 className="appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base"
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">Value</label>
//               <input
//                 type="number"
//                 name="featureValue"
//                 placeholder="Value"
//                 value={featureValue}
//                 onChange={(e) => setFeatureValue(e.target.value)}
//                 className="appearance-none block w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base"
//               />
//             </div>
//             <div className="md:col-span-1 flex items-end">
//               <button
//                 type="button"
//                 className="w-full flex justify-center items-center px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200"
//                 onClick={handleAddFeature}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path
//                     fillRule="evenodd"
//                     d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               </button>
//             </div>
//           </div>

//           {formError && (
//             <div className="mt-2 text-sm 2xl:text-base text-rose-600 flex items-center gap-1.5">
//               <svg
//                 className="w-4 h-4 flex-shrink-0"
//                 fill="currentColor"
//                 viewBox="0 0 20 20"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
//                   clipRule="evenodd"
//                 ></path>
//               </svg>
//               {formError}
//             </div>
//           )}
//         </div>

//         {Object.keys(values.features || {}).length > 0 && (
//           <div className="mt-4 overflow-x-auto">
//             <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
//               <table className="min-w-full divide-y divide-slate-200">
//                 <thead className="bg-slate-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                       Feature Name
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                       Description
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                       Value
//                     </th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-slate-200">
//                   {Object.entries(values.features || {}).map(([key, feature]) => {
//                     const typedFeature = feature as {
//                       name: string
//                       description: string
//                       value: number
//                     }
//                     return (
//                       <tr key={key} className="hover:bg-slate-50 transition-colors duration-150">
//                         <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base font-medium text-slate-700">
//                           {key}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base text-slate-600">
//                           {typedFeature.name}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base text-slate-600">
//                           {typedFeature.description}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm 2xl:text-base text-slate-600">
//                           {typedFeature.value}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm 2xl:text-base font-medium">
//                           <div className="flex justify-end gap-2">
//                             <button
//                               type="button"
//                               className="text-sky-600 hover:text-sky-800 focus:outline-none focus:underline transition-colors duration-200"
//                               onClick={() => editFeature(key, typedFeature)}
//                             >
//                               Edit
//                             </button>
//                             <button
//                               type="button"
//                               className="text-rose-600 hover:text-rose-800 focus:outline-none focus:underline transition-colors duration-200"
//                               onClick={() => handleRemoveFeature(key)}
//                             >
//                               Remove
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     )
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     )
//   },
// )

// // Set display names for better debugging
// MyForm.displayName = "MyForm"
// TextEditer.displayName = "TextEditer"
// PictureInput.displayName = "PictureInput"
// PictureInputPreview.displayName = "PictureInputPreview"
// Checkbox.displayName = "Checkbox"
// Select2.displayName = "Select2"
// SelectMultiple.displayName = "SelectMultiple"
// FeatureManager.displayName = "FeatureManager"

// export { PictureInput, Checkbox, Select2, SelectMultiple, TextEditer, PictureInputPreview, FeatureManager }

// export default MyForm
