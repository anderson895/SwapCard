/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Avatar, Dropdown, List, MenuProps, Popover, Badge, Button, Divider } from "antd";
import { BellOutlined, MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp, getDocs, writeBatch  } from "firebase/firestore";
import { db } from "../db";
import useStore from "../zustand/store/store";
import { logoutUser, selector } from "../zustand/store/store.provider";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { RouterUrl } from "../routes";
import { HelpSection } from "../components/footer";
import { ChatPageWithList } from "../components/chatList";
import SwapLogo from '../assets/mycardLogo.jpg'

// Define Notification interface
interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: Timestamp;
  type: string;
  read: boolean; // Added field for read status
}

export default function UserSide() {
  const user = useStore(selector("user"));
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<boolean>(false); // For large screens
  const [visible1, setVisible1] = useState<boolean>(false); // For small screens
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  

  const handleLogout = () => {
    logoutUser();
    navigate(RouterUrl.Login);
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <span onClick={() => navigate(`/Dashboard/User/Profile/${user.info.uid}`)}>
          Profile
        </span>
      ),
    },
    {
      key: "2",
      label: <span onClick={handleLogout}>Logout</span>,
    },
  ];

  useEffect(() => {
    if (!user?.info?.uid) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("userId", "==", user.info.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const notificationsList: Notification[] = snapshot.docs.map((doc) => ({
    
          ...(doc.data() as Notification),
          id: doc.id,
        }));

        // Fetch avatars for users involved in notifications
        const userAvatars: Record<string, string> = {};
        for (const notification of notificationsList) {
          if (!userAvatars[notification.userId]) {
            const userRef = doc(db, "users", notification.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              userAvatars[notification.userId] = userSnap.data()?.photoURL || '';
            }
          }
        }

        setUserAvatars(userAvatars);
        setNotifications(notificationsList);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.info?.uid]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // Example breakpoint for large screens
        setVisible1(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call initially to check the size on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
  };

  const handleVisibleChange1 = (visible: boolean) => {
    setVisible1(visible);
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db); // Use writeBatch for batch operations
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, where("userId", "==", user.info.uid), where("read", "==", false));
      const snapshot = await getDocs(q);
  
      snapshot.forEach((doc) => {
        const docRef = doc.ref;
        batch.update(docRef, { read: true });
      });
  
      await batch.commit();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };
  

  const clearAllNotifications = async () => {
    try {
      const batch = writeBatch(db); // Use writeBatch for batch operations
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, where("userId", "==", user.info.uid));
      const snapshot = await getDocs(q);
  
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
  
      await batch.commit();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };
  

  const content = (
    <div style={{ width: 300 }}>
      <div className="pb-2 flex justify-between items-center">
        <h4 className="text-lg font-bold">Notifications</h4>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={clearAllNotifications}
        />
      </div>
      <Divider style={{ margin: "0" }} />
      <List
        itemLayout="horizontal"
        className="h-[400px] overflow-auto"
        dataSource={notifications}
        renderItem={(notification) => (
          <List.Item
            className="cursor-pointer"
            onClick={() => navigate(RouterUrl.UserOffersSwap)}
          >
            <List.Item.Meta
              avatar={<Avatar src={userAvatars[notification.userId]} />}
              title={notification.message}
              description={`Received on: ${new Timestamp(
                notification.createdAt.seconds,
                notification.createdAt.nanoseconds
              ).toDate().toLocaleString()}`}
            />
          </List.Item>
        )}
      />
      <div className="p-4 flex justify-between items-center">
        <Button type="link" onClick={markAllAsRead}>Mark all as read</Button>
      </div>
    </div>
  );

  const links = [
    { id: 0, label: "Home", link: RouterUrl.UserHomePage },
    { id: 1, label: "Cards", link: RouterUrl.UserCard },
    { id: 2, label: "Offers", link: RouterUrl.UserOffersSwap },
    {
      id: 3,
      label: (
        <Popover
          content={content}
          title=""
          trigger="click"
          open={visible}
          onOpenChange={handleVisibleChange}
        >
          <Badge size="small" count={notifications.filter((v:Notification) => v.read === false).length} offset={[5, 0]}>
            <BellOutlined style={{ fontSize: "24px", color: "#fff" }} />
          </Badge>
        </Popover>
      ),
      link: "#",
    },
    {
      id: 4,
      label: (
        <Dropdown menu={{ items }} trigger={["click"]}>
          <Avatar src={user?.info?.photoURL} />
        </Dropdown>
      ),
      link: "#",
    },
  ];

  return !user.isLogin ? (
    <Navigate replace to={RouterUrl.Login} />
  ) : (
    <div className="flex flex-col md:flex-row justify-center items-start relative bg-[#13161b]">
      <div className="w-full md:w-[60%] min-h-[100vh] pt-12 relative">
        <nav className="h-12 flex justify-between flex-nowrap items-center px-8 bg-[#1c1f25] absolute top-0 w-full z-50">
          <div className="flex justify-between items-center flex-1">
            <div className="md:hidden ">
              <MenuOutlined
                className="text-white text-2xl cursor-pointer z-50"
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  console.log("Menu open:", !menuOpen);
                }}
              />
            </div>
            <img src={SwapLogo} className="hidden md:block h-8" alt="" />
            <div className="md:hidden flex gap-4 items-center">
              {/* Popover for small screens */}
              <Popover
                content={content}
                title="Notifications"
                trigger="click"
                open={visible1}
                onOpenChange={handleVisibleChange1}
              >
                <Badge size="small" count={notifications.filter((v:Notification) => !v.read).length} offset={[5, 0]}>
                  <BellOutlined style={{ fontSize: "24px", color: "#fff" }} />
                </Badge>
              </Popover>
              <Dropdown menu={{ items }} trigger={["click"]}>
                <Avatar src={user?.info?.photoURL} />
              </Dropdown>
            </div>
          </div>
          <ul
            className={` md:flex gap-2 items-center flex-1 ${
              menuOpen ? "block" : "hidden"
            } md:block absolute md:static top-12 left-0 w-full md:w-auto bg-[#1c1f25] md:bg-transparent p-4 md:p-0 `}
          >
            {links?.map((v: any) => {
              return menuOpen && (v.id === 3 || v.id === 4) ? null : (
                <li
                  key={v.id}
                  className={`font-sans text-nowrap w-full text-center text-white font-bold tracking-tight hover:text-green-700 p-2 transition ease-in-out delay-150 duration-300 rounded-md cursor-pointer`}
                  onClick={v.id !== 3 ? () => navigate(v.link) : undefined}
                >
                  {v.label}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="relative bg-[#282c34] min-h-[100vh]">
          <Outlet />
          <HelpSection />
        </div>
      </div>
      <ChatPageWithList />
    </div>
  );
}
