/* eslint-disable react-hooks/exhaustive-deps */
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react'
import { db } from '../../../../db';
import { CardData } from '../../../../types';
import useStore from '../../../../zustand/store/store';
import { selector } from '../../../../zustand/store/store.provider';
import { CustomLoader } from '../../../../components/loader';

export const UserHomepage = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const user = useStore(selector('user'));
  const [loading, setLoading] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const cardsCollection = collection(db, 'postCards');
    const q = query(
      cardsCollection,
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'desc')
    );

    const cardsSnapshot = await getDocs(q);
    const cardsList = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardData));
    setCards(cardsList);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchCards();
  }, [db]);

  if(loading){
    return <div className='h-screen flex justify-center items-center'><CustomLoader /></div>
  }

  return (
    <div className="min-h-screen bg-[#282c34] p-6">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.info?.displayName || 'User'}!</h1>
        <p className="text-gray-600">Here are the top 10 latest cards:</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.slice(0, 10).map(card => (
          <div key={card.id} className="bg-[#0d0e12] text-white shadow-md rounded-lg p-4">
            <img src={card.imageUrl} alt={card.imageUrl} className="w-full h-40 object-fill rounded-t-lg mb-4" />
            <h2 className="text-xl font-semibold mb-2">{card.playerName}</h2>
            <p className="text-gray-600">{card.playerTeam}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
