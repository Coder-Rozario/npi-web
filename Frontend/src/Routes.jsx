import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import MainLayouts from "./Layouts/MainLayouts";
import Adminlayout from "./Layouts/AdminLayout";
import Loading from "./Components/Loading/Loading";

const About = lazy(() => import("./Pages/About/About"));
const Home = lazy(() => import("./Pages/Home/Home"));
const Contacts = lazy(() => import("./Pages/Contacts/Contacts"));
const Departments = lazy(() => import("./Pages/Departments/Departments"));
const Academic = lazy(() => import("./Pages/Academic/Academic"));
const Gallery = lazy(() => import("./Pages/Gallery/Gallery"));
const Notice = lazy(() => import("./Pages/Notice/Notice"));

const Activities = lazy(() => import("./Components/Home/Campus_Activities"));
const Authority = lazy(() => import("./Components/Home/Authority"));
const TeacherDetail = lazy(() => import("./Components/Home/TeacherDetail"));
const Profile = lazy(() => import("./Pages/About/Profile"));
const Our_Dream = lazy(() => import("./Pages/About/Our_Dream"));
const Concession_for_students = lazy(() => import("./Pages/About/Concession_for_students"));
const Controlling_Authority = lazy(() => import("./Pages/About/Controlling_Authority"));
const Short_Breif_of_Institute = lazy(() => import("./Pages/About/Short_Breif_of_Institute"));
const Architecture_Engineering = lazy(() => import("./Pages/Departments/Architecture_Engineering"));
const Automobile_Engineering = lazy(() => import("./Pages/Departments/Automobile_Engineering"));
const Civil_Engineering = lazy(() => import("./Pages/Departments/Civil_Engineering"));
const Computer_Engineering = lazy(() => import("./Pages/Departments/Computer_Engineering"));
const Electrical_Engineering = lazy(() => import("./Pages/Departments/Electrical_Engineering"));
const Electronics_Engineering = lazy(() => import("./Pages/Departments/Electronics_Engineering"));
const Mechanical_Engineering = lazy(() => import("./Pages/Departments/Mechanical_Engineering"));
const Food_Technology = lazy(() => import("./Pages/Departments/Food_Technology"));
const Textile_Engineering = lazy(() => import("./Pages/Departments/Textile_Engineering"));
const Dhaka_Campus = lazy(() => import("./Pages/Academic/Dhaka_Campus"));
const Faridpur_Campus = lazy(() => import("./Pages/Academic/Faridpur_Campus"));
const Sonargaon_Campus = lazy(() => import("./Pages/Academic/Sonargaon_Campus"));
const Manikganj_Campus = lazy(() => import("./Pages/Academic/Manikganj_Campus"));

const Teacher_and_Staff = lazy(() => import("./Pages/Teacher & S/Teacher_and_Staff"));
const Teachers = lazy(() => import("./Pages/Teacher & S/Teachers"));
const Staff = lazy(() => import("./Pages/Teacher & S/Staff"));

const Online_Admission = lazy(() => import("./Pages/Admission/Online_Admission"));
const Images = lazy(() => import("./Pages/Gallery/Images"));
const PhotoGallery = lazy(() => import("./Pages/Gallery/PhotoGallery"));

import ProtectedRoute from "./Admin/Admin_Components/Login_compo/ProtectedRoute";
import ErrorFallback from "./ErrorFallback";
import Admission_from from "./Admin/Pages/A_Admission/Admission_from";
const Admin = lazy(() => import("./Admin/Admin"));
const Login = lazy(() => import("./Admin/Pages/Login/Login"));
const Admin_Notie = lazy(() => import("./Admin/Pages/Back_Notice/Admin_Notie"));
const Messages = lazy(() => import("./Admin/Pages/Messages/Messages"));
const Online_Admission_Admin = lazy(() => import("./Admin/Pages/Online_Admission/Online_Admission_Admin"));
const AccountSettings = lazy(() => import("./Admin/Admin_Components/Login_compo/AccountSettings"));
const All_Notice = lazy(() => import("./Admin/Pages/Back_Notice/All_Notice"));
const AdminWebLayout = lazy(() => import("./Layouts/AdminWebLayout"));
const Admin_Concession_for_students = lazy(() => import("./Admin/Pages/Admin_About/Admin_Concession_for_students"));
const Admin_Gallery = lazy(() => import("./Admin/Pages/A_Gallery/Admin_Gallery"));
const Admin_Images = lazy(() => import("./Admin/Admin_Components/Admin_Gallery/Admin_images"));
const Admin_video = lazy(() => import("./Admin/Admin_Components/Admin_Gallery/Admin_video"));
const Admin_PhotoGallery = lazy(() => import("./Admin/Admin_Components/Admin_Gallery/Admin_PhotoGallery"));
const Admin_Contacts = lazy(() => import("./Admin/Pages/A_Contacts/Admin_Contacts"));
const Admin_Banners = lazy(() => import("./Admin/Pages/Admin_Banners/Admin_Banners"));
const Admin_Teachers = lazy(() => import("./Admin/Pages/A_Teachers&Staff/Amdin_Teachers"));
const Admin_Staff = lazy(() => import("./Admin/Pages/A_Teachers&Staff/Admin_Staff"));
const Admin_Profile = lazy(() => import("./Admin/Pages/Admin_About/Admin_Profile"));
const Admin_Our_Dream = lazy(() => import("./Admin/Pages/Admin_About/Admin_Our_Dream"));
const Admin_Controlling_Authority = lazy(() => import("./Admin/Pages/Admin_About/Admin_Controlling_Authority"));
const Admin_Short_Breif_of_Institute = lazy(() => import("./Admin/Pages/Admin_About/Admin_Short_Breif_of_Institute"));
const Admin_Dhaka_Campus = lazy(() => import("./Admin/Pages/A_Academic/Admin_Dhaka_Campus"));
const Admin_Faridpur_Campus = lazy(() => import("./Admin/Pages/A_Academic/Admin_Faridpur_Campus"));
const Admin_Manikganj_Campus = lazy(() => import("./Admin/Pages/A_Academic/Admin_Manikganj_Campus"));
const BNIST_Sonargaon_Campus = lazy(() => import("./Admin/Pages/A_Academic/BNIST_Sonargaon_Campus"));
const Admin_Architecture_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Architecture_Engineering"));
const FeedbackForm = lazy(() => import("./Pages/Student Feedback/FeedbackForm"));
const Admin_Automobile_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Automobile_Engineering"));
const Admin_Civil_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Civil_Engineering"));
const Admin_Computer_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Computer_Engineering"));
const Admin_Electrical_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Electrical_Engineering"));
const Admin_Electronics_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Electronics_Engineering"));
const Admin_Mechanical_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Mechanical_Engineering"));
const Admin_Food_Technology = lazy(() => import("./Admin/Pages/A_Departments/Admin_Food_Technology"));
const Admin_Textile_Engineering = lazy(() => import("./Admin/Pages/A_Departments/Admin_Textile_Engineering"));
const Admin_Student_Feedback = lazy(() => import("./Admin/Admin_Feedback/Admin_Student_Feedback"));
const Admin_Parents_Feedback = lazy(() => import("./Admin/Admin_Feedback/Admin_Parents_Feedback"));
const P_FeedbackForm = lazy(() => import("./Pages/parents Feedback/P_FeedbackForm"));
const Admin_Authority_details = lazy(() => import("./Admin/Admin_Components/Home/Admin_Authority_details"));
const A_Academic = lazy(() => import("./Admin/Pages/A_Academic/A_Academic"));
const Admin_About = lazy(() => import("./Admin/Pages/Admin_About/Admin_About"));
const Admin_Departments = lazy(() => import("./Admin/Pages/A_Departments/Admin_Departments"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayouts />,
    errorElement: <ErrorFallback />,
    children: [
      { path: "/", element: <Suspense fallback={<Loading />}> <Home /> </Suspense> },

      { path: "Authority", element: <Suspense fallback={<Loading />}> <Authority /> </Suspense> },
      { path: "Authority/:id", element: <Suspense fallback={<Loading />}> <TeacherDetail /> </Suspense> },

      { path: "About", element: <Suspense fallback={<Loading />}> <About /> </Suspense> },
      { path: "Profile", element: <Suspense fallback={<Loading />}> <Profile /> </Suspense> },
      { path: "Our_Dream", element: <Suspense fallback={<Loading />}> <Our_Dream /> </Suspense> },
      { path: "Concession_for_students", element: <Suspense fallback={<Loading />}> <Concession_for_students /> </Suspense> },
      { path: "Controlling_Authority", element: <Suspense fallback={<Loading />}> <Controlling_Authority /> </Suspense> },
      { path: "Short_Breif_of_Institute", element: <Suspense fallback={<Loading />}> <Short_Breif_of_Institute /> </Suspense> },

      { path: "Departments", element: <Suspense fallback={<Loading />}> <Departments /> </Suspense> },
      { path: "Architecture_Engineering", element: <Suspense fallback={<Loading />}> <Architecture_Engineering /> </Suspense> },
      { path: "Automobile_Engineering", element: <Suspense fallback={<Loading />}> <Automobile_Engineering /> </Suspense> },
      { path: "Civil_Engineering", element: <Suspense fallback={<Loading />}> <Civil_Engineering /> </Suspense> },
      { path: "Computer_Engineering", element: <Suspense fallback={<Loading />}> <Computer_Engineering /> </Suspense> },
      { path: "Electrical_Engineering", element: <Suspense fallback={<Loading />}> <Electrical_Engineering /> </Suspense> },
      { path: "Electronics_Engineering", element: <Suspense fallback={<Loading />}> <Electronics_Engineering /> </Suspense> },
      { path: "Mechanical_Engineering", element: <Suspense fallback={<Loading />}> <Mechanical_Engineering /> </Suspense> },
      { path: "Food_Technology", element: <Suspense fallback={<Loading />}> <Food_Technology /> </Suspense> },
      { path: "Textile_Engineering", element: <Suspense fallback={<Loading />}> <Textile_Engineering /> </Suspense> },

      { path: "Academic", element: <Suspense fallback={<Loading />}> <Academic /> </Suspense> },
      { path: "Dhaka_Campus", element: <Suspense fallback={<Loading />}> <Dhaka_Campus /> </Suspense> },
      { path: "Faridpur_Campus", element: <Suspense fallback={<Loading />}> <Faridpur_Campus /> </Suspense> },
      { path: "Manikganj_Campus", element: <Suspense fallback={<Loading />}> <Manikganj_Campus /> </Suspense> },
      { path: "Sonargaon_Campus", element: <Suspense fallback={<Loading />}> <Sonargaon_Campus /> </Suspense> },

      { path: "Teachers", element: <Suspense fallback={<Loading />}> <Teachers /> </Suspense> },
      { path: "Staff", element: <Suspense fallback={<Loading />}> <Staff /> </Suspense> },
      { path: "Teacher&Staff", element: <Suspense fallback={<Loading />}> <Teacher_and_Staff /> </Suspense> },

      { path: "Online_Admission", element: <Suspense fallback={<Loading />}> <Online_Admission /> </Suspense> },

      { path: "Notice", element: <Suspense fallback={<Loading />}> <Notice /> </Suspense> },

      { path: "Gallery", element: <Suspense fallback={<Loading />}> <Gallery /> </Suspense> },
      { path: "Images", element: <Suspense fallback={<Loading />}> <Images /> </Suspense> },
      { path: "PhotoGallery", element: <Suspense fallback={<Loading />}> <PhotoGallery /> </Suspense> },
      { path: "Activities", element: <Suspense fallback={<Loading />}> <Activities /> </Suspense> },

      { path: "Contacts", element: <Suspense fallback={<Loading />}> <Contacts /> </Suspense> },

      { path: "Student_Feedback_Form", element: <Suspense fallback={<Loading />}> <FeedbackForm /> </Suspense> },
      { path: "Parants_Feedback_Form", element: <Suspense fallback={<Loading />}> <P_FeedbackForm /> </Suspense> },
    ],
  },
  {
    path: "/Admin",
    element: (
      <ProtectedRoute>
        <Adminlayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorFallback />,
    children: [
      { index: true, element: <Suspense fallback={<Loading />}> <Admin /> </Suspense> },
      { path: "Admin_Notie", element: <Suspense fallback={<Loading />}> <Admin_Notie /> </Suspense> },
      { path: "Messages", element: <Suspense fallback={<Loading />}> <Messages /> </Suspense> },
      { path: "All_Notice", element: <Suspense fallback={<Loading />}> <All_Notice /> </Suspense> },
      { path: "Admin_Student_Feedback", element: <Suspense fallback={<Loading />}> <Admin_Student_Feedback /> </Suspense> },
      { path: "Admin_Parents_Feedback", element: <Suspense fallback={<Loading />}> <Admin_Parents_Feedback /> </Suspense> },
      { path: "Online_Admission_Admin", element: <Suspense fallback={<Loading />}> <Online_Admission_Admin /> </Suspense> },

      {
        element: <Suspense fallback={<Loading />}> <AdminWebLayout /> </Suspense>, 
        children: [
          { path: "Admin_About", element: <Suspense fallback={<Loading />}> <Admin_About /> </Suspense> },
          { path: "Admin_Academic", element: <Suspense fallback={<Loading />}> <A_Academic /> </Suspense> },
          { path: "Admin_Teachers", element: <Suspense fallback={<Loading />}> <Admin_Teachers /> </Suspense> },

          { path: "Admin_Authority/:id", element: <Suspense fallback={<Loading />}> <Admin_Authority_details /> </Suspense> },
          { path: "Admin_Profile", element: <Suspense fallback={<Loading />}> <Admin_Profile /> </Suspense> },
          { path: "Admin_Our_Dream", element: <Suspense fallback={<Loading />}> <Admin_Our_Dream /> </Suspense> },
          { path: "Admin_Concession_for_students", element: <Suspense fallback={<Loading />}> <Admin_Concession_for_students /> </Suspense> },
          { path: "Admin_Controlling_Authority", element: <Suspense fallback={<Loading />}> <Admin_Controlling_Authority /> </Suspense> },
          { path: "Admin_Short_Breif_of_Institute", element: <Suspense fallback={<Loading />}> <Admin_Short_Breif_of_Institute /> </Suspense> },

          { path: "Admin_Departments", element: <Suspense fallback={<Loading />}> <Admin_Departments /> </Suspense> }, 
          { path: "Admin_Architecture_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Architecture_Engineering /> </Suspense> },
          { path: "Admin_Automobile_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Automobile_Engineering /> </Suspense> },
          { path: "Admin_Civil_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Civil_Engineering /> </Suspense> },
          { path: "Admin_Computer_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Computer_Engineering /> </Suspense> },
          { path: "Admin_Electrical_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Electrical_Engineering /> </Suspense> },
          { path: "Admin_Electronics_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Electronics_Engineering /> </Suspense> },
          { path: "Admin_Mechanical_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Mechanical_Engineering /> </Suspense> },
          { path: "Admin_Food_Technology", element: <Suspense fallback={<Loading />}> <Admin_Food_Technology /> </Suspense> },
          { path: "Admin_Textile_Engineering", element: <Suspense fallback={<Loading />}> <Admin_Textile_Engineering /> </Suspense> },

          { path: "Admin_Dhaka_Campus", element: <Suspense fallback={<Loading />}> <Admin_Dhaka_Campus /> </Suspense> },
          { path: "Admin_Faridpur_Campus", element: <Suspense fallback={<Loading />}> <Admin_Faridpur_Campus /> </Suspense> },
          { path: "Admin_Manikganj_Campus", element: <Suspense fallback={<Loading />}> <Admin_Manikganj_Campus /> </Suspense> },
          { path: "BNIST_Sonargaon_Campus", element: <Suspense fallback={<Loading />}> <BNIST_Sonargaon_Campus /> </Suspense> },
          { path: "Admin_Staff", element: <Suspense fallback={<Loading />}> <Admin_Staff /> </Suspense> },
          { path: "Admin_Gallery", element: <Suspense fallback={<Loading />}> <Admin_Gallery /> </Suspense> },
          { path: "Admin_Photos", element: <Suspense fallback={<Loading />}> <Admin_PhotoGallery /> </Suspense> },
          { path: "Admin_Videos", element: <Suspense fallback={<Loading />}> <Admin_video /> </Suspense> },

          { path: "Admin_Banners", element: <Suspense fallback={<Loading />}> <Admin_Banners /> </Suspense> },

          { path: "Admin_Admission", element: <Suspense fallback={<Loading />}> <Admission_from /> </Suspense> },

          { path: "Admin_Contacts", element: <Suspense fallback={<Loading />}> <Admin_Contacts /> </Suspense> },

        ],
      },
    ],
  },

  { path: "AccountSettings", element: <Suspense fallback={<Loading />}> <AccountSettings /> </Suspense> },
  { path: "/Login", element: <Suspense fallback={<Loading />}> <Login /> </Suspense> },

], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default router;
