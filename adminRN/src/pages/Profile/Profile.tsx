import { useState } from 'react';
import { FILE_SIZE, SUPPORTED_FORMATS_IMAGE } from '../../constant/constant';
import { TbShieldLock } from "react-icons/tb";
import { LuUser } from "react-icons/lu";
import { MdOutlineCameraAlt } from "react-icons/md"
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import PersonalInfo from './PersonalInfo'
import AccountSettings from './AccountSettings'
import AxiosHelper from '../../helper/AxiosHelper';
import TabButton from '../../components/TabButton';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateAdmin } from '../../redux/admin/adminSlice';
import { toast } from 'react-toastify';

const Profile = () => {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.admin?.data);
  const [activeTab, setActiveTab] = useState('personal')
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [avatar, setAvatar]= useState("")

  const handleImageUpload = async (file: any) => {
    if (!SUPPORTED_FORMATS_IMAGE.includes(file.type)) {
      toast.error('Unsupported Format.');
    } else if (file.size >= FILE_SIZE) {
      toast.error('Image File is too large.');
    } else {
      setIsImageLoading(true);
      var formData = new FormData();

      formData.append('image', file);
      var { data } = await AxiosHelper.postData("admin/change-profile-image", formData, true);
      if (data?.status === true) {
        dispatch(updateAdmin(data?.data))
        setAvatar(URL.createObjectURL(file))
        toast.success(data?.message);
        setIsImageLoading(false);
      } else {
        toast.error(data?.message);
        setIsImageLoading(false);
      }
    }
  }

  return (
    <>
      <Breadcrumb pageName="Profile" />

      <div className="min-h-screen ">
        <div className="w-full mx-auto py-4 bg-white dark:bg-boxdark rounded-2xl shadow-xl overflow-hidden">
          <div className="relative h-28 bg-gray-100 dark:bg-boxdark">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="relative">
                <img
                  src={avatar || profile?.image}
                  alt="Admin Avatar"
                  className="w-44 h-44 rounded-full object-cover border-4 border-white"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-3 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {!isImageLoading ? (
                    <MdOutlineCameraAlt className="w-5 h-5 text-gray-600" />
                  ) : (
                    <>
                      <div className="flex h-full items-center justify-center bg-white cursor-wait">
                        <div className="h-5 w-5 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                      </div>
                    </>
                  )}
                  <input
                    id='avatar-upload'
                    name='avatar-upload'
                    placeholder='Choose file'
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e: any) => handleImageUpload(e?.target?.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="pt-25 pb-8 px-8 text-black dark:text-white">
            <h1 className="text-3xl font-bold text-center">{profile?.name}</h1>
            <p className="text-center mt-1">Super Admin</p>
            <div className="mt-8 flex justify-center space-x-4">
              <TabButton
                active={activeTab === 'personal'}
                onClick={() => setActiveTab('personal')}
                icon={<LuUser className="w-5 h-5" />}
              >
                Personal Info
              </TabButton>
              <TabButton
                active={activeTab === 'account'}
                onClick={() => setActiveTab('account')}
                icon={<TbShieldLock className="w-5 h-5" />}
              >
                Account Settings
              </TabButton>
            </div>
            <div className="mt-8">
              {activeTab === 'personal' && <PersonalInfo />}
              {activeTab === 'account' && <AccountSettings />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
