import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Mechanical_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/mecdepartment"
    updateContentUrl="/mecupdate-content"
    updateCourseUrl="/mecupdate-course-overview"
    uploadImageUrl="/mecupload-hero-image"
    departmentTitle="Mechanical"
  />
);

export default Admin_Mechanical_Engineering;
