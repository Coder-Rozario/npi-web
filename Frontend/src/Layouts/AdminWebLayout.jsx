import { Outlet } from "react-router-dom";
import Admin_Web_Navbar from "../Admin/Admin_Components/Admin_Nav/Admin_Web_Nav";
import Back_Header from "../Admin/Admin_Components/Home/Admin_Header";

const AdminWebLayout = () => {
    return (
        <div className="Admin_Web_Layout">
        <Back_Header />
        <Admin_Web_Navbar/>
        <Outlet/>

        </div>
    );
};

export default AdminWebLayout;
