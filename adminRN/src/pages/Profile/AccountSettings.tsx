'use client';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { PiToggleLeftLight, PiToggleRightLight } from 'react-icons/pi';
import AxiosHelper from '../../helper/AxiosHelper';
import { toast } from 'react-toastify';

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactor: boolean;
}

const validationSchema = Yup.object({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

const AccountSettings: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: FormData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
  };

  const handleSubmit = async (values: FormData, { resetForm }: { resetForm: () => void }) => {
    setIsSubmitting(true);
    try {
      const response = await AxiosHelper.postData('/admin/change-password', {
        password: values.currentPassword,
        new_password: values.newPassword
      });

      if (response.data.status) {
        toast.success(response.data.message);
        resetForm();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing the password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Account Settings</h2>
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isValid, dirty }) => (
          <Form className="space-y-5">
            <PasswordField
              label="Current Password"
              name="currentPassword"
            />
            <PasswordField
              label="New Password"
              name="newPassword"
            />
            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
            />
            {/* <div className="flex items-center justify-between">
              <div>
                <label htmlFor="twoFactor" className="font-medium text-black dark:text-white">
                  Two-Factor Authentication
                </label>
                <p className="text-sm text-gray-500">Enable for enhanced account security</p>
              </div>
              <button
                type="button"
                onClick={() => setFieldValue('twoFactor', !values.twoFactor)}
                disabled={!isEditing}
                className={`p-2 rounded-full transition-colors ${isEditing ? 'hover:bg-gray-100' : ''}`}
              >
                {values.twoFactor ? (
                  <PiToggleRightLight className="w-10 h-10 text-indigo-600" />
                ) : (
                  <PiToggleLeftLight className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div> */}
              <button
                type="submit"
                disabled={isSubmitting || !isValid || !dirty}
                className={`mt-4 w-full py-2 px-4 bg-indigo-600 text-white rounded-lg transition-colors ${isSubmitting || !isValid || !dirty
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700'
                  }`}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

interface PasswordFieldProps {
  label: string;
  name: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ label, name }) => (
  <div>
    <label htmlFor={name} className="block text-base font-medium text-black dark:text-white mb-1">
      {label}
    </label>
    <Field
      type="password"
      id={name}
      name={name}
      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
    />
    <ErrorMessage
      name={name}
      component="div"
      className="text-red-500 text-sm mt-1"
    />
  </div>
);

export default AccountSettings;

