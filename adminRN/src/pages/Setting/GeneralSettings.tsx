import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AxiosHelper from '../../helper/AxiosHelper';
import { SETTING_API_ENDPOINTS } from '../../constant/constant';
import { toast } from 'react-toastify';

interface GeneralSettingsData {
  [key: string]: string | File | null;
}

const GeneralSettings: React.FC<{ selectedWebsite?: string }> = ({ selectedWebsite }) => {
  const [initialValues, setInitialValues] = useState<GeneralSettingsData>({});
  const [validationSchema, setValidationSchema] = useState<any>({});

  useEffect(() => {
    const fetchGeneralSettings = async () => {
      try {
        const response = await AxiosHelper.getData(`${SETTING_API_ENDPOINTS.GENERAL_SETTINGS}?website=${selectedWebsite}`);
        const data = response.data.data.reduce((acc: GeneralSettingsData, item: any) => {
          acc[item.field_name] = item.field_value;
          return acc;
        }, {});
        setInitialValues(data);

        // Dynamically create validation schema
        const schema: { [key: string]: any } = {};
        response.data.data.forEach((item: any) => {
          if (item.field_type === 'url') {
            schema[item.field_name] = Yup.string().url(`Invalid URL for ${item.field_label}`);
          } else if (item.field_type === 'file') {
            schema[item.field_name] = Yup.mixed();
          } else {
            schema[item.field_name] = Yup.string().required(`${item.field_label} is required`);
          }
        });
        setValidationSchema(Yup.object().shape(schema));
      } catch (error) {
        console.error('Error fetching general settings:', error);
        toast.error('Failed to fetch general settings');
      }
    };

    fetchGeneralSettings();
  }, [selectedWebsite]);

  const handleSubmit = async (values: GeneralSettingsData) => {
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (values[key] instanceof File) {
          formData.append(key, values[key] as File);
        } else {
          formData.append(key, values[key]?.toString() || '');
        }
      });
      formData.append('type', '1');
      formData.append('website', selectedWebsite);

      await AxiosHelper.putData(SETTING_API_ENDPOINTS.UPDATE_SETTINGS, formData, true);
      toast.success('General settings updated successfully');
    } catch (error) {
      console.error('Error updating general settings:', error);
      toast.error('Failed to update general settings');
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, setFieldValue, isSubmitting }) => (
        <Form className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Object.keys(initialValues).map((fieldName) => (
              <div key={fieldName}>
                <label htmlFor={fieldName} className="block text-base font-medium text-black dark:text-white mb-1">
                  {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                </label>
                {initialValues[fieldName] instanceof File ? (
                  <input
                    type="file"
                    name={fieldName}
                    id={fieldName}
                    onChange={(event) => {
                      setFieldValue(fieldName, event.currentTarget.files?.[0]);
                    }}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                ) : (
                  <Field
                    type="text"
                    name={fieldName}
                    id={fieldName}
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                )}
                {errors[fieldName] && touched[fieldName] && (
                  <div className="text-red-500 text-sm mt-1">{errors[fieldName]?.toString()}</div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default GeneralSettings;
