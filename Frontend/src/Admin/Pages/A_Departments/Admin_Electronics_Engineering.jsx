import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Electronics_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/electrodepartment"
    updateContentUrl="/electroupdate-content"
    updateCourseUrl="/electroupdate-course-overview"
    uploadImageUrl="/electroupload-hero-image"
    departmentTitle="Electronics"
  />
);

export default Admin_Electronics_Engineering;
