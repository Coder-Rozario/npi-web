import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Textile_Engineering = () => (
  <AdminDepartmentLayout
    apiUrl="/textiledepartment"
    updateContentUrl="/textileupdate-content"
    updateCourseUrl="/textileupdate-course-overview"
    uploadImageUrl="/textileupload-hero-image"
    departmentTitle="Textile"
  />
);

export default Admin_Textile_Engineering;
