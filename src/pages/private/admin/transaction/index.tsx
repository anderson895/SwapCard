/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Table, Tag, Spin } from 'antd';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../db';

export const AdminTransactionPage = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const transactionsRef = collection(db, 'swapTransactions');
        const q = query(transactionsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // Fetch user and card details concurrently
        const transactionsList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const requesterCardRef = doc(db, 'postCards', data.requesterCardId);
          const receiverCardRef = doc(db, 'postCards', data.receiverCardId);
          const requesterRef = doc(db, 'users', data.requesterId);
          const receiverRef = doc(db, 'users', data.receiverId);

          // Fetch document data
          const [requesterCard, receiverCard, requester, receiver] = await Promise.all([
            getDoc(requesterCardRef),
            getDoc(receiverCardRef),
            getDoc(requesterRef),
            getDoc(receiverRef),
          ]);

          return {
            id: docSnapshot.id,
            requesterDisplayName: requester.data()?.displayName || 'Unknown',
            receiverDisplayName: receiver.data()?.displayName || 'Unknown',
            requesterCard: requesterCard.data(),
            receiverCard: receiverCard.data(),
            status: data.status,
            createdAt: data.createdAt.toDate(), // Convert Firestore timestamp to JavaScript Date object
          };
        }));
        
        setTransactions(transactionsList);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Requester Name',
      dataIndex: 'requesterDisplayName',
      key: 'requesterDisplayName',
    },
    {
      title: 'Receiver Name',
      dataIndex: 'receiverDisplayName',
      key: 'receiverDisplayName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color: string;
        switch (status) {
          case 'accepted':
            color = 'green';
            break;
          case 'pending':
            color = 'orange';
            break;
          case 'rejected':
            color = 'red';
            break;
          default:
            color = 'blue';
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: Date) => createdAt.toLocaleString(), // Convert Date object to string
    },
  ];

  const expandedRowRender = (record: any) => (
    <div className='flex justify-around'>
      <div>
      <h4>Requester Card Details:</h4>
      <div className='flex gap-2'>
        <img src={record.requesterCard?.imageUrl} alt="Requester Card" width={100} />
        <div>
        <p>Card Number: {record.requesterCard?.cardNumber}</p>
        <p>Player Name: {record.requesterCard?.playerName}</p>
        <p>Player Team: {record.requesterCard?.playerTeam}</p>
        <p>Type: {record.requesterCard?.type}</p>
        <p>Collection: {record.requesterCard?.collection}</p>
        </div>
      </div>
      </div>
      <div>
      <h4>Receiver Card Details:</h4>
      <div className='flex gap-2'>
        <img src={record.receiverCard?.imageUrl} alt="Receiver Card" width={100} />
        <div>
        <p>Card Number: {record.receiverCard?.cardNumber}</p>
        <p>Player Name: {record.receiverCard?.playerName}</p>
        <p>Player Team: {record.receiverCard?.playerTeam}</p>
        <p>Type: {record.receiverCard?.type}</p>
        <p>Collection: {record.receiverCard?.collection}</p>
        </div>
      </div>
      </div>

    </div>
  );

  return (
    <div className="p-4">
      <h2 className="mb-4">Transactions and Swap Requests</h2>
      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          expandable={{
            expandedRowRender,
          }}
          dataSource={transactions}
          rowKey="id" // Ensure each transaction has a unique id
        />
      )}
    </div>
  );
};
