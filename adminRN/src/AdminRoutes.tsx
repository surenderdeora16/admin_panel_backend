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
import State from './pages/location/state';
import District from './pages/location/District';
import AppBanner from './pages/AppBanner';
import UpcomingGovtExam from './pages/UpcomingGovtExam';
import Subjects from './pages/ExamLibrary/pages/Subjects';
import Chapters from './pages/ExamLibrary/pages/Chapters';
import Topics from './pages/ExamLibrary/pages/Topics';
import Questions from './pages/ExamLibrary/pages/Questions';
import ManageTestSeries from './pages/ExamLibrary/ManageTestSeries';
// import TestSeriesQuestions from './pages/ExamLibrary/TestSeriesQuestions';
import TestSeriesQuestions from './pages/Exams/TestSeriesQuestions';
import Batches from './pages/Exams/Batches';
import ExamPlans from './pages/Exams/ExamPlans';
import TestSeries from './pages/Exams/TestSeries';
import TestSeriesSections from './pages/Exams/TestSeriesSections';
import SectionQuestions from './pages/Exams/SectionQuestions';
import Notes from './pages/notes/Notes';
import Coupons from './pages/coupon/Coupons';
import Users from './pages/User/Users';
import PaymentLogs from './pages/PaymentLogs';
import UserDetail from './pages/User/UserDetail';
import DynamicContent from './pages/DynamicContent';

// import SubjectsPage from './pages/ExamLibrary/vercel/subjects/page';

// import SubjectsPage from './pages/ExamLibrary/SubjectsPage';
// import ChaptersPage from './pages/ExamLibrary/ChaptersPage';
// import TopicsPage from './pages/ExamLibrary/TopicsPage';
// import QuestionsPage from './pages/ExamLibrary/QuestionsPage';

function App() {
  return (
    <AdminLayout>
      <Routes>
        <Route
          index
          element={
            <>
              <PageTitle title="Gnkco" />
              <ECommerce />
            </>
          }
        />
        {/* <Route
                    path="/calendar"
                    element={
                        <>
                            <PageTitle title="Calendar | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <Calendar />
                        </>
                    }
                /> */}
        <Route
          path="/profile"
          element={
            <>
              <PageTitle title="Gnkco" />
              <Profile />
            </>
          }
        />
        {/* <Route
                    path="/forms/form-elements"
                    element={
                        <>
                            <PageTitle title="Form Elements | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <FormElements />
                        </>
                    }
                /> */}
        {/* <Route
                    path="/forms/form-layout"
                    element={
                        <>
                            <PageTitle title="Form Layout | TailAdmin - Tailwind CSS Admin Dashboard Template" />
                            <FormLayout />
                        </>
                    }
                /> */}
        <Route
          path="/tables"
          element={
            <>
              <PageTitle title="Gnkco" />
              <Tables />
            </>
          }
        />
        <Route
          path="/app-banner"
          element={
            <>
              <PageTitle title="Gnkco" />
              <AppBanner />
            </>
          }
        />
         <Route
          path="/policy"
          element={
            <>
              <PageTitle title="Gnkco" />
              <DynamicContent />
            </>
          }
        />
        <Route
          path="/upcoming-govt-exam"
          element={
            <>
              <PageTitle title="Gnkco" />
              <UpcomingGovtExam />
            </>
          }
        />

        <Route
          path="/exam-library/subjects"
          element={
            <>
              <PageTitle title="Gnkco" />
              <Subjects />
            </>
          }
        />
        <Route
          path="/exam-library/chapters"
          element={
            <>
              <PageTitle title="Gnkco" />
              <Chapters />
            </>
          }
        />
        <Route
          path="/exam-library/topics"
          element={
            <>
              <PageTitle title="Gnkco" />
              <Topics />
            </>
          }
        />
        <Route
          path="/exam-library/topics/manage-questions/:subjectId/:chapterId/:topicId"
          element={
            <>
              <PageTitle title="Gnkco" />
              <Questions />
            </>
          }
        />
        <Route
          path="/exam-library/questions/manageTestSeries"
          element={
            <>
              <PageTitle title="Gnkco" />
              <ManageTestSeries />
            </>
          }
        />
        <Route
          path="/exam-library/questions/testSeriesQuestions"
          element={
            <>
              <PageTitle title="Gnkco" />
              <TestSeriesQuestions />
            </>
          }
        />

        {/*  */}
        <Route
          path="/batches"
          element={
            <>
              <PageTitle title="Gnkco" />
              <Batches />
            </>
          }
        />

        <Route
          path="/exam-plans"
          element={
            <>
              <PageTitle title="Gnkco" />
              <ExamPlans />
            </>
          }
        />
        <Route path="/exam-plans/:batchId" element={<ExamPlans />} />
        <Route
          path="/test-series"
          element={
            <>
              <PageTitle title="Gnkco" />
              <TestSeries />
            </>
          }
        />
        <Route
          path="/test-series/*"
          element={
            <Routes>
              <Route path=":examPlanId" element={<TestSeries />} />
              <Route
                path=":testSeriesId/sections"
                element={<TestSeriesSections />}
              />
              <Route
                path=":testSeriesId/sections/:sectionId/questions"
                element={<SectionQuestions />}
              />
              <Route
                path=":testSeriesId/questions"
                element={<TestSeriesQuestions />}
              />
            </Routes>
          }
        />

        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:subjectId" element={<Notes />} />


        <Route path="/coupon" element={<Coupons />} />

        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />

        <Route path="/payment-logs" element={<PaymentLogs />} />


        {/* User Routes
        <Route
          path="/notes"
          element={
            <UserLayout>
              <DownloadNotes />
            </UserLayout>
          }
        />
        <Route
          path="/notes/:subjectId"
          element={
            <UserLayout>
              <DownloadNotes />
            </UserLayout>
          }
        /> */}

        {/* ------------- */}
        <Route
          path="/state"
          element={
            <>
              <PageTitle title="Gnkco" />
              <State />
            </>
          }
        />
        <Route
          path="/district"
          element={
            <>
              <PageTitle title="Gnkco" />
              <District />
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
          <Route path="admin-card-and-result" element={<GeneralSettings />} />
          {/* <Route path="sms-service" element={<SMSSettings />} /> */}
          {/* <Route path="email-service" element={<EmailSettings />} /> */}
          <Route path="social-media" element={<SocialMediaSettings />} />
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
