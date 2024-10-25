/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import useStore from "../../../../zustand/store/store";
import { selectChats, selector, setOpenChats } from "../../../../zustand/store/store.provider";
import { useNavigate } from "react-router-dom";
import { CardData } from "../../../../types";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../../../../db";
import { Button, Input, message, Modal, Select } from "antd";
import {
  IoIosArrowDown,
  IoIosArrowDropleftCircle,
  IoIosArrowDroprightCircle,
  IoIosArrowUp,
  IoIosSwap,
} from "react-icons/io";
import { AiOutlineMessage } from "react-icons/ai";
import { BiSolidUserDetail } from "react-icons/bi";
import { CiViewList } from "react-icons/ci";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation"; // Import Swiper navigation CSS
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { SentNotificationEmail } from "../../../../api/request";
import { CustomLoader } from "../../../../components/loader";
import NoImg from "../../../../assets/noimg.webp";
import { formatDistanceToNow, parseISO } from "date-fns";

export const PostedCards = () => {
  const user = useStore(selector("user"));
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [userCards, setUserCards] = useState<CardData[]>([]);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSwapCard, setSelectedSwapCard] = useState<CardData | null>(
    null
  );
  const [filters, setFilters] = useState<{
    playerName?: string;
    type?: string;
    collection?: string;
  }>({});
  const [sortOrder, setSortOrder] = useState("newToOld");

  useEffect(() => {
    if (!user?.info?.uid) return;
  
    // Real-time listener for general cards
    const fetchCards = () => {
      setLoading(true);
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
  
      const cardsCollection = collection(db, "postCards");
      const q = query(cardsCollection, orderBy("createdAt", "desc"));
  
      const unsubscribe = onSnapshot(q, async (cardsSnapshot) => {
        const cardsList = await Promise.all(
          cardsSnapshot.docs.map(async (cardDoc) => {
            const cardData = cardDoc.data() as CardData;
            const cardId = cardDoc.id;
  
            // Fetch the owner's email
            const userDocRef = doc(db, "users", cardData.uid);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data();
            const ownerEmail = userData?.email || "";
  
            return {
              ...cardData,
              ownerEmail,
              id: cardId,
            } as CardData;
          })
        );
  
        // Filter out cards that are expired, belong to the current user, or have a status of "closed"
        const filteredCards = cardsList.filter((card) => {
          const isExpired = card.expirationDate.toDate() < now;
          const isUserCard = card.uid === user.info.uid;
          const isClosed = card.status === "closed";
  
          return !isExpired && !isUserCard && !isClosed;
        });
  
        setCards(filteredCards);
      });
  
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    };
  
    // Real-time listener for user's own cards
    const fetchUserCards = () => {
      const userCardsCollection = collection(db, "postCards");
      const q = query(userCardsCollection, where("uid", "==", user.info.uid));
  
      const unsubscribe = onSnapshot(q, (userCardsSnapshot) => {
        const userCardsList = userCardsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as CardData)
        );
        setUserCards(userCardsList);
        setLoading(false);
      });
  
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    };
  
    const unsubscribeCards = fetchCards();
    const unsubscribeUserCards = fetchUserCards();
  
    // Clean up all listeners on component unmount
    return () => {
      unsubscribeCards();
      unsubscribeUserCards();
    };
  }, [db, user?.info?.uid]); // Dependency array
  

  const toggleCardDetails = (card: CardData) => {
    setSelectedCard((prev) => (prev?.id === card.id ? null : card));
  };

  const handleChatNow = async (cardOwnerId: string) => {
    if (!user?.info?.uid || !cardOwnerId) return;
    if (user.info.uid === cardOwnerId) {
      message.error("You cannot message yourself.");
      return;
    }
    const conversationId = `${user.info.uid}_${cardOwnerId}`;
    const conversationRef = doc(db, "conversations", conversationId);

    const conversationSnapshot = await getDoc(conversationRef);

    if (!conversationSnapshot.exists()) {
      await setDoc(conversationRef, {
        participantIds: [user.info.uid, cardOwnerId],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTimestamp: null,
      });
    }
    setLoading(false);
    selectChats(conversationId)
    setOpenChats(false)
  };

  const handleRequestSwap = (card: CardData) => {
    if (userCards.length === 0) {
      message.error("You do not have any cards to offer for a swap.");
      return;
    }
    if (userCards.some((userCard) => userCard.id === card.id)) {
      message.error("You cannot swap your own card.");
      return;
    }
    setSelectedSwapCard(null); // Reset the selected card
    setSelectedCard(card); // Store the entire CardData object
    setIsSwapModalVisible(true);
  };

  const handleSwapConfirm = async () => {
    if (!selectedSwapCard || !selectedCard) {
      message.error(
        "Please select a card to swap and ensure the selected card is valid."
      );
      return;
    }

    try {
      setLoading(true);
      setIsSwapModalVisible(false);
      await addDoc(collection(db, "swapRequests"), {
        requesterId: user.info?.uid,
        receiverId: selectedCard?.uid, // Use selectedCard.uid
        requesterCardId: selectedSwapCard.id,
        receiverCardId: selectedCard?.id, // Use selectedCard.id
        status: "pending",
        createdAt: serverTimestamp(),
      });
      const content = `${user.info?.displayName} has sent you a swap request for your card ${selectedCard.cardNumber}.`
      await addDoc(collection(db, "notifications"), {
        userId: selectedCard.uid,
        type: "swap_request",
        message: content,
        createdAt: serverTimestamp(),
        read:false
      });
      const formData = new FormData();
      formData.append("displayName", user.info?.displayName);
      formData.append("cardNumber", selectedCard.cardNumber);
      formData.append("email", selectedCard.ownerEmail);
      formData.append("content", content);
      formData.append("subject", 'Swap Request');
      try {
        await SentNotificationEmail.SEND(formData);
      } catch (error) {
        console.error("Error verifying user:", error);
      }
      setLoading(false);
      message.success('Swap Request sent!')
      setSelectedSwapCard(null);
      setSelectedCard(null);
    } catch (error) {
      console.error("Failed to send swap request: ", error);
    }
  };

  const handleViewDetails = (cardId: string) => {
    navigate(`/Dashboard/User/Cards/${cardId}`);
  };

  const calculateRemainingTime = (expirationDate: Timestamp) => {
    const expiration = expirationDate.toDate();
    return formatDistanceToNow(expiration, { addSuffix: true });
  };

  const filteredAndSortedCards = cards
    .filter((card) => {
      return (
        (!filters.playerName ||
          card.playerName
            .toLowerCase()
            .includes(filters.playerName.toLowerCase())) &&
        (!filters.type ||
          card.type.toLowerCase().includes(filters.type.toLowerCase())) &&
        (!filters.collection ||
          card.collection
            .toLowerCase()
            .includes(filters.collection.toLowerCase()))
      );
    })
    .sort((a, b) => {
      if (sortOrder === "newToOld") {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      } else {
        return a.createdAt.toMillis() - b.createdAt.toMillis();
      }
    });

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <CustomLoader />
      </div>
    );
  }
  return (
    <div>
      <div className="flex justify-between items-center w-full">
        <p className="text-xl font-semibold text-white">
          Explore Recently Added Cards
        </p>
      </div>
      <div>
        <div className="flex gap-2 my-4">
          <Input
            placeholder="Filter by Player Name"
            onChange={(e) =>
              setFilters({ ...filters, playerName: e.target.value })
            }
          />
          <Input
            placeholder="Filter by Type"
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            size="small"
          />
          <Input
            placeholder="Filter by Collection"
            onChange={(e) =>
              setFilters({ ...filters, collection: e.target.value })
            }
          />
          <Select
            defaultValue="newToOld"
            onChange={(value) => setSortOrder(value)}
          >
            <Select.Option value="newToOld">New to Old</Select.Option>
            <Select.Option value="oldToNew">Old to New</Select.Option>
          </Select>
        </div>
      </div>

      <div className="mt-12 px-4">
        <Swiper
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={"auto"}
          spaceBetween={30}
          coverflowEffect={{
            rotate: 20,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false,
          }}
          navigation={{
            nextEl: ".custom-swiper-button-next",
            prevEl: ".custom-swiper-button-prev",
          }}
          modules={[EffectCoverflow, Pagination, Navigation]}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          breakpoints={{
            640: {
              slidesPerView: 3,
            },
            768: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="pt-12"
        >
          {filteredAndSortedCards.map((card, index) => (
            <SwiperSlide key={card.id}>
              <div
                className="relative overflow-hidden rounded-md border-2 border-[#5b6372]"
                ref={(el) => cardRefs.current.set(card.id, el)}
              >
                <img
                  alt="Card"
                  className="w-full h-[500px] object-fill"
                  src={card.imageUrl}
                  onError={(e) => {
                    // If the image fails to load, show an alternative image
                    e.currentTarget.src = NoImg;
                  }}
                />
                <Button
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                  onClick={() => toggleCardDetails(card)}
                  disabled={index !== activeIndex}
                >
                  {selectedCard?.id === card.id ? (
                    <IoIosArrowDown />
                  ) : (
                    <IoIosArrowUp className="animate-bounce" />
                  )}
                </Button>
                {selectedCard?.id === card.id && (
                  <motion.div
                    className="absolute bottom-8 left-0 right-0 bg-[#1c1f25] text-white shadow-lg p-4"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-nowrap">
                      <strong>Player Name:</strong> {card.playerName}
                    </p>
                    <p>
                      <strong>Card Number:</strong> {card.cardNumber}
                    </p>
                    <p className="text-nowrap">
                      <strong>Type:</strong> {card.type}
                    </p>
                    <p>
                      Posted:{" "}
                      {formatDistanceToNow(
                        parseISO(card.createdAt.toDate().toISOString()),
                        { addSuffix: true }
                      )}
                    </p>
                    <p>
                      Time Remaining:{" "}
                      {`${calculateRemainingTime(card.expirationDate)}`}
                    </p>{" "}
                    {/* Replace X days with the actual calculation */}
                    <p className="break-words overflow-wrap">
                      <strong>Looking For:</strong> {card.desiredCards}
                    </p>
                    <div className="py-2 space-y-2">
                      <Button
                        className="w-full items-center flex gap-2"
                        onClick={() => handleRequestSwap(card)}
                      >
                        <IoIosSwap size={20} />
                        Request Swap
                      </Button>
                      <Button
                        className="w-full items-center flex gap-2"
                        onClick={() => handleChatNow(card.uid)}
                      >
                        <AiOutlineMessage size={20} /> Message the Owner
                      </Button>
                      <Button
                        className="w-full items-center flex gap-2"
                        onClick={() =>
                          navigate(`/Dashboard/User/Profile/${card.uid}`)
                        }
                      >
                        <BiSolidUserDetail size={20} /> View Owner Details
                      </Button>
                      <Button
                        className="w-full items-center flex gap-2"
                        onClick={() => handleViewDetails(card.id)}
                      >
                        <CiViewList size={20} /> View Details
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Custom Previous Button */}
        <div className="custom-swiper-button-prev absolute left-8 top-1/2 transform -translate-y-1/2 p-2 bg-[#13161b] text-white rounded-full cursor-pointer">
          <IoIosArrowDropleftCircle size={54} />
        </div>

        {/* Custom Next Button */}
        <div className="custom-swiper-button-next absolute right-8 top-1/2 transform -translate-y-1/2 p-2 bg-[#13161b] text-white rounded-full cursor-pointer">
          <IoIosArrowDroprightCircle size={54} />
        </div>
      </div>
      {/* Modal for Selecting a Card to Swap */}
      <Modal
        title="Select a Card to Swap"
        open={isSwapModalVisible}
        onOk={handleSwapConfirm}
        onCancel={() => setIsSwapModalVisible(false)}
      >
        <div className="flex flex-col space-y-2">
          {userCards.map((userCard) => (
            <Button
              key={userCard.id}
              type={
                selectedSwapCard?.id === userCard.id ? "primary" : "default"
              }
              onClick={() => setSelectedSwapCard(userCard)}
            >
              {userCard.playerName} - {userCard.cardNumber}
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
};
