import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AxiosHelper from '../../helper/AxiosHelper';
import { SETTING_API_ENDPOINTS } from '../../constant/constant';
import { toast } from 'react-toastify';

interface SMSSettingsData {
  [key: string]: string;
}

const SMSSettings: React.FC<{ selectedWebsite?: string }> = ({ selectedWebsite }) => {
  const [initialValues, setInitialValues] = useState<SMSSettingsData>({});
  const [validationSchema, setValidationSchema] = useState<any>({});

  useEffect(() => {
    const fetchSMSSettings = async () => {
      try {
        const response = await AxiosHelper.getData(`${SETTING_API_ENDPOINTS.SMS_SETTINGS}?website=${selectedWebsite}`);
        const data = response.data.data.reduce((acc: SMSSettingsData, item: any) => {
          acc[item.field_name] = item.field_value;
          return acc;
        }, {});
        setInitialValues(data);

        // Dynamically create validation schema
        const schema: { [key: string]: any } = {};
        response.data.data.forEach((item: any) => {
          schema[item.field_name] = Yup.string().required(`${item.field_label} is required`);
        });
        setValidationSchema(Yup.object().shape(schema));
      } catch (error) {
        console.error('Error fetching SMS settings:', error);
        toast.error('Failed to fetch SMS settings');
      }
    };

    fetchSMSSettings();
  }, [selectedWebsite]);

  const handleSubmit = async (values: SMSSettingsData) => {
    try {
      await AxiosHelper.putData(SETTING_API_ENDPOINTS.UPDATE_SETTINGS, { ...values, type: '4', website: selectedWebsite });
      toast.success('SMS settings updated successfully');
    } catch (error) {
      console.error('Error updating SMS settings:', error);
      toast.error('Failed to update SMS settings');
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, isSubmitting }) => (
        <Form className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Object.keys(initialValues).map((fieldName) => (
              <div key={fieldName}>
                <label htmlFor={fieldName} className="block text-base font-medium text-black dark:text-white mb-1">
                  {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <Field
                  type={fieldName.toLowerCase().includes('secret') ? 'password' : 'text'}
                  name={fieldName}
                  id={fieldName}
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
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

export default SMSSettings;

