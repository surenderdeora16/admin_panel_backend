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
              <PageTitle title="eCommerce Dashboard | TailAdmin - Tailwind CSS Admin Dashboard Template" />
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
              <PageTitle title="Profile | TailAdmin - Tailwind CSS Admin Dashboard Template" />
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
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Tables />
            </>
          }
        />
        <Route
          path="/app-banner"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <AppBanner />
            </>
          }
        />
        <Route
          path="/upcoming-govt-exam"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <UpcomingGovtExam />
            </>
          }
        />

        <Route
          path="/exam-library/subjects"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Subjects />
            </>
          }
        />
        <Route
          path="/exam-library/chapters"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Chapters />
            </>
          }
        />
        <Route
          path="/exam-library/topics"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Topics />
            </>
          }
        />
        <Route
          path="/exam-library/topics/manage-questions/:subjectId/:chapterId/:topicId"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Questions />
            </>
          }
        />
        <Route
          path="/exam-library/questions/manageTestSeries"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <ManageTestSeries />
            </>
          }
        />
        <Route
          path="/exam-library/questions/testSeriesQuestions"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <TestSeriesQuestions />
            </>
          }
        />

        {/*  */}
        <Route
          path="/batches"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Batches />
            </>
          }
        />

        <Route
          path="/exam-plans"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <ExamPlans />
            </>
          }
        />
        <Route
          path="/exam-plans/:batchId"
          element={
              <ExamPlans />
          }
        />
        <Route
          path="/test-series"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
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
                <Route path=":testSeriesId/questions" element={<TestSeriesQuestions />} />
              </Routes>
          }
        />


<Route
          path="/notes"
          element={
              <Notes />
          }
        />
        <Route
          path="/notes/:subjectId"
          element={
              <Notes />
          }
        />

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
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <State />
            </>
          }
        />
        <Route
          path="/district"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
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
          <Route path="general-setting" element={<GeneralSettings />} />
          <Route path="sms-service" element={<SMSSettings />} />
          <Route path="email-service" element={<EmailSettings />} />
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
