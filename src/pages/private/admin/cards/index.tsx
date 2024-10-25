/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Table, Card, Image, Input, Select } from 'antd';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../../db';  // Adjust the path to your db configuration

const { Option } = Select;

export const AdminCardsPage = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [sorting, setSorting] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCards = async () => {
        setLoading(true);
        try {
          // Update Firestore query based on sorting
          const cardsRef = collection(db, 'postCards');
          const q = query(cardsRef, orderBy('createdAt', sorting));
          const querySnapshot = await getDocs(q);
          const cardList = querySnapshot.docs.map(doc => doc.data());
          setCards(cardList);
        } catch (error) {
          console.error('Error fetching cards:', error);
        } finally {
          setLoading(false);
        }
    };

    fetchCards();
  }, [sorting]);

  const handleSortChange = (value: 'asc' | 'desc') => {
    setSorting(value);
  };

  // Filter cards based on search text and selected type
  const filteredCards = cards.filter(card => {
    const matchesSearchText = card.cardNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      card.playerName.toLowerCase().includes(searchText.toLowerCase()) ||
      card.playerTeam.toLowerCase().includes(searchText.toLowerCase());

    return matchesSearchText;
  });

  // Columns for the cards table
  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (imageUrl: string) => <Image src={imageUrl} width={100} />,
    },
    {
      title: 'Card Number',
      dataIndex: 'cardNumber',
      key: 'cardNumber',
      sorter: (a: any, b: any) => a.cardNumber.localeCompare(b.cardNumber),
    },
    {
      title: 'Player Name',
      dataIndex: 'playerName',
      key: 'playerName',
      sorter: (a: any, b: any) => a.playerName.localeCompare(b.playerName),
    },
    {
      title: 'Player Team',
      dataIndex: 'playerTeam',
      key: 'playerTeam',
      sorter: (a: any, b: any) => a.playerTeam.localeCompare(b.playerTeam),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Type A', value: 'Type A' },
        { text: 'Type B', value: 'Type B' },
        // Add more filter options based on your card types
      ],
      onFilter: (value: any, record: any) => record.type.includes(value),
      sorter: (a: any, b: any) => a.type.localeCompare(b.type),
    },
    {
      title: 'Collection',
      dataIndex: 'collection',
      key: 'collection',
      sorter: (a: any, b: any) => a.collection.localeCompare(b.collection),
    },
  ];

  return (
    <div className="admin-cards-page" style={{ padding: '24px' }}>
      <Card title="All User Cards">
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by card number, player name, or player team"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, marginRight: 16 }}
          />
        <Select defaultValue="desc" onChange={handleSortChange} style={{ width: 200 }}>
          <Option value="desc">New to Old</Option>
          <Option value="asc">Old to New</Option>
        </Select>
        </div>
        <Table
          dataSource={filteredCards}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
