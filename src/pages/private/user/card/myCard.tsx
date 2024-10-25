/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, storage } from '../../../../db';
import useStore from '../../../../zustand/store/store';
import { selector } from '../../../../zustand/store/store.provider';
import { CardData } from '../../../../types';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Button, Form, Input, Modal, Upload, message, Table, Image, Spin, Tag } from 'antd';
import { UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

const { confirm } = Modal;

export const MyCards = () => {
  const user = useStore(selector('user'));
  const [userCards, setUserCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editCard, setEditCard] = useState<CardData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchUserCards = async () => {
    if (!user?.info?.uid) return;
    setLoading(true);

    const userCardsCollection = collection(db, 'postCards');
    const q = query(userCardsCollection, where('uid', '==', user.info.uid));
    const userCardsSnapshot = await getDocs(q);

    const userCardsList = userCardsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as CardData)
    );
    setUserCards(userCardsList);
    setLoading(false);
  };

  const showModal = () => {
    setEditCard(null);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let imageUrl = "";
      if (file) {
        // If editing an existing card, delete the old image
        if (editCard?.imageUrl) {
          const oldImageRef = ref(storage, editCard.imageUrl);
          await deleteObject(oldImageRef); // Delete the old image
        }
  
        // Upload the new image
        const uniqueFilename = `${Date.now()}_${uuidv4()}_${file.name}`;
        const storageRef = ref(storage, `card_Images/${uniqueFilename}`);
        const snapshot = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
      } else {
        imageUrl = editCard?.imageUrl || ""; // Keep the existing image URL if no new image is uploaded
      }
  
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      if (editCard) {
        const cardDoc = doc(db, 'postCards', editCard.id);
        await updateDoc(cardDoc, {
          ...values,
          imageUrl: imageUrl || editCard.imageUrl,
        });
        message.success('Card updated successfully');
      } else {
        await addDoc(collection(db, "postCards"), {
          ...values,
          imageUrl,
          uid: user.info?.uid,
          status: "open",
          createdAt: serverTimestamp(),
          expirationDate,
          hasRequest: false
        });
        message.success('Card added successfully');
      }

      form.resetFields();
      setFile(null);
      setIsModalVisible(false);
      fetchUserCards();
    } catch (error) {
      console.error("Failed to add/update card: ", error);
      message.error("Failed to add/update card");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleFileChange = (info: any) => {
    setFile(info.file);
  };

  const handleEditCard = (card: CardData) => {
    setEditCard(card);
    form.setFieldsValue(card);
    setIsModalVisible(true);
  };

  const handleDeleteCard = (cardId: string, imageUrl?: string) => {
    confirm({
      title: 'Are you sure you want to delete this card?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          const cardDoc = doc(db, 'postCards', cardId);
          await deleteDoc(cardDoc);
          if (imageUrl) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef); // Delete the image
          }
          message.success('Card deleted successfully');
          fetchUserCards();
        } catch (error) {
          console.error("Failed to delete card: ", error);
          message.error("Failed to delete card");
        }
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };

  useEffect(() => {
    fetchUserCards();
  }, []);

  // Define columns for the Ant Design Table
  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (imageUrl: string) => <Image src={imageUrl} alt="card" width={70} height={80} />,
      width:'70px'
    },
    {
      title: 'Player Name',
      dataIndex: 'playerName',
      key: 'playerName',
    },
    {
      title: 'Card Number',
      dataIndex: 'cardNumber',
      key: 'cardNumber',
    },
    {
      title: 'Year Manufactured',
      dataIndex: 'yearManufactured',
      key: 'yearManufactured',
    },
    {
      title: 'Collection',
      dataIndex: 'collection',
      key: 'collection',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Cards Wanted',
      dataIndex: 'desiredCards',
      key: 'desiredCards',
    },
    {
      title: 'Expiration Date',
      dataIndex: 'expirationDate',
      key: 'expirationDate',
      render: (text: Timestamp) => text.toDate().toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render:(v:any) =>{
        if(v === 'closed'){
          return <Tag color='red'>Close</Tag>;
        } else{
          return <Tag color='green'>Open</Tag>;
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_text: any, record: CardData) => (
        <div className='flex flex-col gap-2'>
          <Button className='w-24' type='primary' onClick={() => handleEditCard(record)}>Edit</Button>
          <Button className='w-24' danger onClick={() => handleDeleteCard(record.id, record.imageUrl)}>Delete</Button>
        </div>
      ),
      width:'40px'
    },
  ];

  return (
    <div className='p-4'>
      <Spin spinning={loading} tip="Loading...">
        <Button type="primary" onClick={showModal} style={{ marginBottom: '20px' }}>Add New Card</Button>
        <Table scroll={{ x:'50vw'}} columns={columns} dataSource={userCards} rowKey="id" />
      </Spin>

      <Modal
        title={editCard ? "Edit Card" : "Add New Card"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Card Image"
            rules={[{ required: !editCard }]}
            className="mb-1"
          >
            <Upload
              beforeUpload={() => false}
              onChange={handleFileChange}
              listType="picture"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Upload Card Image</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="cardNumber"
            label="Card Number"
            rules={[{ required: true }]}
            className="mb-1"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="playerName"
            label="Player Name"
            rules={[{ required: true }]}
            className="mb-1"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="playerTeam"
            label="Player Team"
            rules={[{ required: true }]}
            className="mb-1"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="yearManufactured"
            label="Year Manufactured"
            rules={[{ required: true }]}
            className="mb-1"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="collection"
            label="Collection"
            rules={[{ required: true }]}
            className="mb-1"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true }]}
            className="mb-1"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="desiredCards"
            label="Desired Cards"
            rules={[{ required: true }]}
            className="mb-1"
          >
            <Input.TextArea placeholder="Specify the type or specific cards you're looking for" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
