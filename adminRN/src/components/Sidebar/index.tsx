import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import Logo from '../../images/logo/logo.svg';
import { LuLayoutDashboard } from 'react-icons/lu';
import { IoShareSocialOutline } from 'react-icons/io5';
import { GiBookAura } from 'react-icons/gi';
import { GrScorecard } from "react-icons/gr";
import { CgWebsite } from "react-icons/cg";
import { IoBookmarks } from "react-icons/io5";
import { MdOutlinePolicy } from "react-icons/md";
import { FaBook, FaFileAlt, FaMoneyBillAlt, FaUsers } from 'react-icons/fa';
import { SlBookOpen } from 'react-icons/sl';
import { RiGovernmentLine } from 'react-icons/ri';
import { PiExamFill } from 'react-icons/pi';

import { IoMdImages } from 'react-icons/io';
import { FaMapLocationDot } from 'react-icons/fa6';
import { FaMapPin } from 'react-icons/fa';
import { IoLibrary } from 'react-icons/io5';
import { MdNewspaper } from 'react-icons/md';

import { BiSolidCoupon } from 'react-icons/bi';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

interface MenuItem {
  name: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

const MENU_CONFIG = {
  main: [
    {
      name: 'Dashboard',
      path: '/',
      icon: LuLayoutDashboard,
    },
    // {
    //   name: 'Calendar',
    //   path: '/calendar',
    //   icon: SlCalender,
    // },
    {
      name: 'Upcomg Govt. Exam',
      path: '/upcoming-govt-exam',
      icon: RiGovernmentLine,
    },
    {
      name: 'App Banner',
      path: '/app-banner',
      icon: IoMdImages,
    },

    {
      name: 'Exam Library',
      icon: IoLibrary,
      children: [
        {
          name: 'Subjects',
          path: '/exam-library/subjects',
          icon: FaBook,
        },
        {
          name: 'Chapters',
          path: '/exam-library/chapters',
          icon: SlBookOpen,
        },
        {
          name: 'Topics',
          path: '/exam-library/topics',
          icon: IoBookmarks,
        },
        // {
        //   name: 'Questions',
        //   path: '/exam-library/questions',
        //   icon: IoShareSocialOutline,
        // },
      ],
    },
    {
      name: 'Notes',
      path: '/notes',
      icon: FaFileAlt,
    },
    {
      name: 'Exams',
      icon: PiExamFill,
      children: [
        {
          name: 'Batches',
          path: '/batches',
          icon: GiBookAura,
        },
        {
          name: 'Exam Plans',
          path: '/exam-plans',
          icon: SlBookOpen,
        },
        {
          name: 'Test Series',
          path: '/test-series',
          icon: MdNewspaper,
        },
        // {
        //   name: 'Questions',
        //   path: '/exam-library/questions',
        //   icon: IoShareSocialOutline,
        // },
      ],
    },

    {
      name: 'Coupons',
      path: '/coupon',
      icon: BiSolidCoupon,
    },

    { name: 'Users', path: '/users', icon: FaUsers },
    { name: 'Payment Logs', path: '/payment-logs', icon: FaMoneyBillAlt },
    {
      name: 'Policy',
      path: '/policy',
      icon: MdOutlinePolicy,
    },
    {
      name: 'Location',
      icon: FaMapLocationDot,
      children: [
        {
          name: 'State',
          path: '/state',
          icon: FaMapPin,
        },
        {
          name: 'District',
          path: '/district',
          icon: FaMapPin,
        },
      ],
    },
    {
      name: 'Links',
      icon: CgWebsite,
      children: [
        // {
        //   name: 'Admit & Result',
        //   path: '/settings/admin-card-and-result',
        //   icon: GrScorecard,
        // },
        // {
        //   name: 'SMS Service',
        //   path: '/settings/sms-service',
        //   icon: HiOutlineChatBubbleLeftRight,
        // },
        // {
        //   name: 'Email Service',
        //   path: '/settings/email-service',
        //   icon: MdOutlineMailOutline,
        // },
        {
          name: 'Social Media',
          path: '/settings/social-media',
          icon: IoShareSocialOutline,
        },
      ],
    },
  ],
  others: [
    // {
    //   name: 'Chart',
    //   path: '/chart',
    //   icon: FiPieChart,
    // },
    // {
    //   name: 'UI Elements',
    //   icon: FiLayout,
    //   children: [
    //     { name: 'Alerts', path: '/ui/alerts' },
    //     { name: 'Buttons', path: '/ui/buttons' },
    //   ],
    // },
    // {
    //   name: 'Authentication',
    //   icon: FiLogIn,
    //   children: [
    //     { name: 'Sign In', path: '/auth/signin' },
    //     { name: 'Sign Up', path: '/auth/signup' },
    //   ],
    // },
  ],
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true',
  );

  // Close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [sidebarOpen, setSidebarOpen]);

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== 'Escape') return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item: any, index: number) => {
      if (item.children) {
        return (
          <SidebarLinkGroup
            key={index}
            activeCondition={item.path ? pathname.includes(item.path) : false}
          >
            {(handleClick, open) => (
              <React.Fragment>
                <NavLink
                  to="#"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                    pathname.includes(item.path || '') && ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    sidebarExpanded ? handleClick() : setSidebarExpanded(true);
                  }}
                >
                  {item.icon && <item.icon className="w-5 h-5 fill-current" />}
                  {item.name}
                  <svg
                    className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                      open && 'rotate-180'
                    }`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                      fill=""
                    />
                  </svg>
                </NavLink>
                <div
                  className={`translate transform overflow-hidden ${
                    !open && 'hidden'
                  }`}
                >
                  <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                    {item.children.map((child: any, childIndex: number) => (
                      <li key={childIndex}>
                        <NavLink
                          to={child.path!}
                          className={({ isActive }) =>
                            `group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                              isActive && '!text-white'
                            }`
                          }
                        >
                          {child.icon && (
                            <child.icon className="w-5 h-5 mr-3" />
                          )}
                          {child.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </React.Fragment>
            )}
          </SidebarLinkGroup>
        );
      } else {
        return (
          <li key={index}>
            <NavLink
              to={item.path!}
              className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                pathname === item.path && 'bg-graydark dark:bg-meta-4'
              }`}
            >
              {item.icon && <item.icon className="w-5 h-5 fill-current" />}
              {item.name}
            </NavLink>
          </li>
        );
      }
    });
  };

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/">
          <img src={Logo} alt="Logo" />
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <svg
            className="fill-current"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              MENU
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {renderMenuItems(MENU_CONFIG.main)}
            </ul>
          </div>

          {/* <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              OTHERS
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {renderMenuItems(MENU_CONFIG.others)}
            </ul>
          </div> */}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
