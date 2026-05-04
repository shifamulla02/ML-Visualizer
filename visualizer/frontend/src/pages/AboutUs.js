import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const MemberCard = ({ member, colorClass }) => {
  const [photo, setPhoto] = useState(null);

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Uses the uploaded photo if present, otherwise uses the static imagePath provided by the user
  const displayPhoto = photo || member.imagePath;

  return (
    <div className="member-card" data-c={colorClass}>
      <div className="member-photo">
        <input
          className="photo-input"
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
        />
        {!displayPhoto ? (
          <>
            <div className="photo-inner">
              <div className="photo-initials">{member.initials}</div>
              <div className="photo-hint">Photo placeholder</div>
            </div>
            <div className="photo-overlay"><span className="overlay-text">+ Upload Photo</span></div>
          </>
        ) : (
          <>
            <img src={displayPhoto} alt={member.name} />
            <div className="photo-overlay"><span className="overlay-text">Change Photo</span></div>
          </>
        )}
      </div>
      <div className="member-info">
        <div className="member-num">{member.numStr}</div>
        <div className="member-name">{member.name}</div>
        <span className="roll-tag">{member.roll}</span>
      </div>
    </div>
  );
};

export default function AboutUs() {
  const members = [
    { id: 1, colorClass: "lr", initials: "MG", numStr: "Member 01 / 06", name: "Merin George", roll: "Roll No. 1023203", imagePath: "/images/merin.jpeg" },
    { id: 2, colorClass: "dt", initials: "AM", numStr: "Member 02 / 06", name: "Anjali More", roll: "Roll No. 1023207", imagePath: "/images/anjali.jpeg" },
    { id: 3, colorClass: "knn", initials: "SM", numStr: "Member 03 / 06", name: "Shifa Mulla", roll: "Roll No. 1023208", imagePath: "/images/shifa.jpeg" },
    { id: 4, colorClass: "rf", initials: "HN", numStr: "Member 04 / 06", name: "Hilda Nadar", roll: "Roll No. 1023210", imagePath: "/images/hilda.jpeg" },
    { id: 5, colorClass: "lr", initials: "BP", numStr: "Member 05 / 06", name: "Bhumi Padwal", roll: "Roll No. 1023215", imagePath: "/images/bhumi.jpeg" },
    { id: 6, colorClass: "knn", initials: "JR", numStr: "Member 06 / 06", name: "Jenita Rajan", roll: "Roll No. 1023232", imagePath: "/images/jenita.jpeg" }
  ];

  return (
    <div className="about-container">
      <div className="app">
        <Link className="back-link" to="/">Back to Dashboard</Link>

        {/* HEADER */}
        <header>
          <div className="header-left">
            <div className="eyebrow">// about the development team</div>
            <h1>
              <span style={{ color: 'var(--lr)', textShadow: '0 0 30px var(--lr-glow)' }}>ML</span>
              <span> Visualizer —</span><br />
              <span>Meet the</span>
              <span style={{ color: 'var(--knn)', textShadow: '0 0 30px var(--knn-glow)' }}> Team</span>
            </h1>
            <p className="subtitle">The builders behind this interactive machine learning pipeline visualization tool, developed as part of the Full Stack Development Laboratory at FCRIT.</p>
          </div>
          <div className="badge-row">
            <span className="badge lr">Linear Regression</span>
            <span className="badge knn">KNN</span>
            <span className="badge dt">Decision Tree</span>
            <span className="badge rf">Random Forest</span>
          </div>
        </header>

        {/* 01 INSTITUTION */}
        <div className="section-label">01 &nbsp; Institution</div>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <span className="card-title">institution_details.json</span>
            <span className="card-status lr">FCRIT</span>
          </div>
          <div className="inst-body-wrap">
            <div className="inst-icon">🎓</div>
            <div className="inst-body">
              <h2>Fr. C. Rodrigues Institute of Technology</h2>
              <p>
                Vashi, Navi Mumbai &nbsp;·&nbsp;
                <span className="hl">Department of Computer Engineering</span><br />
                Subject: <span className="hl">Full Stack Development Laboratory</span>
              </p>
            </div>
          </div>
        </div>

        <div className="chips-row">
          <div className="chip">
            <div className="chip-label">Project Title</div>
            <div className="chip-value">ML Algorithm Visualization Tool</div>
          </div>
          <div className="chip">
            <div className="chip-label">Problem Statement</div>
            <div className="chip-value dt">#3</div>
          </div>
          <div className="chip">
            <div className="chip-label">Course</div>
            <div className="chip-value">Full Stack Dev Lab</div>
          </div>
          <div className="chip">
            <div className="chip-label">Academic Year</div>
            <div className="chip-value">2025 – 2026</div>
          </div>
        </div>

        {/* 02 TEAM */}
        <div className="section-label">02 &nbsp; Team</div>
        <div className="team-meta">
          <div>
            <div className="meta-label">Team Name</div>
            <div className="meta-value">Team Baddies</div>
          </div>
          <div>
            <div className="meta-label">Faculty Guide</div>
            <div className="meta-value rf">Ms. Smita Dange</div>
          </div>
          <div>
            <div className="meta-label">Members</div>
            <div className="meta-value lr">06</div>
          </div>
        </div>

        <div className="members-grid">
          {members.map(m => (
            <MemberCard key={m.id} member={m} colorClass={m.colorClass} />
          ))}
        </div>

        {/* 03 PROBLEM STATEMENT */}
        <div className="section-label">03 &nbsp; Problem Statement</div>

        <div className="objective-block">
          <p>Create an interactive tool to demonstrate machine learning algorithms and the complete ML pipeline — enabling students to visually understand how data flows from raw input through preprocessing, training, and evaluation to a trained model with measurable performance metrics.</p>
        </div>

        <div className="ps-grid">
          <div className="ps-col-card">
            <div className="card-header">
              <span className="card-title">pipeline_stages[ ]</span>
              <span className="card-status lr">4 stages</span>
            </div>
            <ul className="ps-list">
              <li><span className="ps-dot lr"></span>Data Preprocessing</li>
              <li><span className="ps-dot knn"></span>Training / Testing Split</li>
              <li><span className="ps-dot dt"></span>Model Training</li>
              <li><span className="ps-dot rf"></span>Evaluation Metrics</li>
            </ul>
          </div>
          <div className="ps-col-card">
            <div className="card-header">
              <span className="card-title">algorithms[ ]</span>
              <span className="card-status dt">4 models</span>
            </div>
            <ul className="ps-list">
              <li><span className="ps-dot lr"></span>Linear Regression</li>
              <li><span className="ps-dot knn"></span>K-Nearest Neighbours (KNN)</li>
              <li><span className="ps-dot dt"></span>Decision Tree</li>
              <li><span className="ps-dot rf"></span>Random Forest</li>
            </ul>
          </div>
        </div>

        {/* 04 ATTRIBUTION */}
        <div className="section-label">04 &nbsp; Academic Attribution</div>
        <div className="attribution">
          <p>
            This project was developed as part of the <strong>Full Stack Development Laboratory</strong> course at<br />
            <strong>Fr. C. Rodrigues Institute of Technology, Vashi, Navi Mumbai</strong><br />
            Department of Computer Engineering.
          </p>
        </div>

        {/* FOOTER */}
        <footer>
          <div className="footer-dots">
            <span className="fd lr"></span>
            <span className="fd knn"></span>
            <span className="fd dt"></span>
            <span className="fd rf"></span>
            &nbsp; ML Visualizer · FCRIT, Navi Mumbai
          </div>
          <span>Dept. of Computer Engineering · 2025–26</span>
        </footer>

      </div>
    </div>
  );
}
