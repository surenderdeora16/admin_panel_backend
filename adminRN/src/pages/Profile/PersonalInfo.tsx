'use client'

import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { FiEdit2, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { updateAdmin } from '../../redux/admin/adminSlice'
import AxiosHelper from '../../helper/AxiosHelper'
import { toast } from 'react-toastify'

export default function PersonalInfo() {
  const dispatch = useDispatch()
  const profile = useSelector((state: RootState) => state.admin?.data)
  const [isEditing, setIsEditing] = useState(false)

  const initialValues = {
    name: profile?.name || '',
    email: profile?.email || '',
    mobile: profile?.mobile || '',
  }

  const validationSchema = Yup.object({
    name: Yup.string()
      .required('First Name Required..!!')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters'),
    email: Yup.string()
      .required('Invalid Email..!!')
      .email('Invalid email format')
      .min(6, 'Email must be at least 6 characters')
      .max(50, 'Email must be at most 50 characters'),
    mobile: Yup.string()
      .required('Mobile Number Required..!!')
      .matches(/^\d{10}$/, 'Mobile No Must Be 10 Digits Only.'),
  })

  const handleProfileUpdate = async (values: typeof initialValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      const response = await AxiosHelper.postData('admin/update-profile', values)
      if (response?.data?.status === true) {
        dispatch(updateAdmin(response.data))
        toast.success(response?.data?.message)
        setIsEditing(false)
      } else {
        toast.error(response?.data?.message || 'Update failed')
      }
    } catch (error) {
      toast.error('An error occurred while updating the profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleProfileUpdate}
      enableReinitialize
    >
      {({ isSubmitting, handleSubmit }) => (
        <Form className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-black dark:text-white">Personal Information</h2>
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  handleSubmit()
                } else {
                  setIsEditing(true)
                }
              }}
              className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-gray-200 dark:hover:text-gray-500 transition-colors"
              disabled={isSubmitting}
            >
              {isEditing ? (
                <>
                  <FiSave className="w-5 h-5 mr-1" />
                  Save
                </>
              ) : (
                <>
                  <FiEdit2 className="w-5 h-5 mr-1" />
                  Edit
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className='col-span-1 md:col-span-2'>
              <InputField
                label="Name"
                name="name"
                type="text"
                disabled={!isEditing}
              />
            </div>
            <InputField
              label="Email"
              name="email"
              type="email"
              disabled={!isEditing}
            />
            <InputField
              label="Mobile Number"
              name="mobile"
              type="tel"
              disabled={!isEditing}
            />
          </div>
        </Form>
      )}
    </Formik>
  )
}

type InputFieldProps = {
  label: string
  name: string
  type?: string
  disabled: boolean
}

function InputField({
  label,
  name,
  type = 'text',
  disabled,
}: InputFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-base font-medium text-black dark:text-white mb-1">
        {label}
      </label>
      <Field
        type={type}
        id={name}
        name={name}
        disabled={disabled}
        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
      />
      <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
    </div>
  )
}

