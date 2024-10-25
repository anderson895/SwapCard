/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table } from 'antd';
import { UserOutlined, FileTextOutlined, SwapOutlined } from '@ant-design/icons';
import { collection, getDocs, query, orderBy, limit, doc as getDocRef, getDoc} from 'firebase/firestore';
import { db } from '../../../../db';

export const AdminDashboardPage = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPostCards, setTotalPostCards] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const postCardsSnapshot = await getDocs(collection(db, 'postCards'));
      const transactionsSnapshot = await getDocs(collection(db, 'swapTransactions'));

      // Calculate totals excluding the first document in each collection
      setTotalUsers(usersSnapshot.size > 0 ? usersSnapshot.size - 1 : 0);
      setTotalPostCards(postCardsSnapshot.size > 0 ? postCardsSnapshot.size - 1 : 0);
      setTotalTransactions(transactionsSnapshot.size > 0 ? transactionsSnapshot.size - 1 : 0);

      // Fetch recent transactions
      const recentTransactionsQuery = query(
        collection(db, 'swapTransactions'),
        orderBy('createdAt', 'desc'),
        limit(5)  // Limit to the last 5 transactions
      );
      const recentTransactionsSnapshot = await getDocs(recentTransactionsQuery);

      const transactionsData = await Promise.all(recentTransactionsSnapshot.docs.map(async (transactionDoc) => {
        const data = transactionDoc.data();
        const requesterRef = getDocRef(db, 'users', data.requesterId);
        const receiverRef = getDocRef(db, 'users', data.receiverId);
        
        const [requesterSnap, receiverSnap] = await Promise.all([
          getDoc(requesterRef),
          getDoc(receiverRef),
        ]);

        const requesterDisplayName = requesterSnap.exists() ? requesterSnap.data()?.displayName : 'Unknown User';
        const receiverDisplayName = receiverSnap.exists() ? receiverSnap.data()?.displayName : 'Unknown User';

        return {
          ...data,
          id: transactionDoc.id,
          requesterDisplayName,
          receiverDisplayName,
          createdAt: new Date(data.createdAt.seconds * 1000).toLocaleString(),  // Convert timestamp to date
        };
      }));
      setRecentTransactions(transactionsData);
    };

    fetchData();
  }, []);

  // Columns for the transactions table
  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Requester',
      dataIndex: 'requesterDisplayName',
      key: 'requesterDisplayName',
    },
    {
      title: 'Receiver',
      dataIndex: 'receiverDisplayName',
      key: 'receiverDisplayName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];
  return (
    <div className="admin-dashboard-page" style={{ padding: '24px' }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Post Cards"
              value={totalPostCards}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={totalTransactions}
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Recent Transactions">
            <Table
              dataSource={recentTransactions}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
