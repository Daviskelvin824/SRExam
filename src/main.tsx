import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from "./Views/LoginPage";
import HomePageStudent from "./Views/Home/HomePageStudent";
import ProfilePage from "./Views/ProfilePage";
import HomePageAssistant from "./Views/Home/HomePageAssistant";
import HomePageSubjectDevelopment from "./Views/Home/HomePageSubjectDevelopment";
import HomePageExamCoordinator from "./Views/Home/HomePageExamCoordinator";
import SubjectManagementPage from "./Views/Pages/SubjectManagementPage";
import UserManagementPage from "./Views/Pages/UserManagementPage";
import ExamScheduler from "./Views/Pages/ExamScheduler";
import ViewTransactionPage from "./Views/Pages/ViewTransactionPage";
import TransactionDetail from "./Views/TransactionDetail";
import ViewSchedule from "./Views/Pages/ViewSchedule";
import RoomManagement from "./Views/Pages/RoomManagement";
import ReportManagement from "./Views/Pages/ReportManagement";
import ReportDetail from "./Views/Pages/ReportDetail";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/homepagestudent",
    element: <HomePageStudent />
  },
  {
    path: "/homepageassistant",
    element: <HomePageAssistant />
  },
  {
    path: "/homepagesubdev",
    element: <HomePageSubjectDevelopment />
  },
  {
    path: "/homepageexamcoor",
    element: <HomePageExamCoordinator />
  },
  {
    path: "/profilepage",
    element: <ProfilePage />
  },
  {
    path: "/subjectmanagementpage",
    element: <SubjectManagementPage />
  },
  {
    path: "/usermanagementpage",
    element: <UserManagementPage />
  },
  {
    path: "/examschedulerpage",
    element: <ExamScheduler />
  },
  {
    path: "/viewtransactionpage",
    element: <ViewTransactionPage />
  },
  {
    path: "/transactiondetail/:id", 
    element: <TransactionDetail />
  },
  {
    path: "/viewschedulepage", 
    element: <ViewSchedule />
  },
  {
    path: "/roommanagementpage", 
    element: <RoomManagement />
  },
  {
    path: "/reportmanagementpage", 
    element: <ReportManagement />
  },
  {
    path: "/reportdetailpage/:id", 
    element: <ReportDetail />
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
