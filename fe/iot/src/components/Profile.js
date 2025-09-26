import "../scss/Profile.scss";
import { useState, useEffect } from "react";
const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  // Load data từ localStorage hoặc dùng giá trị mặc định
  const getInitialProfile = () => {
    const savedProfile = localStorage.getItem("studentProfile");
    return savedProfile
      ? JSON.parse(savedProfile)
      : {
          name: "Nguyễn Văn A",
          studentId: "B20DCCN001",
          github: "https://github.com/username",
          reportPdf: "/reports/report.pdf",
          postmant: "https://www.postman.com/workspace",
        };
  };
  const getInitialAvatar = () => {
    const savedAvatar = localStorage.getItem("studentAvatar");
    return savedAvatar || "/avatars/default-avatar.jpg";
  };

  const [profile, setProfile] = useState(getInitialProfile);
  const [avatar, setAvatar] = useState(getInitialAvatar);
  const [newReportFile, setNewReportFile] = useState(null);

  // Lưu data vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    localStorage.setItem("studentProfile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("studentAvatar", avatar);
  }, [avatar]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setNewReportFile(null);
  };

  const handleSave = () => {
    if (newReportFile) {
      const newReportUrl = URL.createObjectURL(newReportFile);
      const updatedProfile = { ...profile, reportPdf: newReportUrl };
      setProfile(updatedProfile);
    }
    setIsEditing(false);
  };

  const handleAvatarChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newAvatar = event.target.result; // Lấy base64 string
          setAvatar(newAvatar);
          localStorage.setItem("studentAvatar", newAvatar); // Lưu base64 vào localStorage
        };
        reader.readAsDataURL(file); // Đọc file thành base64
      }
    };
    input.click();
  };

  const handleReportChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setNewReportFile(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleViewReport = () => {
    window.open(profile.reportPdf);
  };

  const handleDownloadReport = () => {
    const link = document.createElement("a");
    link.href = profile.reportPdf;
    link.download = "bao-cao.pdf";
    link.click();
  };

  return (
    <div className="student-profile-container">
      <div className="profile-content">
        {/* Left Side - Avatar */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img src={avatar} alt="Avatar" className="avatar-image" />
          </div>
          <button className="change-avatar-btn" onClick={handleAvatarChange}>
            Đổi ảnh
          </button>
        </div>

        {/* Right Side - Information */}
        <div className="info-section">
          <div className="info-item">
            <label>Tên:</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="edit-input"
              />
            ) : (
              <span>{profile.name}</span>
            )}
          </div>

          <div className="info-item">
            <label>Mã sinh viên:</label>
            {isEditing ? (
              <input
                type="text"
                name="studentId"
                value={profile.studentId}
                onChange={handleInputChange}
                className="edit-input"
              />
            ) : (
              <span>{profile.studentId}</span>
            )}
          </div>

          <div className="info-item">
            <label>GitHub:</label>
            {isEditing ? (
              <input
                type="url"
                name="github"
                value={profile.github}
                onChange={handleInputChange}
                className="edit-input"
              />
            ) : (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.github}
              </a>
            )}
          </div>

          <div className="info-item">
            <label>PDF Báo cáo:</label>
            {isEditing ? (
              <div className="report-upload">
                <label htmlFor="pdf-upload" className="file-upload-btn">
                  Chọn file PDF
                </label>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleReportChange}
                  className="file-input"
                />
                {newReportFile && (
                  <span className="file-name" title={newReportFile.name}>
                    {newReportFile.name.length > 20
                      ? `${newReportFile.name.substring(0, 20)}...`
                      : newReportFile.name}
                  </span>
                )}
              </div>
            ) : (
              <div className="report-display">
                <div className="file-icon">📄</div>
                <div className="report-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={handleViewReport}
                  >
                    View
                  </button>
                  <button
                    className="action-btn download-btn"
                    onClick={handleDownloadReport}
                  >
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="info-item">
            <label>Postman:</label>
            {isEditing ? (
              <input
                type="url"
                name="postmant"
                value={profile.postmant}
                onChange={handleInputChange}
                className="edit-input"
              />
            ) : (
              <a
                href={profile.postmant}
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.postmant}
              </a>
            )}
          </div>

          <div className="action-buttons">
            {isEditing ? (
              <button className="save-btn" onClick={handleSave}>
                Lưu
              </button>
            ) : (
              <button className="edit-btn" onClick={handleEditToggle}>
                Fix
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
