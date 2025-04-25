'use client';

import { useState, useEffect } from 'react';
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
import AxiosHelper from '../../helper/AxiosHelper';
import DataManager from '../../components/DataManager';

const Users = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'purchases' | 'payments'>(
    'purchases',
  );

  const loadUserDetails = async (userId: string) => {
    try {
      const response = await AxiosHelper.getData(`users/${userId}`);
      console.log('response.data.data', response.data.data);
      setUserDetails(response.data.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const UserAvatar = ({ name, image }: { name: string; image: string }) => (
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
  );

  const DetailCard = ({ icon: Icon, title, value }: any) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center gap-4"
    >
      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    </motion.div>
  );

  const UserDetailModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: '214748364' }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
    ></motion.div>
  );

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
            accessor: 'state.name',
            sortable: true,
            render: (value) => value || 'State',
          },
          {
            header: 'District',
            accessor: 'district.name',
            sortable: true,
            render: (value) => value || 'District',
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

      {/* {selectedUser && <UserDetailModal />} */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: '214748364' }}
            className="h-full fixed inset-0 -top-8 bg-black/50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="lg:col-span-1 space-y-6">
                  <UserAvatar
                    name={userDetails?.user?.name}
                    image={userDetails?.user?.image}
                  />

                  <div className="space-y-4">
                    <DetailCard
                      icon={CheckBadgeIcon}
                      title="Status"
                      value={
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            userDetails?.user?.status
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {userDetails?.user?.status ? 'Active' : 'Inactive'}
                        </span>
                      }
                    />
                    <DetailCard
                      icon={PhoneIcon}
                      title="Mobile"
                      value={userDetails?.user?.mobile}
                    />
                    <DetailCard
                      icon={MapPinIcon}
                      title="Location"
                      value={`${userDetails?.user?.state?.name || 'State'}, ${
                        userDetails?.user?.district?.name || 'District'
                      }`}
                    />
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="flex border-b dark:border-gray-700 mb-6">
                    {['purchases', 'payments'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 font-medium ${
                          activeTab === tab
                            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'purchases' && (
                    <div className="space-y-4">
                      {userDetails?.purchases?.map((purchase: any) => (
                        <div
                          key={purchase._id}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {purchase.itemId?.title ||
                                  purchase.itemId?.name}
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
                      {!userDetails?.purchases?.length && (
                        <div className="text-center text-gray-500 py-6">
                          No purchases found
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'payments' && (
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
                          {userDetails?.payments?.map((payment: any) => (
                            <tr
                              key={payment._id}
                              className="border-b dark:border-gray-700"
                            >
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
                                {new Date(
                                  payment.createdAt,
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 capitalize">
                                {payment.method}
                              </td>
                            </tr>
                          ))}
                          {!userDetails?.payments?.length && (
                            <tr>
                              <td
                                colSpan={4}
                                className="text-center text-gray-500 py-6"
                              >
                                No payments found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
