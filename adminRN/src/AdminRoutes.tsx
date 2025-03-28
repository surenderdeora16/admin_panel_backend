import { Route, Routes, Navigate } from 'react-router-dom';
import PageTitle from './components/PageTitle';
import AdminLayout from './layout/AdminLayout';
import ECommerce from './pages/Dashboard/ECommerce';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile/Profile';
import FormElements from './pages/Form/FormElements';
import FormLayout from './pages/Form/FormLayout';
import Chart from './pages/Chart';
import Tables from './pages/Tables';
import Alerts from './pages/UiElements/Alerts';
import Buttons from './pages/UiElements/Buttons';

// Import our new settings components
import SettingsPanel from './pages/Setting/SettingsPanel';
import GeneralSettings from './pages/Setting/GeneralSettings';
import SMSSettings from './pages/Setting/SMSSettings';
import EmailSettings from './pages/Setting/EmailSettings';
import SocialMediaSettings from './pages/Setting/SocialMediaSettings';

function App() {
    return (
        <AdminLayout>
            <Routes>
                <Route
                    index
                    element={
                        <>
                            <PageTitle title="eCommerce Dashboard | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <ECommerce />
                        </>
                    }
                />
                <Route
                    path="/calendar"
                    element={
                        <>
                            <PageTitle title="Calendar | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <Calendar />
                        </>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <>
                            <PageTitle title="Profile | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <Profile />
                        </>
                    }
                />
                <Route
                    path="/forms/form-elements"
                    element={
                        <>
                            <PageTitle title="Form Elements | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <FormElements />
                        </>
                    }
                />
                <Route
                    path="/forms/form-layout"
                    element={
                        <>
                            <PageTitle title="Form Layout | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <FormLayout />
                        </>
                    }
                />
                <Route
                    path="/tables"
                    element={
                        <>
                            <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <Tables />
                        </>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <>
                            <PageTitle title="Settings | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <SettingsPanel />
                        </>
                    }
                >
                    <Route
                        path="general-setting"
                        element={<GeneralSettings />}
                    />
                    <Route
                        path="sms-service"
                        element={<SMSSettings />}
                    />
                    <Route
                        path="email-service"
                        element={<EmailSettings />}
                    />
                    <Route
                        path="social-media"
                        element={<SocialMediaSettings />}
                    />
                </Route>
                <Route
                    path="/chart"
                    element={
                        <>
                            <PageTitle title="Basic Chart | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <Chart />
                        </>
                    }
                />
                <Route
                    path="/ui/alerts"
                    element={
                        <>
                            <PageTitle title="Alerts | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <Alerts />
                        </>
                    }
                />
                <Route
                    path="/ui/buttons"
                    element={
                        <>
                            <PageTitle title="Buttons | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <Buttons />
                        </>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AdminLayout>
    );
}

export default App;

