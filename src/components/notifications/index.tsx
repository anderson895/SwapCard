/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/NotificationPopover.tsx
import { Popover, List, Avatar } from 'antd';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import useStore from '../../zustand/store/store';
import { selector } from '../../zustand/store/store.provider';
import { db } from '../../db';

export const NotificationPopover = () => {
  const user = useStore(selector('user'));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);

  const fetchNotifications = async () => {
    try {
        if (!user?.info?.uid) return;
    
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.info.uid),
            orderBy('createdAt', 'desc')
          );
          
        
        const notificationsSnapshot = await getDocs(q);
        
        if (notificationsSnapshot.empty) {
          console.log('No matching documents.');
        } else {
          const notificationsList = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNotifications(notificationsList);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
  };
  
  useEffect(() => {


    fetchNotifications();
  }, []);

  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
  };

  const content = (
    <List
      itemLayout="horizontal"
      dataSource={notifications}
      renderItem={notification => (
        <List.Item>
          <List.Item.Meta
            avatar={<Avatar src="https://joeschmoe.io/api/v1/random" />}
            title={notification.message}
            description={`Received on: ${new Timestamp(notification.createdAt.seconds, notification.createdAt.nanoseconds).toDate().toLocaleString()}`}
          />
        </List.Item>
      )}
    />
  );
  return (
    <Popover
      content={content}
      title="Notifications"
      trigger="click"
      open={visible}
      onOpenChange={handleVisibleChange} // Use onOpenChange to control visibility
    >
      <span className="cursor-pointer text-white font-bold">Notifications</span>
    </Popover>
  );
};
