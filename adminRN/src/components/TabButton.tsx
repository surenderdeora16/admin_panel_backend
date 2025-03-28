const TabButton = ({ active, onClick, icon, children }: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    children: React.ReactNode
}) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center px-4 py-2 rounded-full transition-colors ${active
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
        >
            {icon}
            <span className="ml-2">{children}</span>
        </button>
    )
}

export default TabButton;