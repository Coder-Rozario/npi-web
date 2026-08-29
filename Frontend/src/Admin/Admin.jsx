import NoticeMarquee from "../Components/Home/NoticeMarque";
import Admin_ButtomPhotos from "./Admin_Components/Admin_Gallery/Admin_buttomPhoto";
import Admin_video from "./Admin_Components/Admin_Gallery/Admin_video";
import Admin_Web_Navbar from "./Admin_Components/Admin_Nav/Admin_Web_Nav";
import Admin_Achivement from "./Admin_Components/Home/Admin_Achivement";
import Admin_Authority from "./Admin_Components/Home/Admin_Authority";
import Admin_CounterSection from "./Admin_Components/Home/Admin_CounterSection";
import Back_Header from "./Admin_Components/Home/Admin_Header";
import Admin_Home_Departments from "./Admin_Components/Home/Admin_Home_Department";
import Admin_Intro from "./Admin_Components/Home/Admin_intro";
import Admin_overview from "./Admin_Components/Home/Admin_overview";
import Admin_RecentNews from "./Admin_Components/Home/Admin_RecentNews";

const Admin = () => {
    return (
        <div className="Admin text-[18px]">
            <Back_Header/>
            <Admin_Web_Navbar/>
            <Admin_Intro/>
            <NoticeMarquee/>
            <Admin_overview/>
            <Admin_Home_Departments/>
            <Admin_CounterSection/>
            <Admin_Authority/>
            <Admin_Achivement/>
            <Admin_video/>
            <Admin_ButtomPhotos/>
            <Admin_RecentNews/>
        </div>
    );
};

export default Admin;
