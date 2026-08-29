import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Architecture_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/arcdepartment"
    updateContentUrl="/arcupdate-content"
    updateCourseUrl="/arcupdate-course-overview"
    uploadImageUrl="/arcupload-hero-image"
    departmentTitle="Architecture"
  />
);

export default Admin_Architecture_Engineering;
