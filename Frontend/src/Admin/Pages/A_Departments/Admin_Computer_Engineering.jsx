import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Computer_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/cmtdepartment"
    updateContentUrl="/cmtupdate-content"
    updateCourseUrl="/cmtupdate-course-overview"
    uploadImageUrl="/cmtupload-hero-image"
    departmentTitle="Computer"
  />
);

export default Admin_Computer_Engineering;
