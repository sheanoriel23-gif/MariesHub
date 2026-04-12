import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("status", "approved")
        .order("academic_level", { ascending: true })
        .order("section", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching approved students:", error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error("Unexpected error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const academicLevels = useMemo(() => {
    const levels = students
      .map((student) => student.academic_level)
      .filter(Boolean);

    return [...new Set(levels)];
  }, [students]);

  const sections = useMemo(() => {
    const values = students
      .map((student) => student.section)
      .filter(Boolean);

    return [...new Set(values)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const studentName =
        student.full_name ||
        student.name ||
        `${student.first_name || ""} ${student.last_name || ""}`.trim();

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        (studentName || "").toLowerCase().includes(search) ||
        (student.lrn || "").toLowerCase().includes(search);

      const matchesLevel =
        levelFilter === "all" || student.academic_level === levelFilter;

      const matchesSection =
        sectionFilter === "all" || student.section === sectionFilter;

      return matchesSearch && matchesLevel && matchesSection;
    });
  }, [students, searchTerm, levelFilter, sectionFilter]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Students</h1>
        <p>View approved students only</p>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by student name or LRN"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search"
        />

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Academic Levels</option>
          {academicLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Sections</option>
          {sections.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <p>Loading approved students...</p>
        ) : filteredStudents.length === 0 ? (
          <p>No approved students found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>LRN</th>
                <th>Academic Level</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => {
                const studentName =
                  student.full_name ||
                  student.name ||
                  `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                  "-";

                return (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{studentName}</td>
                    <td>{student.lrn || "-"}</td>
                    <td>{student.academic_level || "-"}</td>
                    <td>{student.section || "-"}</td>
                    <td>
                      <span
                        className={`status-badge status-${
                          student.status || "pending"
                        }`}
                      >
                        {student.status === "approved"
                          ? "Approved"
                          : student.status || "-"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}