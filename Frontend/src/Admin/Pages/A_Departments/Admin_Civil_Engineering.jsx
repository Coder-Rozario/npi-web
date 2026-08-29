import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Civil_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/civdepartment"
    updateContentUrl="/civupdate-content"
    updateCourseUrl="/civupdate-course-overview"
    uploadImageUrl="/civupload-hero-image"
    departmentTitle="Civil"
  />
);

export default Admin_Civil_Engineering;
