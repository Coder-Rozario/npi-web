import AdminDepartmentLayout from "./AdminDepartmentLayout";

const Admin_Food_Technology = () => (
  <AdminDepartmentLayout
    apiUrl="/fooddepartment"
    updateContentUrl="/foodupdate-content"
    updateCourseUrl="/foodupdate-course-overview"
    uploadImageUrl="/foodupload-hero-image"
    departmentTitle="Food"
  />
);

export default Admin_Food_Technology;
