"use client";

import axios, { AxiosError } from "axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from '../../images/logo/logo.svg';

// Define the shape of the API response data
interface PolicyContent {
  title: string;
  content: string;
  updatedAt: string;
}

interface ApiResponse {
  status: boolean;
  data: PolicyContent;
}

// Configure Axios default headers
axios.defaults.headers.common["x-api-key"] = import.meta.env.VITE_LICENCE;

const PrivacyPolicy = () => {
  const [content, setContent] = useState<PolicyContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_API_BASE_URL}policy/PRIVACY_POLICY`
        );

        if (response.data.status) {
          setContent(response.data.data);
        } else {
          setError("Content not found");
        }
      } catch (error) {
        const err = error as AxiosError;
        console.error("Error fetching content:", err.message);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Helper function to format content type for display
  const formatContentType = (type: string): string => {
    if (!type) return "";
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Retry fetching content
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    const fetchContent = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_API_BASE_URL}policy/PRIVACY_POLICY`
        );
        if (response.data.status) {
          setContent(response.data.data);
        } else {
          setError("Content not found");
        }
      } catch (error) {
        const err = error as AxiosError;
        console.error("Error fetching content:", err.message);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ease-in-out"
            aria-label="Retry loading content"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-100 to-gray-200 text-white shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
                      <img src={Logo} alt="Logo" />
            <Link to="/" className="text-2xl font-bold text-blue-600" aria-label="Go to GNK homepage">
              GNK
            </Link>
            <div className="hidden md:flex space-x-6">
              {/* <Link
                to="/"
                className="text-white hover:text-indigo-200 transition ease-in-out"
                aria-label="Homepage"
              >
                Home
              </Link> */}
              <Link
                to="/privacy-policy"
                className="text-blue-600 font-medium"
                aria-label="Privacy Policy"
              >
                Privacy Policy
              </Link>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-indigo-200 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {/* {isMenuOpen && (
            <div className="md:hidden mt-4">
              <Link
                to="/"
                className="block text-white hover:text-indigo-200 py-2 transition ease-in-out"
                aria-label="Homepage"
              >
                Home
              </Link>
              <Link
                to="/privacy-policy"
                className="block text-indigo-200 font-medium py-2"
                aria-label="Privacy Policy"
              >
                Privacy Policy
              </Link>
            </div>
          )} */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-12">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto overflow-hidden">
          <div className="p-8 sm:p-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              {content?.title || formatContentType("PRIVACY_POLICY")}
            </h1>
            <div className="prose prose-lg prose-indigo max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content?.content || "No content available" }} />
            </div>
            <div className="mt-8 text-sm text-gray-500">
              Last Updated: {content?.updatedAt ? new Date(content.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              }) : "N/A"}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center items-center">
            <p className="text-sm text-gray-300">
              © {new Date().getFullYear()} GNK. All rights reserved.
            </p>
            {/* <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 sm:mt-0 text-indigo-200 hover:text-white transition ease-in-out"
              aria-label="Open contact us modal"
            >
              Contact Us
            </button> */}
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full mx-4 transform transition-transform duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close contact modal"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your message"
                ></textarea>
              </div>
              <div className="text-right">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ease-in-out"
                  aria-label="Submit contact form (placeholder)"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicy;