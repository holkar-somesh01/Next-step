const mongoose = require('mongoose');
const Scheme = require('../models/scheme.model'); // Update path if needed
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const schemes = [
    {
        name: "Central Sector Scheme of Scholarship (CSSS)",
        description:
            "Scholarship for meritorious students from economically weaker families pursuing undergraduate and postgraduate studies. Selection is based on Class 12 board examination performance.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Passed Class 12 in top percentile of respective board and pursuing regular UG/PG course.",
        category: "Higher Education",
        deadline: "31 October"
    },
    {
        name: "PM YASASVI Scholarship",
        description:
            "Financial assistance for OBC, EBC and DNT students pursuing school and higher education. Covers tuition fees, hostel expenses and educational costs.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "OBC/EBC/DNT student with annual family income below ₹2.5 lakh.",
        category: "Scholarship",
        deadline: "31 August"
    },
    {
        name: "National Means Cum Merit Scholarship (NMMS)",
        description:
            "Scholarship scheme aimed at reducing dropout rates among economically weaker students studying in government and aided schools.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Class 8 student who qualifies NMMS examination.",
        category: "School Education",
        deadline: "State Wise"
    },
    {
        name: "INSPIRE Scholarship for Higher Education",
        description:
            "Scholarship encouraging talented students to pursue careers in Basic and Natural Sciences.",
        link: "https://online-inspire.gov.in",
        eligibilityCriteria:
            "Top-performing science students enrolled in eligible science courses.",
        category: "Science Education",
        deadline: "Varies"
    },
    {
        name: "AICTE Pragati Scholarship for Girls",
        description:
            "Scholarship for girl students pursuing technical education in AICTE-approved institutions.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Female student admitted to AICTE-approved technical course.",
        category: "Technical Education",
        deadline: "NSP Schedule"
    },
    {
        name: "AICTE Saksham Scholarship",
        description:
            "Scholarship for specially-abled students pursuing technical education.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Student with disability of 40% or above enrolled in AICTE-approved institution.",
        category: "Technical Education",
        deadline: "NSP Schedule"
    },
    {
        name: "AICTE Swanath Scholarship",
        description:
            "Support for orphan students, wards of armed forces personnel and students facing difficult circumstances.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Eligible orphan/single-parent student or ward of armed forces personnel.",
        category: "Technical Education",
        deadline: "NSP Schedule"
    },
    {
        name: "Post Matric Scholarship for SC Students",
        description:
            "Financial support for Scheduled Caste students studying after Class 10.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "SC student enrolled in recognized institution.",
        category: "Social Welfare",
        deadline: "State Wise"
    },
    {
        name: "Top Class Education Scheme for SC Students",
        description:
            "Provides financial assistance to SC students admitted to premier institutions such as IITs, IIMs, AIIMS and NITs.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "SC student admitted to notified premier institution.",
        category: "Higher Education",
        deadline: "NSP Schedule"
    },
    {
        name: "Merit Cum Means Scholarship for Minority Students",
        description:
            "Scholarship for minority students pursuing professional and technical courses.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Student from notified minority community meeting academic requirements.",
        category: "Minority Welfare",
        deadline: "NSP Schedule"
    },
    {
        name: "Pre-Matric Scholarship for Minority Students",
        description:
            "Financial support for school-going students from minority communities.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Minority student studying in Class 1 to 10.",
        category: "School Education",
        deadline: "NSP Schedule"
    },
    {
        name: "Post-Matric Scholarship for Minority Students",
        description:
            "Scholarship for minority students pursuing studies from Class 11 to PhD level.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Minority student enrolled in recognized institution.",
        category: "Higher Education",
        deadline: "NSP Schedule"
    },
    {
        name: "National Fellowship for Scheduled Caste Students",
        description:
            "Provides fellowships to SC students pursuing M.Phil and Ph.D programs.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "SC student enrolled in M.Phil or Ph.D program.",
        category: "Research",
        deadline: "NSP Schedule"
    },
    {
        name: "Prime Minister Research Fellowship (PMRF)",
        description:
            "Research fellowship for exceptional students pursuing doctoral studies in IITs, IISc and other premier institutions.",
        link: "https://pmrf.in",
        eligibilityCriteria:
            "Outstanding academic record and admission to eligible PhD programme.",
        category: "Research",
        deadline: "Varies"
    },
    {
        name: "UGC Ishan Uday Scholarship",
        description:
            "Scholarship for students from North Eastern Region pursuing higher education.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "Permanent resident of North Eastern states enrolled in recognized college.",
        category: "Higher Education",
        deadline: "NSP Schedule"
    },
    {
        name: "National Scholarship for Higher Education of ST Students",
        description:
            "Supports Scheduled Tribe students pursuing higher education in India.",
        link: "https://scholarships.gov.in",
        eligibilityCriteria:
            "ST student pursuing higher education course.",
        category: "Tribal Welfare",
        deadline: "NSP Schedule"
    }
];

const seedDB = async () => {
    try {
        const dbUri = process.env.MONGO_URI;
        console.log('Connecting to database...');
        await mongoose.connect(dbUri);

        await Scheme.deleteMany({});
        console.log('Old schemes removed');

        await Scheme.insertMany(schemes);
        console.log(`${schemes.length} schemes inserted successfully`);

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
};

seedDB();