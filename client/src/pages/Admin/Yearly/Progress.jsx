import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar";
import AdminNavbar from "../../../components/AdminNavbar";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast, ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";

const url = import.meta.env.VITE_REACT_APP_URL;

const Progress = () => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [filters, setFilters] = useState({ year: "", researchArea: "" });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${url}admin/progress-reports`);
            setReports(response.data.data);
        } catch (error) {
            console.error("Error fetching progress reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`${url}admin/progress-reports/${id}/mark-as-read`);
            setReports(reports.filter((report) => report._id !== id));
            toast.success("Progress report marked as read."); 

        } catch (error) {
            console.error("Error marking report as read:", error);
            toast.error("Failed to mark progress report as read."); 

        }
    };

    const viewReport = (report) => {
        setSelectedReport(report);
        setIsPopupOpen(true);
    };

    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    };

    const goToProjectDashboard = (projectId) => {
        navigate(`/project-dashboard/${projectId}`);
    };

    const saveAsPDF = () => {
        if (!selectedReport) return;

        const doc = new jsPDF();
        const filename = `${selectedReport.projectTitle}_${selectedReport.projectId?._id || selectedReport.projectId}_progressreport_year_${selectedReport.currentYear}.pdf`;

        doc.setFontSize(22);
        doc.setTextColor(0, 51, 102);
        doc.text("ResearchX", 105, 15, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text("Empowering Research with Technology", 105, 22, { align: "center" });

        doc.setDrawColor(0, 0, 0);
        doc.line(10, 25, 200, 25);

        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102);
        doc.text("Progress Report", 105, 35, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("This document is autogenerated by the ResearchX system.", 105, 42, { align: "center" });

        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text("Project Details", 10, 50);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Project Title: ${selectedReport.projectTitle}`, 10, 60);
        doc.text(`Project ID: ${selectedReport.projectId?._id || selectedReport.projectId}`, 10, 70);
        doc.text(`Current Year: ${selectedReport.currentYear}`, 10, 80);
        doc.text(`Principal Investigator: ${selectedReport.principalInvestigator.join(", ")}`, 10, 90);
        doc.text(`Research Area: ${selectedReport.researchArea}`, 10, 100);

        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text("Objectives and Methodology", 10, 110);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const objectives = doc.splitTextToSize(`Approved Objectives: ${selectedReport.approvedObjectives.join(", ")}`, 180);
        doc.text(objectives, 10, 120);

        const methodology = doc.splitTextToSize(`Methodology: ${selectedReport.methodology}`, 180);
        doc.text(methodology, 10, 140);

        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text("Research Achievements", 10, 160);

        const achievementsData = [
            ["Summary of Progress", selectedReport.researchAchievements.summaryOfProgress],
            ["New Observations", selectedReport.researchAchievements.newObservations],
            ["Innovations", selectedReport.researchAchievements.innovations],
            ["Application Potential (Long Term)", selectedReport.researchAchievements.applicationPotential.longTerm],
            ["Application Potential (Immediate)", selectedReport.researchAchievements.applicationPotential.immediate],
            ["Other Achievements", selectedReport.researchAchievements.otherAchievements],
        ];

        doc.autoTable({
            startY: 165,
            head: [["Category", "Details"]],
            body: achievementsData,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
        });

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Generated by ResearchX © 2025", 105, 285, { align: "center" });

        doc.save(filename);
    };

    useEffect(() => {
        fetchReports();
    }, []);


    const filteredReports = reports
        .filter((report) => {
            const matchesYear = filters.year ? report.currentYear === parseInt(filters.year) : true;
            const matchesTitle = filters.projectTitle
                ? report.projectTitle.toLowerCase().includes(filters.projectTitle.toLowerCase())
                : true;
            const matchesPI = filters.principalInvestigator
                ? report.principalInvestigator.some((pi) =>
                      pi.toLowerCase().includes(filters.principalInvestigator.toLowerCase())
                  )
                : true;
            return matchesYear && matchesTitle && matchesPI;
        })
        .sort((a, b) => {
            if (sortOrder === "asc") {
                return a.currentYear - b.currentYear;
            } else {
                return b.currentYear - a.currentYear;
            }
        });

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <AdminSidebar activeSection="progressReports" />
            <div className="flex-1 p-6 overflow-y-auto">
                <AdminNavbar activeSection="Progress Reports" />
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Progress Reports</h1>
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            Sort & Filter
                        </button>
                    </div>


                    {isFilterOpen && (
                        <div className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-4 mt-2 w-80 z-10 right-0">
                            <h2 className="text-lg font-bold mb-2 text-gray-800">Sort & Filter Options</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-1">Sort By</label>
                                <select
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                                    value={sortOrder}
                                    onChange={handleSortChange}
                                >
                                    <option value="asc">Year (Ascending)</option>
                                    <option value="desc">Year (Descending)</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-1">Filter by Year</label>
                                <input
                                    type="number"
                                    name="year"
                                    placeholder="Enter Year"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                                    value={filters.year}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-1">Filter by Project Title</label>
                                <input
                                    type="text"
                                    name="projectTitle"
                                    placeholder="Enter Project Title"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                                    value={filters.projectTitle}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-1">Filter by Principal Investigator</label>
                                <input
                                    type="text"
                                    name="principalInvestigator"
                                    placeholder="Enter PI Name"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                                    value={filters.principalInvestigator}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    className="bg-gray-400 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-500"
                                    onClick={() => setIsFilterOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : error ? (
                        <p className="text-center text-red-500">{error}</p>
                    ) : filteredReports.length > 0 ? (
                        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
<thead className="bg-blue-500 text-white">
    <tr>
        <th className="border border-gray-300 px-4 py-2 text-left">Project ID</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Title</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Principal Investigator</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Year</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
    </tr>
</thead>
<tbody>
    {filteredReports.map((report) => (
        <tr key={report._id} className="hover:bg-gray-100">
            <td
                className="border border-gray-300 px-4 py-2 text-blue-500 cursor-pointer hover:underline"
                onClick={() => goToProjectDashboard(report.projectId?._id || report.projectId)}
            >
                {report.projectId?._id || report.projectId || "N/A"}
            </td>
            <td className="border border-gray-300 px-4 py-2">{report.projectTitle}</td>
            <td className="border border-gray-300 px-4 py-2">
                {report.principalInvestigator.join(", ")}
            </td>
            <td className="border border-gray-300 px-4 py-2">{report.currentYear}</td>
            <td className="border border-gray-300 px-4 py-2">
                <div className="flex space-x-4">
                    <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => viewReport(report)}
                    >
                        View
                    </button>
                    <button
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        onClick={() => markAsRead(report._id)}
                    >
                        Mark as Read
                    </button>
                </div>
            </td>
        </tr>
    ))}
</tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500">No progress reports found.</p>
                    )}
                </div>
            </div>

                {isPopupOpen && selectedReport && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-[70%] max-h-[90vh] overflow-y-auto p-4">
                            <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">Progress Report Details</h2>
                            <div className="grid grid-cols-2 gap-y-1 gap-x-4 mb-2">
                                <label className="font-semibold text-gray-700">Project Title:</label>
                                <span className="text-gray-800">{selectedReport.projectTitle}</span>

                                <label className="font-semibold text-gray-700">Principal Investigator:</label>
                                <span className="text-gray-800">
                    {selectedReport.principalInvestigator?.join(", ") || "N/A"}
                </span>
                                <label className="font-semibold text-gray-700">Research Area:</label>
                                <span className="text-gray-800">{selectedReport.researchArea}</span>

                                <label className="font-semibold text-gray-700">Approved Objectives:</label>
                                <span className="text-gray-800">{selectedReport.approvedObjectives.join(", ")}</span>

                                <label className="font-semibold text-gray-700">Methodology:</label>
                                <span className="text-gray-800">{selectedReport.methodology}</span>
                            </div>

                            <h3 className="text-lg font-bold text-blue-700 mb-2">Research Achievements</h3>
                            <ul className="list-disc pl-6">
                                <li><strong>Summary of Progress:</strong> {selectedReport.researchAchievements.summaryOfProgress}</li>
                                <li><strong>New Observations:</strong> {selectedReport.researchAchievements.newObservations}</li>
                                <li><strong>Innovations:</strong> {selectedReport.researchAchievements.innovations}</li>
                                <li><strong>Application Potential (Long Term):</strong> {selectedReport.researchAchievements.applicationPotential.longTerm}</li>
                                <li><strong>Application Potential (Immediate):</strong> {selectedReport.researchAchievements.applicationPotential.immediate}</li>
                                <li><strong>Other Achievements:</strong> {selectedReport.researchAchievements.otherAchievements}</li>
                            </ul>

                            <div className="flex justify-end mt-4">
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
                                    onClick={saveAsPDF}
                                >
                                    Save as PDF
                                </button>
                                <button
                                    className="bg-gray-400 text-white px-4 py-2 rounded"
                                    onClick={() => setIsPopupOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default Progress;