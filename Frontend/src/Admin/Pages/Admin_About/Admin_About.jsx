import Admin_Concession_for_students from "./Admin_Concession_for_students";
import Admin_Controlling_Authority from "./Admin_Controlling_Authority";
import Admin_Our_Dream from "./Admin_Our_Dream";
import Admin_Profile from "./Admin_Profile";
import Admin_Short_Breif_of_Institute from "./Admin_Short_Breif_of_Institute";

const Admin_About = () => {
    return (
        <div>
            <Admin_Profile/>
            <Admin_Our_Dream/>
            <Admin_Concession_for_students/>
            <Admin_Controlling_Authority/>
            <Admin_Short_Breif_of_Institute/>

        </div>
    );
};

export default Admin_About;
