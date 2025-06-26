'use client';

import { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import * as Yup from 'yup';
import { AnimatePresence, motion } from 'framer-motion';
import {
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CheckBadgeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import AxiosHelper from '../../helper/AxiosHelper';
import DataManager from '../../components/DataManager';

// Memoized UserAvatar
const UserAvatar = memo(({ name, image }: { name: string; image: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-medium">
          {name?.[0]?.toUpperCase()}
        </span>
      )}
    </div>
    <span className="font-medium">{name}</span>
  </div>
));
UserAvatar.displayName = 'UserAvatar';

// Memoized DetailCard without animation
const DetailCard = memo(({ icon: Icon, title, value }: any) => (
  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center gap-4">
    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
      <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  </div>
));
DetailCard.displayName = 'DetailCard';

// Optimized PasswordChangeForm
const PasswordChangeForm = memo(
  ({
    onSubmit,
  }: {
    onSubmit: (data: {
      newPassword: string;
      confirmPassword: string;
    }) => Promise<void>;
  }) => {
    const [formData, setFormData] = useState({
      newPassword: '',
      confirmPassword: '',
    });
    const [cpLoading, setCpLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const newPasswordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
      setPasswordError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setCpLoading(true);

      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        toast.error('Passwords do not match');
        return;
      }

      if (formData.newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
        toast.error('Password must be at least 6 characters long');
        return;
      }

      try {
        await onSubmit(formData);
        setFormData({ newPassword: '', confirmPassword: '' });
        setPasswordError('');
      } catch (error: any) {
        console.error('Error changing password:', error);
        toast.error(
          error.response?.data?.message || 'Failed to change password',
        );
      } finally {
        setCpLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              required
              placeholder="Enter new password"
              ref={newPasswordRef}
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              required
              placeholder="Confirm new password"
              ref={confirmPasswordRef}
            />
          </div>
          {passwordError && (
            <p className="text-red-500 text-sm">{passwordError}</p>
          )}
          <button
            type="submit"
            disabled={cpLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700"
          >
            {cpLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    );
  },
);
PasswordChangeForm.displayName = 'PasswordChangeForm';

const Users = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'purchases' | 'payments' | 'changePassword'
  >('purchases');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Preload modal content
  useEffect(() => {
    if (selectedUser) {
      setIsLoading(true);
      const loadData = async () => {
        try {
          const response = await AxiosHelper.getData(`users/${selectedUser}`);
          setUserDetails(response.data.data);
          setIsModalOpen(true);
        } catch (error) {
          console.error('Error loading user details:', error);
          toast.error('Failed to load user details');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [selectedUser]);

  const handlePasswordChange = useCallback(
    async ({
      newPassword,
      confirmPassword,
    }: {
      newPassword: string;
      confirmPassword: string;
    }) => {
      await AxiosHelper.postData(`users/${selectedUser}/change-password`, {
        newPassword,
        confirmPassword,
      });
      toast.success('Password changed successfully');
    },
    [selectedUser],
  );

  // Memoized tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    if (!userDetails) return null;

    if (activeTab === 'purchases') {
      return (
        <div className="space-y-4">
          {userDetails.purchases?.map((purchase: any) => (
            <div
              key={purchase._id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {purchase.itemId?.title || purchase.itemId?.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Order: {purchase.orderId?.orderNumber}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {purchase.itemType}
                </span>
              </div>
            </div>
          ))}
          {!userDetails.purchases?.length && (
            <div className="text-center text-gray-500 py-6">
              No purchases found
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'payments') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Method</th>
              </tr>
            </thead>
            <tbody>
              {userDetails.payments?.map((payment: any) => (
                <tr key={payment._id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-3">
                    ₹{payment.amount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        payment.status === 'CAPTURED'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.method}</td>
                </tr>
              ))}
              {!userDetails.payments?.length && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-6">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'changePassword') {
      return <PasswordChangeForm onSubmit={handlePasswordChange} />;
    }

    return null;
  }, [activeTab, userDetails, handlePasswordChange]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
  };

  const UserDetailModal = useMemo(() => {
    if (!userDetails) return null;

    return (
      <motion.div
        key="user-detail-modal"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        style={{ zIndex: '214748364' }}
        className="fixed inset-0 !m-0 bg-black/50 flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            <h2 className="text-2xl font-bold">User Details</h2>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedUser(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            <div className="lg:col-span-1 space-y-6">
              <UserAvatar
                name={userDetails.user?.name}
                image={userDetails.user?.image}
              />
              <div className="space-y-4">
                <DetailCard
                  icon={CheckBadgeIcon}
                  title="Status"
                  value={
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        userDetails.user?.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {userDetails.user?.status ? 'Active' : 'Inactive'}
                    </span>
                  }
                />
                <DetailCard
                  icon={PhoneIcon}
                  title="Mobile"
                  value={userDetails.user?.mobile}
                />
                <DetailCard
                  icon={MapPinIcon}
                  title="Location"
                  value={`${userDetails.user?.state?.name || 'State'}, ${
                    userDetails.user?.district?.name || 'District'
                  }`}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex border-b dark:border-gray-700 mb-6">
                {['purchases', 'payments', 'changePassword'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 font-medium ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tab === 'changePassword'
                      ? 'Change Password'
                      : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div>{tabContent}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }, [activeTab, userDetails, tabContent, modalVariants]);

  const loadUserDetails = useCallback((userId: string) => {
    setSelectedUser(userId);
  }, []);

  return (
    <div className="space-y-8 min-h-screen">
      <DataManager
        title="User Management"
        itemName="User"
        endpoints={{
          list: '/users',
        }}
        validationSchema={Yup.object()}
        formFields={[]}
        tableColumns={[
          {
            header: 'User',
            accessor: 'name',
            sortable: true,
            render: (value, item) => (
              <UserAvatar name={value} image={item.image} />
            ),
          },
          {
            header: 'Email',
            accessor: 'email',
            sortable: true,
          },
          {
            header: 'Mobile',
            accessor: 'mobile',
            sortable: true,
          },
          {
            header: 'State',
            accessor: 'stateName',
            sortable: true,
            render: (value) => value || '-',
          },
          {
            header: 'District',
            accessor: 'districtName',
            sortable: true,
            render: (value) => value || '-',
          },
          {
            header: 'Status',
            accessor: 'status',
            sortable: true,
            render: (value) => (
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  value
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {value ? 'Active' : 'Inactive'}
              </span>
            ),
          },
          {
            header: 'Registered On',
            accessor: 'createdAt',
            sortable: true,
            render: (value: any) =>
              new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
          },
          {
            header: 'Actions',
            accessor: 'actions',
            render: (_, item) => (
              <button
                onClick={() => loadUserDetails(item._id)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </button>
            ),
          },
        ]}
        initialFormValues={{}}
        showPagination={true}
        showAdd={false}
        showEdit={false}
        showDelete={false}
      />

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 !m-0 flex items-center justify-center z-[98654]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <AnimatePresence>{isModalOpen && UserDetailModal}</AnimatePresence>
    </div>
  );
};

export default Users;
