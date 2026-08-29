import Admin_BottomPhotos from "../../Admin_Components/Admin_Gallery/Admin_buttomPhoto";
import Admin_Images from "../../Admin_Components/Admin_Gallery/Admin_images";
import Admin_video from "../../Admin_Components/Admin_Gallery/Admin_video";

const Admin_Gallery = () => {
    return (
        <div>
            <Admin_Images/>
            <Admin_video/>
            <Admin_BottomPhotos/>
        </div>
    );
};

export default Admin_Gallery;
