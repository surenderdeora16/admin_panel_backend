// import DEFAULT_IMAGE from "../assets/images/admin/team/avatar.png"
// export { DEFAULT_IMAGE };

export const FILE_SIZE = 2 * 1024 * 1024;

export const SUPPORTED_FORMATS_IMAGE = [
    "image/jpg",
    "image/jpeg",
    "image/gif",
    'image/png'
];

export const SUPPORTED_FORMATS_DOC = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/pdf',
    'application/vnd.rar'
];

export const SETTING_API_ENDPOINTS = {
    GENERAL_SETTINGS: 'settings-list/1',
    SMS_SETTINGS: 'settings-list/4',
    EMAIL_SETTINGS: 'settings-list/2',
    SOCIAL_SETTINGS: 'settings-list/3',
    UPDATE_SETTINGS: 'update-settings',
};

export const STATUS = [
    { id: true, name: "Active" },
    { id: false, name: "In-Active" },
]


export const QUESTION_TYPES = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'TRUE_FALSE', label: 'True/False' },
    { value: 'FILL_IN_BLANK', label: 'Fill in the Blank' },
    { value: 'DESCRIPTIVE', label: 'Descriptive' },
  ];
  
  export const DIFFICULTY_LEVELS = [
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' },
  ];