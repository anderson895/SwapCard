/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Table, Button, Avatar} from 'antd';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { UserProfileData } from '../../../../types'; 
import { EmailVerfication } from '../../../../api/request';


export const ManageUsersPage = () => {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const db = getFirestore();
  const [loading,setLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfileData[];
      setUsers(usersList.slice(1));
    };

    fetchUsers();
  }, [db]);

  const handleVerifyUser = async (userId: UserProfileData) => {
    setLoading(true)
    const userRef = doc(db, 'users', userId.id);
    await updateDoc(userRef, { isVerified: true });
    const formData = new FormData;
    formData.append('user',userId.displayName)
    formData.append('email',userId.email)
    try {
        await EmailVerfication.SEND(formData)
      } catch (error) {
        console.error('Error verifying user:', error);
      }
    setUsers(users.map(user => user.id === userId.id ? { ...user, isVerified: true } : user));
    setLoading(false)
  };


  const columns = [
    { title: 'UID', dataIndex: 'uid', key: 'uid' },
    {
        title: 'Photo',
        dataIndex: 'photoURL',
        key: 'photoUrl',
        render: (photoUrl: string) => (
          <Avatar src={photoUrl} alt="User Photo" size={50} />
        ),
      },
    { title: 'Display Name', dataIndex: 'displayName', key: 'displayName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone Number', dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { title: 'Status', dataIndex: 'isVerified', key: 'isVerified', render: (isVerified: boolean) => (isVerified ? 'Verified' : 'Unverified') },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, user: UserProfileData) => (
        <div>
          {!user.isVerified && (
            <Button loading={loading} type="default" onClick={() => handleVerifyUser(user)} style={{ marginLeft: '10px' }}>
              Verify User
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <div>
      <h2 className="mb-4">Manage Users</h2>
      <Table loading={loading} columns={columns} dataSource={users} rowKey="id" />
    </div>
  );
};
