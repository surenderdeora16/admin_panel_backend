'use client';

import type React from 'react';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import Select from 'react-select';
import JoditEditor from 'jodit-react';

const MyForm = ({
  errors,
  fields,
  initialValues,
  validSchema,
  onSubmit = () => null,
  isReset = false,
  disabled = false,
}: {
  errors?: any;
  fields?: any[];
  initialValues: any;
  validSchema: any;
  onSubmit?: (values: any) => void;
  isReset?: boolean;
  disabled?: boolean;
}) => {
  const [inactive, setInActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      validationSchema={validSchema}
      onSubmit={(values, { resetForm }) => {
        if (!disabled) {
          setSubmitting(true);
          onSubmit(values);
          if (isReset) resetForm();
          setInActive(true);
          setTimeout(() => {
            setInActive(false);
            setSubmitting(false);
          }, 2000);
        }
      }}
    >
      {({ values, setFieldValue, errors: formikErrors, touched }) => {
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
                      key={i}
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
                            delete field?.hideLabel;

                            switch (field?.type) {
                              // For Select Input
                              case 'select':
                                var field2 = Object.assign({}, field);
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
                                      <option value="0" disabled>
                                        Select {field?.label}
                                      </option>
                                      {field?.options.map(
                                        (option: any, i: any) => (
                                          <option
                                            value={option?.id}
                                            key={option?.id}
                                          >
                                            {option?.name}
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
                                    {...field}
                                    options={field?.options}
                                    component={Select2}
                                    error={fieldError}
                                  />
                                );

                              // For Select Multiple Input
                              case 'select-multiple':
                                return (
                                  <Field
                                    id={field?.name}
                                    disabled={disabled || isDisabled}
                                    isMulti={true}
                                    {...field}
                                    options={field?.options}
                                    component={SelectMultiple}
                                    error={fieldError}
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
                                    {...field}
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
                                    {...field}
                                  />
                                );

                              // For Html Editor Input
                              case 'text-editer':
                                return (
                                  <Field
                                    id={field?.name}
                                    disabled={disabled || isDisabled}
                                    name={field?.name}
                                    component={TextEditer}
                                    {...field}
                                    error={fieldError}
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
                                    {...field}
                                    error={fieldError}
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
                                    {...field}
                                    error={fieldError}
                                  />
                                );

                              case 'image-file':
                                return (
                                  <Field
                                    id={field?.name}
                                    disabled={disabled || isDisabled}
                                    name={field?.name}
                                    component={PictureInputPreview}
                                    {...field}
                                    error={fieldError}
                                  />
                                );
                              case 'check':
                                return (
                                  <Field
                                    id={field?.name}
                                    disabled={disabled || isDisabled}
                                    type="checkbox"
                                    name={field?.name}
                                    label={field?.name}
                                    component={Checkbox}
                                    error={fieldError}
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

                              // For Submit Input
                              case 'submit':
                                return (
                                  <div className="flex justify-end mt-2">
                                    <button
                                      type="submit"
                                      disabled={
                                        disabled ||
                                        isDisabled ||
                                        inactive ||
                                        submitting
                                      }
                                      value="submit"
                                      className="inline-flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-2.5 font-medium text-white bg-sky-600 rounded-lg shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200"
                                      {...field}
                                    >
                                      {submitting ? (
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
                                    {...field}
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
};

// Picture Input Component with Attachment Display
const PictureInput = ({
  form,
  field,
  multiple,
  label,
  disabled,
  error,
}: {
  form: any;
  field: any;
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
  error?: boolean;
}) => {
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [fileSelected, setFileSelected] = useState(false);

  useEffect(() => {
    var data = field?.value;
    if (data != null && Array.isArray(data)) {
      setUrls(data);
    } else if (data != null && typeof data != 'object') {
      setUrl(data);
    }
  }, [field]);

  return (
    <>
      <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">
        {label}
        {![undefined, null, ''].includes(url) && (
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
                    if (e.target.files && e.target.files.length > 0) {
                      setFileSelected(true);
                      multiple
                        ? form.setFieldValue(field?.name, e.target.files)
                        : form.setFieldValue(field?.name, e.target.files[0]);
                    } else {
                      setFileSelected(false);
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
              {fileSelected ? 'File selected' : 'PDF, PNG, JPG, GIF up to 10MB'}
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
            {urls?.map((item, i) => (
              <a
                key={i}
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
};

// Picture Input Preview Component
const PictureInputPreview = ({
  form,
  field,
  multiple = false,
  label,
  disabled,
  error,
}: {
  form: any;
  field: any;
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
  error?: boolean;
}) => {
  const [previews, setPreviews] = useState<any>([]);
  const [fileSelected, setFileSelected] = useState(false);

  useEffect(() => {
    if (field?.value && Array.isArray(field?.value)) {
      setPreviews(
        field.value.map((file: any) =>
          typeof file === 'string' ? file : URL.createObjectURL(file),
        ),
      );
      if (field.value.length > 0) setFileSelected(true);
    }
  }, [field?.value]);

  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFileSelected(true);
      if (multiple) {
        form.setFieldValue(field?.name, files);
      } else {
        form.setFieldValue(field?.name, files[0]);
      }
      setPreviews(files.map((file: any) => URL.createObjectURL(file)));
    } else {
      setFileSelected(false);
    }
  };

  return (
    <>
      {/* <label className="block text-sm 2xl:text-base font-medium text-slate-700 mb-1">
        {label}
      </label> */}

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

      {/* Image Preview Gallery */}
      {previews.length > 0 && (
        <div className="mt-4">
          <p className="text-sm 2xl:text-base font-medium text-slate-700 mb-2">
            Image Preview:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {previews.map((src: any, index: number) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-lg shadow-sm border border-slate-200"
              >
                <img
                  src={src || '/placeholder.svg'}
                  alt={`Preview ${index + 1}`}
                  className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
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
};

// Small Picture Input Component
const PictureInputSmall = ({
  form,
  field,
  multiple,
  disabled,
  className = '',
}: {
  form: any;
  field: any;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}) => {
  const random = Math.random();
  const [selected, setSelected] = useState(false);

  return (
    <>
      <label
        className={`inline-flex items-center justify-center p-2 rounded-md border ${
          selected
            ? 'bg-sky-50 border-sky-300 text-sky-700 ' + className
            : 'border-slate-300 bg-white text-slate-700'
        } shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 cursor-pointer`}
        htmlFor={`random-${random}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v1.5a1.5 1.5 0 01-3 0V7a1 1 0 012 0v1.5a3.5 3.5 0 01-7 0V7a3 3 0 013-3h6a3 3 0 013 3v4a3 3 0 01-3 3H8a1 1 0 100 2h2a5 5 0 005-5V7a5 5 0 00-5-5H8z"
            clipRule="evenodd"
          />
        </svg>
        {selected && <span className="sr-only">File selected</span>}
      </label>
      <input
        name={field?.name}
        id={`random-${random}`}
        className="hidden"
        type="file"
        multiple={multiple}
        disabled={disabled}
        onChange={(e: any) => {
          if (e.target.files && e.target.files.length > 0) {
            setSelected(true);
            multiple
              ? form.setFieldValue(field?.name, e.target.files)
              : form.setFieldValue(field?.name, e.target.files[0]);
          } else {
            setSelected(false);
          }
        }}
      />
    </>
  );
};

// Custom Checkbox Component
const Checkbox = ({
  form,
  field,
  disabled,
  size = 'lg',
  onChangeCustom = () => null,
  className = '',
  checked = false,
  error = false,
}: {
  form: any;
  field: any;
  disabled?: boolean;
  size?: string;
  onChangeCustom?: (value: number) => void;
  className?: string;
  checked?: boolean;
  error?: boolean;
}) => {
  const [isChecked, setIsChecked] = useState(checked || field.value === 1);

  useEffect(() => {
    setIsChecked(field.value === 1 || checked);
  }, [field.value, checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.checked);
    setIsChecked(e.target.checked);
    onChangeCustom(newValue);
    form.setFieldValue(field?.name, newValue);
  };

  const sizeClasses = {
    sm: {
      wrapper: 'w-8 h-4',
      toggle: 'after:h-3 after:w-3 after:left-0.5',
    },
    md: {
      wrapper: 'w-10 h-5',
      toggle: 'after:h-4 after:w-4 after:left-0.5',
    },
    lg: {
      wrapper: 'w-12 h-6',
      toggle: 'after:h-5 after:w-5 after:left-0.5',
    },
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
          rounded-full 
          peer 
          peer-focus:outline-none 
          peer-focus:ring-2 
          peer-focus:ring-sky-300 
          dark:peer-focus:ring-sky-800 
          peer-checked:after:translate-x-full 
          rtl:peer-checked:after:-translate-x-full 
          after:content-[''] 
          after:absolute 
          after:top-[2px] 
          after:bg-white 
          after:border-slate-300 
          after:border 
          after:rounded-full 
          ${
            sizeClasses[size as keyof typeof sizeClasses]?.toggle ||
            sizeClasses.md.toggle
          }
          after:transition-all 
          peer-disabled:opacity-50
          peer-disabled:cursor-not-allowed
        `}
        ></div>
      </label>
      <span className="sr-only">{field?.label || 'Toggle'}</span>
    </div>
  );
};

// Custom Select Component
const Select2 = ({
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
}: {
  form: any;
  field: any;
  options: any;
  label: any;
  menuPortalTarget: any;
  className: any;
  classNamePrefix: any;
  disabled: any;
  onChange: any;
  onChangeCustom: any;
  onBlur: any;
  onChangeUpdateToNull: any;
  error: any;
}) => {
  const [myValue, setMyValue] = useState(null);

  useEffect(() => {
    if (onChangeUpdateToNull) {
      var selected = options.filter((row: any) =>
        [row.id, row._id].includes(field?.value),
      );
      selected.length === 1 ? setMyValue(selected?.[0]) : setMyValue(null);
    } else {
      setMyValue(
        options.find((row: any) => [row.id, row._id].includes(field?.value)),
      );
    }
  }, [field?.value, options, onChangeUpdateToNull]);

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: error ? '#F43F5E' : state.isFocused ? '#0EA5E9' : '#D1D5DB',
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
      '&:active': {
        backgroundColor: '#38BDF8',
      },
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
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9CA3AF',
    }),
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
  };

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
      isOptionSelected={(option: any, selectValue: any) =>
        selectValue.some((i: any) => i === option)
      }
      getOptionLabel={(option: any) => option?.name}
      getOptionValue={(option: any) => option?.id || option?._id}
      value={myValue}
      onBlur={() => {
        onBlur(myValue?.[0]);
      }}
      onChange={(value: any) => {
        onChange(value);
        onChangeCustom(value);
        setMyValue(value);
        form.setFieldValue(field?.name, value?.id || value?._id);
      }}
    />
  );
};

// Multi-Select Component
const SelectMultiple = ({
  className,
  placeholder,
  field,
  form,
  disabled = false,
  options,
  isMulti = false,
  error = false,
}: {
  className: any;
  placeholder: any;
  field: any;
  form: any;
  disabled: any;
  options: any;
  isMulti: any;
  error: any;
}) => {
  const onChange = (option: any) => {
    form.setFieldValue(
      field?.name,
      isMulti ? option.map((item: any) => item.id) : option.id,
    );
  };

  const getValue = () => {
    if (options) {
      return isMulti
        ? options.filter((option: any) => field?.value.indexOf(option?.id) >= 0)
        : options.find((option: any) => option?.id === field?.value);
    } else {
      return isMulti ? [] : '';
    }
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: error ? '#F43F5E' : state.isFocused ? '#0EA5E9' : '#D1D5DB',
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
      '&:hover': {
        backgroundColor: '#BAE6FD',
        color: '#0369A1',
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#0EA5E9'
        : state.isFocused
        ? '#E0F2FE'
        : null,
      color: state.isSelected ? 'white' : '#111827',
      '&:active': {
        backgroundColor: '#38BDF8',
      },
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
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9CA3AF',
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      display: 'none',
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: '#6B7280',
    }),
  };

  return (
    <Select
      className={className}
      isDisabled={disabled}
      name={field?.name}
      value={getValue()}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
      styles={customStyles}
      getOptionLabel={(option: any) => option?.name}
      getOptionValue={(option: any) => option?.id}
      isMulti={isMulti}
    />
  );
};

// Rich Text Editor Component
const TextEditer = ({
  form,
  field,
  disabled,
  error,
}: {
  form: any;
  field: any;
  disabled: any;
  error: any;
}) => {
  const editor = useRef(null);
  const [canUpdate, setCanUpdate] = useState(true);
  const [content, setContent] = useState<any>('');

  useEffect(() => {
    if (canUpdate && field?.value !== '') {
      setContent(field?.value);
      setCanUpdate(false);
    }
  }, [field?.value, canUpdate]);

  return useMemo(() => {
    const config = {
      readonly: disabled,
      theme: 'default',
      width: '100%',
      height: 300,
      toolbarButtonSize: 'medium',
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'ul',
        'ol',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'link',
        'image',
        'table',
        '|',
        'align',
        'undo',
        'redo',
        '|',
        'hr',
        'eraser',
        'fullsize',
        'source',
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
      colorPickerDefaultTab: 'background',
      controls: {
        font: {
          list: {
            Arial: 'Arial',
            'Courier New': 'Courier New',
            Georgia: 'Georgia',
            Impact: 'Impact',
            Tahoma: 'Tahoma',
            'Times New Roman': 'Times New Roman',
            Verdana: 'Verdana',
          },
        },
      },
      style: {
        borderRadius: '0.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      defaultActionOnPaste: 'insert_as_html',
      cleanHTML: false,
      removeEmptyAttributes: false,
      allowTags: ['*'],
      allowAttributes: ['*'],

      // events: {
      //   onPaste: (event: ClipboardEvent) => {
      //     console.log('Pasting something...');
      //   },
      // },
    };

    return (
      <div
        className={`jodit-wrapper rounded-lg overflow-hidden ${
          error ? 'ring-2 ring-rose-500' : ''
        }`}
      >
        <JoditEditor
          ref={editor}
          value={content}
          config={config}
          onBlur={(content: any) => form.setFieldValue(field?.name, content)}
        />
      </div>
    );
  }, [content, form, field?.name, disabled, error]);
};

// Feature Manager Component
const FeatureManager = ({
  options,
  values,
  setFieldValue,
  error,
}: {
  options: any;
  values: any;
  setFieldValue: any;
  error: any;
}) => {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [featureValue, setFeatureValue] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [formError, setFormError] = useState('');

  const handleAddFeature = () => {
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
  };

  const handleRemoveFeature = (featureKey: any) => {
    const newFeatures = { ...values.features };
    delete newFeatures[featureKey];
    setFieldValue('features', newFeatures);
  };

  const editFeature = (key: string, feature: any) => {
    setSelectedFeature(
      options.find(
        (option: any) =>
          option.id === Number.parseInt(key) || option.name === feature.name,
      ),
    );
    setFeatureValue(feature.value.toString());
    setFeatureDescription(feature.description || '');

    // Remove the feature so we can re-add it
    handleRemoveFeature(key);
  };

  return (
    <div className="space-y-4">
      <div
        className={`p-5 rounded-lg border ${
          error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
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
              onChange={(e: any) => setFeatureDescription(e.target.value)}
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
              onChange={(e: any) => setFeatureValue(e.target.value)}
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    Feature Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {Object.entries(values.features || {}).map(([key, feature]) => {
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export {
  PictureInput,
  PictureInputSmall,
  Checkbox,
  Select2,
  SelectMultiple,
  TextEditer,
  PictureInputPreview,
};
export default MyForm;
