import React, { useState, useEffect } from 'react'
import { FaChevronCircleDown } from "react-icons/fa";

const websites = [
    { name: 'Main Website', url: 'https://example.com' },
    ...Array(20).fill(null).map((_, i) => ({ name: `Subdomain ${i + 1}`, url: `https://sub${i + 1}.example.com` })),
    ...Array(5).fill(null).map((_, i) => ({ name: `Subdirectory ${i + 1}`, url: `https://example.com/sub${i + 1}` })),
]

interface WebsiteSelectorProps {
    onSelect: (url: string) => void;
}

const WebsiteSelector: React.FC<WebsiteSelectorProps> = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState(websites[0])

    useEffect(() => {
        onSelect(selected.url)
    }, [selected, onSelect])

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="website-menu"
                    aria-expanded="true"
                    aria-haspopup="true"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selected.name}
                    <FaChevronCircleDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10">
                    <div className="py-1 max-h-60 overflow-auto" role="menu" aria-orientation="vertical" aria-labelledby="website-menu">
                        {websites.map((website) => (
                            <button
                                key={website.url}
                                className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                                role="menuitem"
                                onClick={() => {
                                    setSelected(website)
                                    setIsOpen(false)
                                }}
                            >
                                {website.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default WebsiteSelector

