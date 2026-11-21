-- Student Placement Portal - Database Initialization
-- This file runs automatically on first container start

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    year VARCHAR(20),
    cgpa DECIMAL(3,2),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_drives (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    job_role VARCHAR(150) NOT NULL,
    package VARCHAR(50) NOT NULL,
    location VARCHAR(150) NOT NULL,
    eligibility VARCHAR(255) NOT NULL,
    deadline DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    drive_id INTEGER NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Applied' CHECK (status IN ('Applied', 'Shortlisted', 'Rejected', 'Selected')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, drive_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_drive ON applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Default admin (password: admin123 - bcrypt hash)
INSERT INTO admins (name, email, password) VALUES
('Admin', 'admin@placement.com', '$2a$10$8K1p/ax0PNmHQSK0E0VZNeYB0TLhHGMfNxl2vJGMg6VdEuGqWwZ6y')
ON CONFLICT (email) DO NOTHING;

-- Sample placement drives
INSERT INTO placement_drives (company_name, job_role, package, location, eligibility, deadline, description) VALUES
('TCS', 'Software Developer', '7 LPA', 'Mumbai, India', 'B.Tech CSE/IT - Min 7.0 CGPA', '2027-03-15', 'TCS is hiring fresh graduates for their digital division. Work on cutting-edge projects with global clients.'),
('Infosys', 'Systems Engineer', '6.5 LPA', 'Bangalore, India', 'B.Tech All Branches - Min 6.5 CGPA', '2027-03-20', 'Join Infosys as a Systems Engineer and get trained in the latest technologies at their Mysore campus.'),
('Amazon', 'SDE Intern', '12 LPA', 'Hyderabad, India', 'B.Tech CSE/IT - Min 8.0 CGPA', '2027-02-28', 'Amazon is looking for talented software engineers to join their development center in Hyderabad.'),
('Wipro', 'Project Engineer', '5.5 LPA', 'Pune, India', 'B.Tech All Branches - Min 6.0 CGPA', '2027-04-10', 'Wipro offers excellent training programs and opportunities to work on enterprise solutions.'),
('Google', 'Software Engineer', '25 LPA', 'Bangalore, India', 'B.Tech CSE - Min 8.5 CGPA', '2027-02-15', 'Join Google India and work on products used by billions of people worldwide.'),
('Microsoft', 'Software Development Engineer', '20 LPA', 'Noida, India', 'B.Tech CSE/IT - Min 8.0 CGPA', '2027-03-01', 'Microsoft is hiring SDEs for Azure cloud services and Microsoft 365 products.')
ON CONFLICT DO NOTHING;

