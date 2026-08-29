import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Automobile_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/autodepartment"
    updateContentUrl="/autoupdate-content"
    updateCourseUrl="/autoupdate-course-overview"
    uploadImageUrl="/autoupload-hero-image"
    departmentTitle="Automobile"
  />
);

export default Admin_Automobile_Engineering;
