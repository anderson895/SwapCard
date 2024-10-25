import { Modal, Rate, Input, message } from 'antd';
import { useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../../db';

interface RatingFormProps {
  visible: boolean;
  onClose: () => void;
  transactionId: string;
  ratedUserId: string;
  role: "requester" | "receiver";
}

export const RatingForm: React.FC<RatingFormProps> = ({ visible, onClose, transactionId, ratedUserId,role }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading,setLoading] =useState(false)
  const userId = auth.currentUser?.uid;

  const handleSubmit = async () => {
    if (!rating || !userId) {
      message.error('Please provide a rating.');
      return;
    }
    setLoading(true)
    try {
      await addDoc(collection(db, 'ratings'), {
        raterUserId: userId,
        ratedUserId,
        transactionId,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      const swapRequestRef = doc(db, "swapTransactions", transactionId);
      if(role === 'receiver'){
        await updateDoc(swapRequestRef, { receiverRated: true });
      } else {
        await updateDoc(swapRequestRef, { requesterRated: true });
      }
      message.success('Rating submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting rating: ', error);
      message.error('Failed to submit rating.');
    } finally {
      setLoading(false)
    }
  };

  return (
    <Modal open={visible} onCancel={onClose} onOk={handleSubmit} confirmLoading={loading} title="Rate the Transaction">
      <Rate value={rating} onChange={setRating} />
      <Input.TextArea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a comment (optional)"
        rows={3}
      />
    </Modal>
  );
};
