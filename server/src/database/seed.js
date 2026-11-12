const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Department,
  Course,
  Semester,
  Subject,
  Student,
  AttendanceSession,
  AttendanceRecord,
  Examination,
  Mark,
  FeeStructure,
  StudentFeeAssessment,
  FeePayment,
  Timetable,
  Announcement,
  Notification,
  AuditLog
} = require('../models');

async function seedDatabase() {
  console.log('🚀 Starting Student Management System (SMS) database seed...');
  
  // Disable foreign key checks to safely truncate and reseed
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const models = [
    AuditLog,
    Notification,
    Announcement,
    Timetable,
    FeePayment,
    StudentFeeAssessment,
    FeeStructure,
    Mark,
    Examination,
    AttendanceRecord,
    AttendanceSession,
    Student,
    Subject,
    Semester,
    Course,
    Department,
    User
  ];

  for (const model of models) {
    await model.destroy({ where: {}, force: true, truncate: true });
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('🧹 Cleaned existing tables.');

  // 1. Create Admin User
  const adminSalt = await bcrypt.genSalt(10);
  const adminHashedPassword = await bcrypt.hash('Admin@12345', adminSalt);
  
  const adminUser = await User.create({
    username: 'admin',
    email: 'admin@college.edu',
    password_hash: adminHashedPassword,
    role: 'admin',
    is_active: true
  });
  console.log('👤 Admin user seeded: admin@college.edu / Admin@12345');

  // 2. Create Departments
  const deptCSE = await Department.create({
    code: 'CSE',
    name: 'Computer Science and Engineering',
    description: 'Department of Computer Science & Engineering offering cutting-edge computing curriculum.',
    head_of_department: 'Dr. Aris Thorne',
    contact_email: 'cse.hod@college.edu',
    is_active: true
  });

  const deptIT = await Department.create({
    code: 'IT',
    name: 'Information Technology',
    description: 'Department of Information Technology specializing in enterprise and web systems.',
    head_of_department: 'Dr. Elena Rostova',
    contact_email: 'it.hod@college.edu',
    is_active: true
  });

  const deptECE = await Department.create({
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    description: 'Department of Electronics & Communication focusing on embedded systems and telecommunications.',
    head_of_department: 'Dr. Marcus Vance',
    contact_email: 'ece.hod@college.edu',
    is_active: true
  });

  const deptMECH = await Department.create({
    code: 'MECH',
    name: 'Mechanical Engineering',
    description: 'Department of Mechanical Engineering specializing in robotics and thermodynamics.',
    head_of_department: 'Dr. Julian Croft',
    contact_email: 'mech.hod@college.edu',
    is_active: true
  });
  console.log('🏛️ Departments seeded.');

  // 3. Create Courses
  const courseCSE = await Course.create({
    department_id: deptCSE.id,
    code: 'BTECH-CSE',
    name: 'Bachelor of Technology in Computer Science',
    description: 'Four-year degree covering algorithms, systems, AI, and software engineering.',
    duration_years: 4,
    total_semesters: 8,
    is_active: true
  });

  const courseIT = await Course.create({
    department_id: deptIT.id,
    code: 'BTECH-IT',
    name: 'Bachelor of Technology in Information Technology',
    description: 'Four-year degree covering cloud systems, cybersecurity, web apps, and databases.',
    duration_years: 4,
    total_semesters: 8,
    is_active: true
  });

  const courseECE = await Course.create({
    department_id: deptECE.id,
    code: 'BTECH-ECE',
    name: 'Bachelor of Technology in Electronics & Communication',
    description: 'Four-year degree covering semiconductors, signal processing, and IoT.',
    duration_years: 4,
    total_semesters: 8,
    is_active: true
  });
  console.log('📚 Courses seeded.');

  // 4. Create Semesters
  const semesters = {};
  for (const course of [courseCSE, courseIT, courseECE]) {
    semesters[course.code] = {};
    for (let i = 1; i <= 8; i++) {
      const sem = await Semester.create({
        course_id: course.id,
        semester_number: i,
        name: `Semester ${i}`,
        academic_year: '2025-2026',
        is_active: true
      });
      semesters[course.code][i] = sem;
    }
  }
  console.log('📅 Semesters seeded (8 semesters for 3 courses).');

  // 5. Create Subjects
  // CSE Sem 4 Subjects
  const cseSem4 = semesters['BTECH-CSE'][4];
  const subCS401 = await Subject.create({
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    code: 'CS401',
    name: 'Design and Analysis of Algorithms',
    credits: 4,
    type: 'theory',
    faculty_name: 'Dr. Alan Turing',
    is_active: true
  });

  const subCS402 = await Subject.create({
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    code: 'CS402',
    name: 'Database Management Systems',
    credits: 4,
    type: 'theory',
    faculty_name: 'Dr. Edgar Codd',
    is_active: true
  });

  const subCS403 = await Subject.create({
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    code: 'CS403',
    name: 'Operating Systems Architecture',
    credits: 3,
    type: 'theory',
    faculty_name: 'Prof. Linus Torvalds',
    is_active: true
  });

  const subCS404 = await Subject.create({
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    code: 'CS404',
    name: 'Computer Networks and Protocols',
    credits: 3,
    type: 'theory',
    faculty_name: 'Dr. Vint Cerf',
    is_active: true
  });

  const subCS405 = await Subject.create({
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    code: 'CS405',
    name: 'Algorithms & DBMS Practical Lab',
    credits: 2,
    type: 'practical',
    faculty_name: 'Prof. Grace Hopper',
    is_active: true
  });

  // IT Sem 4 Subjects
  const itSem4 = semesters['BTECH-IT'][4];
  const subIT401 = await Subject.create({
    course_id: courseIT.id,
    semester_id: itSem4.id,
    code: 'IT401',
    name: 'Web Engineering and Cloud Architectures',
    credits: 4,
    type: 'theory',
    faculty_name: 'Dr. Tim Berners-Lee',
    is_active: true
  });

  const subIT402 = await Subject.create({
    course_id: courseIT.id,
    semester_id: itSem4.id,
    code: 'IT402',
    name: 'Enterprise Information Security',
    credits: 4,
    type: 'theory',
    faculty_name: 'Prof. Bruce Schneier',
    is_active: true
  });

  const subIT403 = await Subject.create({
    course_id: courseIT.id,
    semester_id: itSem4.id,
    code: 'IT403',
    name: 'Agile Software Engineering',
    credits: 3,
    type: 'theory',
    faculty_name: 'Dr. Martin Fowler',
    is_active: true
  });

  // ECE Sem 4 Subjects
  const eceSem4 = semesters['BTECH-ECE'][4];
  const subEC401 = await Subject.create({
    course_id: courseECE.id,
    semester_id: eceSem4.id,
    code: 'EC401',
    name: 'Microprocessors and Microcontrollers',
    credits: 4,
    type: 'theory',
    faculty_name: 'Dr. Gordon Moore',
    is_active: true
  });
  console.log('📖 Subjects seeded.');

  // 6. Create Students & Student User Accounts
  const studentSalt = await bcrypt.genSalt(10);
  const studentPasswordHash = await bcrypt.hash('Student@12345', studentSalt);

  const studentDataList = [
    {
      username: 'CS2026001',
      student_id: 'CS2026001',
      first_name: 'Rahul',
      last_name: 'Sharma',
      email: 'rahul.sharma@student.college.edu',
      phone: '+91 98765 43210',
      date_of_birth: '2004-05-14',
      gender: 'Male',
      address: '42 Silicon Avenue, Tech City, Bangalore, India',
      profile_photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      department_id: deptCSE.id,
      course_id: courseCSE.id,
      academic_year: '2025-2026',
      current_semester_id: cseSem4.id,
      admission_date: '2023-08-01',
      status: 'active',
      emergency_contact_name: 'Sunil Sharma (Father)',
      emergency_contact_phone: '+91 98765 43219'
    },
    {
      username: 'CS2026002',
      student_id: 'CS2026002',
      first_name: 'Priya',
      last_name: 'Patel',
      email: 'priya.patel@student.college.edu',
      phone: '+91 98765 43211',
      date_of_birth: '2004-09-22',
      gender: 'Female',
      address: '108 Green Park Residency, Sector 4, Pune, India',
      profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      department_id: deptCSE.id,
      course_id: courseCSE.id,
      academic_year: '2025-2026',
      current_semester_id: cseSem4.id,
      admission_date: '2023-08-01',
      status: 'active',
      emergency_contact_name: 'Kavita Patel (Mother)',
      emergency_contact_phone: '+91 98765 43220'
    },
    {
      username: 'CS2026003',
      student_id: 'CS2026003',
      first_name: 'Amit',
      last_name: 'Verma',
      email: 'amit.verma@student.college.edu',
      phone: '+91 98765 43212',
      date_of_birth: '2003-12-05',
      gender: 'Male',
      address: '15 Lakeview Meadows, Hyderabad, India',
      profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      department_id: deptCSE.id,
      course_id: courseCSE.id,
      academic_year: '2025-2026',
      current_semester_id: cseSem4.id,
      admission_date: '2023-08-01',
      status: 'active',
      emergency_contact_name: 'Ramesh Verma (Father)',
      emergency_contact_phone: '+91 98765 43221'
    },
    {
      username: 'IT2026001',
      student_id: 'IT2026001',
      first_name: 'Sneha',
      last_name: 'Reddy',
      email: 'sneha.reddy@student.college.edu',
      phone: '+91 98765 43213',
      date_of_birth: '2004-03-18',
      gender: 'Female',
      address: '88 Cyber Towers, Madhapur, Hyderabad, India',
      profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      department_id: deptIT.id,
      course_id: courseIT.id,
      academic_year: '2025-2026',
      current_semester_id: itSem4.id,
      admission_date: '2023-08-01',
      status: 'active',
      emergency_contact_name: 'Srinivas Reddy (Father)',
      emergency_contact_phone: '+91 98765 43222'
    },
    {
      username: 'IT2026002',
      student_id: 'IT2026002',
      first_name: 'Rohan',
      last_name: 'Gupta',
      email: 'rohan.gupta@student.college.edu',
      phone: '+91 98765 43214',
      date_of_birth: '2004-07-10',
      gender: 'Male',
      address: '74 Civil Lines, Jaipur, Rajasthan, India',
      profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      department_id: deptIT.id,
      course_id: courseIT.id,
      academic_year: '2025-2026',
      current_semester_id: itSem4.id,
      admission_date: '2023-08-01',
      status: 'active',
      emergency_contact_name: 'Anil Gupta (Father)',
      emergency_contact_phone: '+91 98765 43223'
    },
    {
      username: 'EC2026001',
      student_id: 'EC2026001',
      first_name: 'Ananya',
      last_name: 'Das',
      email: 'ananya.das@student.college.edu',
      phone: '+91 98765 43215',
      date_of_birth: '2004-11-28',
      gender: 'Female',
      address: '23 Southern Avenue, Kolkata, West Bengal, India',
      profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      department_id: deptECE.id,
      course_id: courseECE.id,
      academic_year: '2025-2026',
      current_semester_id: eceSem4.id,
      admission_date: '2023-08-01',
      status: 'active',
      emergency_contact_name: 'Debashis Das (Father)',
      emergency_contact_phone: '+91 98765 43224'
    },
    {
      username: 'CS2026004',
      student_id: 'CS2026004',
      first_name: 'Vikram',
      last_name: 'Singh',
      email: 'vikram.singh@student.college.edu',
      phone: '+91 98765 43216',
      date_of_birth: '2005-01-19',
      gender: 'Male',
      address: '12 Sector 17, Chandigarh, India',
      profile_photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      department_id: deptCSE.id,
      course_id: courseCSE.id,
      academic_year: '2025-2026',
      current_semester_id: semesters['BTECH-CSE'][2].id,
      admission_date: '2024-08-01',
      status: 'active',
      emergency_contact_name: 'Baldev Singh (Father)',
      emergency_contact_phone: '+91 98765 43225'
    },
    {
      username: 'IT2026003',
      student_id: 'IT2026003',
      first_name: 'Pooja',
      last_name: 'Nair',
      email: 'pooja.nair@student.college.edu',
      phone: '+91 98765 43217',
      date_of_birth: '2005-04-12',
      gender: 'Female',
      address: '5 MG Road, Kochi, Kerala, India',
      profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      department_id: deptIT.id,
      course_id: courseIT.id,
      academic_year: '2025-2026',
      current_semester_id: semesters['BTECH-IT'][2].id,
      admission_date: '2024-08-01',
      status: 'active',
      emergency_contact_name: 'Mohan Nair (Father)',
      emergency_contact_phone: '+91 98765 43226'
    }
  ];

  const createdStudents = [];
  for (const sData of studentDataList) {
    const user = await User.create({
      username: sData.username,
      email: sData.email,
      password_hash: studentPasswordHash,
      role: 'student',
      is_active: true
    });

    const student = await Student.create({
      user_id: user.id,
      student_id: sData.student_id,
      first_name: sData.first_name,
      last_name: sData.last_name,
      email: sData.email,
      phone: sData.phone,
      date_of_birth: sData.date_of_birth,
      gender: sData.gender,
      address: sData.address,
      profile_photo: sData.profile_photo,
      department_id: sData.department_id,
      course_id: sData.course_id,
      academic_year: sData.academic_year,
      current_semester_id: sData.current_semester_id,
      admission_date: sData.admission_date,
      status: sData.status,
      emergency_contact_name: sData.emergency_contact_name,
      emergency_contact_phone: sData.emergency_contact_phone
    });

    createdStudents.push({ ...student.get(), user });
  }
  console.log(`🎓 Seeded ${createdStudents.length} students with login credentials.`);

  // 7. Create Attendance Sessions and Records
  // We'll create 8 class sessions across CS401, CS402, CS403, CS404 for CSE Sem 4
  const cseStudents = createdStudents.filter(s => s.course_id === courseCSE.id && s.current_semester_id === cseSem4.id);
  const cseSubjects = [subCS401, subCS402, subCS403, subCS404, subCS405];

  const sessionDates = [
    '2026-03-02', '2026-03-05', '2026-03-09', '2026-03-12',
    '2026-03-16', '2026-03-19', '2026-03-23', '2026-03-26'
  ];

  let totalSessionsCount = 0;
  for (const subject of cseSubjects) {
    for (let i = 0; i < sessionDates.length; i++) {
      const date = sessionDates[i];
      const session = await AttendanceSession.create({
        subject_id: subject.id,
        semester_id: cseSem4.id,
        session_date: date,
        session_time: '10:00 - 11:00 AM',
        topic: `Lecture ${i + 1}: Core Concepts and Advanced Applications`,
        session_type: subject.type === 'practical' ? 'lab' : 'lecture',
        conducted_by: subject.faculty_name
      });
      totalSessionsCount++;

      // Create records for CSE students
      for (const student of cseStudents) {
        let status = 'present';
        // Rahul Sharma: Very high attendance (~95%)
        // Priya Patel: Good attendance (~88%)
        // Amit Verma: Low attendance (<70%) to trigger low attendance warnings
        if (student.student_id === 'CS2026003') { // Amit Verma
          status = (i % 3 === 0) ? 'present' : 'absent';
        } else if (student.student_id === 'CS2026002') { // Priya
          status = (i === 3) ? 'absent' : (i === 6 ? 'late' : 'present');
        } else { // Rahul
          status = (i === 5) ? 'late' : 'present';
        }

        await AttendanceRecord.create({
          session_id: session.id,
          student_id: student.id,
          status: status,
          remarks: status === 'absent' ? 'Medical leave requested' : (status === 'late' ? 'Traffic delay' : 'Attended session')
        });
      }
    }
  }
  console.log(`📋 Seeded ${totalSessionsCount} attendance sessions with detailed attendance records.`);

  // 8. Create Examinations
  const exam1 = await Examination.create({
    name: 'Internal Assessment Test 1 - Spring 2026',
    exam_type: 'internal_1',
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    academic_year: '2025-2026',
    start_date: '2026-02-15',
    end_date: '2026-02-22',
    is_active: true
  });

  const examMidterm = await Examination.create({
    name: 'Mid-Semester Examinations 2026',
    exam_type: 'semester_final',
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    academic_year: '2025-2026',
    start_date: '2026-03-10',
    end_date: '2026-03-18',
    is_active: true
  });
  console.log('📝 Seeded Examinations.');

  // 9. Create Marks for CSE students
  const marksData = [
    // Rahul Sharma (High achiever)
    { student: cseStudents[0], sub: subCS401, exam: examMidterm, max: 100, pass: 40, obt: 92, absent: false },
    { student: cseStudents[0], sub: subCS402, exam: examMidterm, max: 100, pass: 40, obt: 88, absent: false },
    { student: cseStudents[0], sub: subCS403, exam: examMidterm, max: 100, pass: 40, obt: 94, absent: false },
    { student: cseStudents[0], sub: subCS404, exam: examMidterm, max: 100, pass: 40, obt: 86, absent: false },
    { student: cseStudents[0], sub: subCS405, exam: examMidterm, max: 100, pass: 40, obt: 96, absent: false },

    // Priya Patel (Solid grades)
    { student: cseStudents[1], sub: subCS401, exam: examMidterm, max: 100, pass: 40, obt: 82, absent: false },
    { student: cseStudents[1], sub: subCS402, exam: examMidterm, max: 100, pass: 40, obt: 79, absent: false },
    { student: cseStudents[1], sub: subCS403, exam: examMidterm, max: 100, pass: 40, obt: 85, absent: false },
    { student: cseStudents[1], sub: subCS404, exam: examMidterm, max: 100, pass: 40, obt: 76, absent: false },
    { student: cseStudents[1], sub: subCS405, exam: examMidterm, max: 100, pass: 40, obt: 90, absent: false },

    // Amit Verma (Mixed performance / 1 failed)
    { student: cseStudents[2], sub: subCS401, exam: examMidterm, max: 100, pass: 40, obt: 34, absent: false }, // Fail
    { student: cseStudents[2], sub: subCS402, exam: examMidterm, max: 100, pass: 40, obt: 58, absent: false },
    { student: cseStudents[2], sub: subCS403, exam: examMidterm, max: 100, pass: 40, obt: 0, absent: true },  // Absent
    { student: cseStudents[2], sub: subCS404, exam: examMidterm, max: 100, pass: 40, obt: 62, absent: false },
    { student: cseStudents[2], sub: subCS405, exam: examMidterm, max: 100, pass: 40, obt: 70, absent: false }
  ];

  for (const m of marksData) {
    await Mark.create({
      examination_id: m.exam.id,
      subject_id: m.sub.id,
      student_id: m.student.id,
      max_marks: m.max,
      passing_marks: m.pass,
      marks_obtained: m.obt,
      is_absent: m.absent,
      entered_by: 'Academic Registrar'
    });
  }
  console.log(`📊 Seeded ${marksData.length} marks records.`);

  // 10. Create Fee Structures
  const feeCSE4 = await FeeStructure.create({
    course_id: courseCSE.id,
    semester_id: cseSem4.id,
    academic_year: '2025-2026',
    category_name: 'Regular - Open Category',
    tuition_fee: 45000.00,
    lab_fee: 10000.00,
    library_fee: 3000.00,
    exam_fee: 2500.00,
    other_fee: 1500.00,
    total_amount: 62000.00,
    due_date: '2026-03-31'
  });

  const feeIT4 = await FeeStructure.create({
    course_id: courseIT.id,
    semester_id: itSem4.id,
    academic_year: '2025-2026',
    category_name: 'Regular - Open Category',
    tuition_fee: 42000.00,
    lab_fee: 8000.00,
    library_fee: 3000.00,
    exam_fee: 2500.00,
    other_fee: 1500.00,
    total_amount: 57000.00,
    due_date: '2026-03-31'
  });
  console.log('💳 Seeded Fee Structures.');

  // 11. Student Fee Assessments & Payments
  // Rahul Sharma (Fully Paid)
  const assessRahul = await StudentFeeAssessment.create({
    student_id: cseStudents[0].id,
    fee_structure_id: feeCSE4.id,
    semester_id: cseSem4.id,
    total_amount: 62000.00,
    scholarship_amount: 12000.00,
    concession_amount: 0.00,
    net_payable: 50000.00,
    paid_amount: 50000.00,
    balance_amount: 0.00,
    status: 'paid',
    due_date: '2026-03-31'
  });

  await FeePayment.create({
    assessment_id: assessRahul.id,
    student_id: cseStudents[0].id,
    receipt_number: 'RCP-2026-0001',
    amount_paid: 50000.00,
    payment_date: '2026-02-10',
    payment_mode: 'online',
    transaction_ref: 'TXN_RAHUL_9823412',
    remarks: 'Full semester fee paid online via NetBanking',
    collected_by: 'Finance Office'
  });

  // Priya Patel (Partially Paid)
  const assessPriya = await StudentFeeAssessment.create({
    student_id: cseStudents[1].id,
    fee_structure_id: feeCSE4.id,
    semester_id: cseSem4.id,
    total_amount: 62000.00,
    scholarship_amount: 0.00,
    concession_amount: 2000.00,
    net_payable: 60000.00,
    paid_amount: 35000.00,
    balance_amount: 25000.00,
    status: 'partially_paid',
    due_date: '2026-03-31'
  });

  await FeePayment.create({
    assessment_id: assessPriya.id,
    student_id: cseStudents[1].id,
    receipt_number: 'RCP-2026-0002',
    amount_paid: 35000.00,
    payment_date: '2026-02-18',
    payment_mode: 'bank_transfer',
    transaction_ref: 'NEFT_SBI_448912',
    remarks: 'Installment 1 paid via NEFT',
    collected_by: 'Finance Office'
  });

  // Amit Verma (Overdue)
  await StudentFeeAssessment.create({
    student_id: cseStudents[2].id,
    fee_structure_id: feeCSE4.id,
    semester_id: cseSem4.id,
    total_amount: 62000.00,
    scholarship_amount: 0.00,
    concession_amount: 0.00,
    net_payable: 62000.00,
    paid_amount: 0.00,
    balance_amount: 62000.00,
    status: 'overdue',
    due_date: '2026-02-28' // past due date
  });
  console.log('💰 Seeded Fee Assessments and Payments.');

  // 12. Create Timetables for CSE Sem 4
  const timetableSchedule = [
    { day: 'Monday', start: '09:00:00', end: '10:00:00', sub: subCS401, room: 'Lecture Hall 201', faculty: 'Dr. Alan Turing' },
    { day: 'Monday', start: '10:15:00', end: '11:15:00', sub: subCS402, room: 'Lecture Hall 201', faculty: 'Dr. Edgar Codd' },
    { day: 'Monday', start: '11:30:00', end: '12:30:00', sub: subCS403, room: 'Lecture Hall 201', faculty: 'Prof. Linus Torvalds' },
    { day: 'Tuesday', start: '09:00:00', end: '10:00:00', sub: subCS404, room: 'Lecture Hall 201', faculty: 'Dr. Vint Cerf' },
    { day: 'Tuesday', start: '10:15:00', end: '12:15:00', sub: subCS405, room: 'Advanced Computing Lab 3', faculty: 'Prof. Grace Hopper' },
    { day: 'Wednesday', start: '09:00:00', end: '10:00:00', sub: subCS401, room: 'Lecture Hall 201', faculty: 'Dr. Alan Turing' },
    { day: 'Wednesday', start: '10:15:00', end: '11:15:00', sub: subCS402, room: 'Lecture Hall 201', faculty: 'Dr. Edgar Codd' },
    { day: 'Thursday', start: '09:00:00', end: '10:00:00', sub: subCS403, room: 'Lecture Hall 201', faculty: 'Prof. Linus Torvalds' },
    { day: 'Thursday', start: '10:15:00', end: '11:15:00', sub: subCS404, room: 'Lecture Hall 201', faculty: 'Dr. Vint Cerf' },
    { day: 'Friday', start: '09:00:00', end: '11:00:00', sub: subCS405, room: 'Advanced Computing Lab 3', faculty: 'Prof. Grace Hopper' },
    { day: 'Friday', start: '11:15:00', end: '12:15:00', sub: subCS401, room: 'Lecture Hall 201', faculty: 'Dr. Alan Turing' }
  ];

  for (const t of timetableSchedule) {
    await Timetable.create({
      course_id: courseCSE.id,
      semester_id: cseSem4.id,
      subject_id: t.sub.id,
      day_of_week: t.day,
      start_time: t.start,
      end_time: t.end,
      room_number: t.room,
      faculty_name: t.faculty
    });
  }
  console.log(`⏰ Seeded ${timetableSchedule.length} timetable class entries.`);

  // 13. Create Announcements
  await Announcement.create({
    title: 'Mid-Semester Examinations 2026 Schedule Published',
    content: 'The finalized timetable for the upcoming Mid-Semester Examinations has been published. All students are advised to download their admit cards and check room allocations.',
    target_type: 'all',
    priority: 'urgent',
    publish_date: '2026-03-01',
    expiry_date: '2026-04-15',
    is_active: true,
    created_by: 'Office of the Dean of Academics'
  });

  await Announcement.create({
    title: 'Mandatory 75% Attendance Compliance Rule',
    content: 'Students having less than 75% aggregate attendance in theory and practical sessions will not be permitted to take the final university semester exams. Check your attendance records on the portal.',
    target_type: 'all',
    priority: 'high',
    publish_date: '2026-02-20',
    expiry_date: '2026-05-01',
    is_active: true,
    created_by: 'Attendance Monitoring Cell'
  });

  await Announcement.create({
    title: 'Annual Hackathon & Innovation Summit 2026',
    content: 'Department of Computer Science & Engineering invites student teams for Hack-A-College 2026. Exciting cash prizes, internship opportunities, and industry mentorship await!',
    target_type: 'department',
    target_id: deptCSE.id,
    priority: 'medium',
    publish_date: '2026-03-05',
    expiry_date: '2026-04-30',
    is_active: true,
    created_by: 'CSE Student Chapter'
  });
  console.log('📢 Seeded Announcements.');

  // 14. Seed Notifications
  const rahulUser = createdStudents[0].user;
  const amitUser = createdStudents[2].user;

  await Notification.create({
    user_id: rahulUser.id,
    title: 'Fee Payment Verified',
    message: 'Your payment of INR 50,000 for Semester 4 has been successfully recorded. Receipt #RCP-2026-0001 is ready for download.',
    type: 'fee',
    is_read: true,
    link: '/student/fees'
  });

  await Notification.create({
    user_id: rahulUser.id,
    title: 'Midterm Marks Published',
    message: 'Your marks for Mid-Semester Examinations have been recorded. You scored 94% in Operating Systems Architecture.',
    type: 'marks',
    is_read: false,
    link: '/student/marks'
  });

  await Notification.create({
    user_id: amitUser.id,
    title: 'Attendance Shortage Alert',
    message: 'Warning: Your attendance in CS401 and CS403 has fallen below the mandatory 75% threshold. Please meet your faculty advisor.',
    type: 'attendance',
    is_read: false,
    link: '/student/attendance'
  });

  await Notification.create({
    user_id: adminUser.id,
    title: 'System Initialized',
    message: 'Student Management System database and academic records have been seeded successfully.',
    type: 'general',
    is_read: false,
    link: '/admin/dashboard'
  });
  console.log('🔔 Seeded Notifications.');

  // 15. Seed Audit Logs
  await AuditLog.create({
    user_id: adminUser.id,
    action: 'SYSTEM_SEED',
    entity: 'DATABASE',
    entity_id: 1,
    new_values: { message: 'Database initialized with demo academic data' },
    ip_address: '127.0.0.1'
  });
  console.log('🛡️ Seeded Audit Logs.');

  console.log('🎉 Seed completed successfully!');
  console.log('========================================================');
  console.log('🔑 Credentials for Testing:');
  console.log('Admin Account:   admin@college.edu       Password: Admin@12345');
  console.log('Student Account: rahul.sharma@student.college.edu  Password: Student@12345 (or user: CS2026001)');
  console.log('Student Account (Shortage): amit.verma@student.college.edu  Password: Student@12345 (or user: CS2026003)');
  console.log('========================================================');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
