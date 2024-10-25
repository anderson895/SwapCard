import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { CardData, SwapOffer } from "../../../../types";
import { Descriptions, Image } from "antd";
import { format, formatDistanceToNow } from 'date-fns';
import { CustomLoader } from "../../../../components/loader";

export const CardDetailsPage = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [ownerName, setOwnerName] = useState<string>('');
  const [offers, setOffers] = useState<{ offer: SwapOffer; offeredCard: CardData | null }[]>([]);
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCardDetails = async () => {
      if (cardId) {
        // Fetch card details
        const cardRef = doc(db, "postCards", cardId);
        const cardSnap = await getDoc(cardRef);
        if (cardSnap.exists()) {
          const cardData = cardSnap.data() as CardData;
          setCard(cardData);
          const userRef = doc(db, "users", cardData.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setOwnerName(userData.displayName);
          }
        }

        // Fetch swap offers related to this card
        const offersRef = collection(db, "swapRequests");
        const offersQuery = query(
          offersRef,
          where("receiverCardId", "==", cardId)
        );
        const offersSnap = await getDocs(offersQuery);
        
        // Fetch details for offered cards
        const offersList = await Promise.all(offersSnap.docs.map(async (docSnap) => {
          const offer = docSnap.data() as SwapOffer;
          
          // Fetch the offered card details
          const offeredCardRef = doc(db, "postCards", offer.requesterCardId);
          const offeredCardSnap = await getDoc(offeredCardRef);
          const offeredCard = offeredCardSnap.exists() ? offeredCardSnap.data() as CardData : null;
          
          return { offer, offeredCard };
        }));
        
        setOffers(offersList);
      }
    };

    fetchCardDetails();
  }, [cardId, db]);

  const calculateRemainingTime = (expirationDate: Timestamp) => {
    const expiration = expirationDate.toDate();
    return formatDistanceToNow(expiration, { addSuffix: true });
  };
  
  if (!card) {
    return <div className='h-screen flex justify-center items-center'><CustomLoader /></div>;
  }

  return (
    <div className="p-4 text-white">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-500 underline"
      >
        Back
      </button>
      <h1 className="text-2xl font-bold">
        {card.playerName} - {card.cardNumber}
      </h1>
      <div className="flex justify-center items-center">
        <Image
          src={card.imageUrl}
          alt={`${card.playerName} card`}
          className="w-[300px] h-[300px]"
        />
      </div>
      <Descriptions style={{ backgroundColor:'#13161b',padding:'8px 12px',borderRadius:'8px',marginTop:'12px'}} layout="horizontal" title={<span className="description-label">Card Details</span>} column={2} bordered>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Player Name: </span>}>{card.playerName}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Card Number: </span>}>{card.cardNumber}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Team: </span>}>{card.playerTeam}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Year Manufactured: </span>}>{card.yearManufactured}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Collection: </span>}>{card.collection}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Type: </span>}>{card.type}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Condition: </span>}>{card.condition}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Card Owner: </span>}>{ownerName}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Looking For: </span>}>{card.desiredCards}</Descriptions.Item>
        <Descriptions.Item style={{ color: 'white',padding:'2px' }} label={<span className="description-label">Expiration: </span>}>{calculateRemainingTime(card.expirationDate)}</Descriptions.Item>
      </Descriptions>

      <h2 className="text-xl font-semibold my-4">Swap Offers</h2>
      {offers.length > 0 ? (
        <ul>
          {offers.map(({ offer, offeredCard }) => (
            <li key={offer.id} className="mb-2 flex items-center bg-[#13161b] rounded-md">
              {offeredCard?.imageUrl ? (
                <img
                  src={offeredCard.imageUrl}
                  alt="Offered Card"
                  className="w-[100px] h-[100px] mr-4"
                />
              ) : (
                <div className="w-[100px] h-[100px] mr-4 bg-gray-700"></div>
              )}
              <div>
                <p>
                  <strong>From:</strong> {offer.requesterId}
                </p>
                <p><strong>Created At:</strong> {format(offer.createdAt.toDate(), 'MMMM dd, yyyy')}</p>
                <p>
                  <strong>Status:</strong> {offer.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No swap offers for this card.</p>
      )}
    </div>
  );
};
