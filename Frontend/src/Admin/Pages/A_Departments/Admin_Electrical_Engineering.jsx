import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Electrical_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/elecdepartment"
    updateContentUrl="/elecupdate-content"
    updateCourseUrl="/elecupdate-course-overview"
    uploadImageUrl="/elecupload-hero-image"
    departmentTitle="Electrical"
  />
);

export default Admin_Electrical_Engineering;
