import { useEffect, useState } from "react";
import { Button, List, message, Image, DatePicker, Select } from "antd";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { CardData, SwapOffer } from "../../../../types";
import { auth, db } from "../../../../db";
import { CustomLoader } from "../../../../components/loader";
import dayjs from "dayjs";
import { SentNotificationEmail } from "../../../../api/request";
import { RatingForm } from "./ratingForm";

const { Option } = Select;

export const SwapRequestsPage = () => {
  const [swapRequests, setSwapRequests] = useState<SwapOffer[]>([]);
  const [cardsMap, setCardsMap] = useState<Map<string, CardData>>(new Map());
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map()); // Map to store user IDs and display names
  const [filteredRequests, setFilteredRequests] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRatingVisible, setIsRatingVisible] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<{
    transactionId: string;
    ratedUserId: string;
    role:'requester' | 'receiver'
  } | null>(null);
  const userId = auth.currentUser?.uid;

  const [ratingStatus, setRatingStatus] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const fetchSwapRequests = async () => {
      if (!userId) return;
      setLoading(true);
  
      try {
        // Real-time listener for swap requests
        const swapRequestsCollection = collection(db, "swapRequests");
        const q = query(
          swapRequestsCollection,
          where("receiverId", "==", userId)
        );
        const unsubscribe = onSnapshot(q, async (swapRequestsSnapshot) => {
          const requestsList = swapRequestsSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as SwapOffer)
          );
          setSwapRequests(requestsList);
  
          // Fetch card details for both receiver and requester cards
          const cardIds = [
            ...new Set([
              ...requestsList.map((request) => request.receiverCardId),
              ...requestsList.map((request) => request.requesterCardId),
            ]),
          ];
  
          const cardRefs = cardIds.map((cardId) => doc(db, "postCards", cardId));
          const cardsSnap = await Promise.all(
            cardRefs.map((cardRef) => getDoc(cardRef))
          );
  
          const cards = new Map<string, CardData>();
          cardsSnap.forEach((cardSnap) => {
            if (cardSnap.exists()) {
              const cardData = cardSnap.data() as CardData;
              cards.set(cardSnap.id, cardData); // Use doc ID as key
            }
          });
          setCardsMap(cards);
  
          // Fetch user display names
          const userIds = [
            ...new Set([
              ...requestsList.map((request) => request.requesterId),
              ...requestsList.map((request) => request.receiverId),
            ]),
          ];
  
          const userRefs = userIds.map((userId) => doc(db, "users", userId));
          const usersSnap = await Promise.all(
            userRefs.map((userRef) => getDoc(userRef))
          );
  
          const users = new Map<string, string>(); // Map user IDs to display names
          usersSnap.forEach((userSnap) => {
            if (userSnap.exists()) {
              const userData = userSnap.data();
              users.set(userSnap.id, userData.displayName || "Unknown"); // Use doc ID as key
            }
          });
          setUsersMap(users);
        });
  
        // Clean up the listener when the component unmounts
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching swap requests or card details:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSwapRequests();
  }, [userId]);
  

  useEffect(() => {
    const filterAndSortRequests = () => {
      let requests = [...swapRequests];

      // Filter by date if selected
      if (filterDate) {
        const startOfDay = filterDate.startOf("day").toDate();
        const endOfDay = filterDate.endOf("day").toDate();
        requests = requests.filter((request) => {
          const createdAt = request.createdAt?.toDate();
          return createdAt && createdAt >= startOfDay && createdAt <= endOfDay;
        });
      }

      // Sort by date
      requests.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return sortOrder === "desc"
          ? dateB.getTime() - dateA.getTime()
          : dateA.getTime() - dateB.getTime();
      });

      setFilteredRequests(requests);
    };

    filterAndSortRequests();
  }, [swapRequests, filterDate, sortOrder]);

  useEffect(() => {
    const fetchRatingStatus = async () => {
      const statusMap = new Map<string, boolean>();

      for (const request of swapRequests) {
        const rated = await hasUserRated(request.id);
        statusMap.set(request.id, rated);
      }
      setRatingStatus(statusMap);
    };
  
    fetchRatingStatus();
  }, [swapRequests]);


  const hasUserRated = async (transactionId: string)=> {
    try {
      const transactionRef = doc(db, 'swapTransactions', transactionId);
      const transactionSnap = await getDoc(transactionRef);
      if (transactionSnap.exists()) {
        const transactionData = transactionSnap.data();
        return transactionData.requesterRated && transactionData.receiverRated;
      }
      return false;
    } catch (error) {
      console.error('Failed to check rating status: ', error);
      return false;
    }
  };

  const handleAccept = async (
    requestId: string,
    requesterCardId: string,
    receiverCardId: string
  ) => {
    if (!userId) return;
  
    setLoading(true);
    
    try {
      // Fetch card details
      const requesterCardRef = doc(db, "postCards", requesterCardId);
      const receiverCardRef = doc(db, "postCards", receiverCardId);
  
      const [requesterCardSnap, receiverCardSnap] = await Promise.all([
        getDoc(requesterCardRef),
        getDoc(receiverCardRef),
      ]);
  
      if (!requesterCardSnap.exists() || !receiverCardSnap.exists()) {
        throw new Error("One or both cards not found.");
      }
  
      const requesterCardData = requesterCardSnap.data();
      const receiverCardData = receiverCardSnap.data();
      
          // Fetch the requester user's profile using their uid from the requester card
    const requesterUserRef = doc(db, "users", requesterCardData.uid);
    const requesterUserSnap = await getDoc(requesterUserRef);

    if (!requesterUserSnap.exists()) {
      throw new Error("Requester user not found.");
    }

    const requesterUserData = requesterUserSnap.data()
      // Use a batch to perform multiple updates
      const batch = writeBatch(db);
      // Update the swap request status to 'accepted'
      const swapRequestRef = doc(db, "swapRequests", requestId);
      batch.update(swapRequestRef, { status: "accepted" });
  
      // Update card ownership
      batch.update(requesterCardRef, { uid: receiverCardData?.uid, status: "closed" }); // Requester card now belongs to the user
      batch.update(receiverCardRef, { uid: requesterCardData?.uid, status: "closed" }); // Receiver card now belongs to the requester
  
      // Commit the batch
      await batch.commit();
  
      // Create a transaction record
      const transactionRef = collection(db, "swapTransactions");
      const transactionDoc = await addDoc(transactionRef, {
        requesterId: requesterCardData.uid,
        receiverId: userId,
        requesterCardId,
        receiverCardId,
        status: "accepted",
        createdAt: serverTimestamp(),
        requesterRated: false,
        receiverRated: false,
      });
  
      // Add a notification for the requester
      const notificationRef = collection(db, "notifications");
      await addDoc(notificationRef, {
        userId: requesterCardData.uid,
        type: "swap_accepted",
        message: `Your swap request for card ${requesterCardData.cardNumber} has been accepted.`,
        createdAt: serverTimestamp(),
        read:false
      });
  
      // Send notification email
      const formData = new FormData();
      formData.append("displayName", requesterUserData.displayName);
      formData.append("email", requesterUserData.email);
      formData.append(
        "content",
        `Your swap request for card ${requesterCardData.cardNumber} has been accepted.`
      );
      formData.append("subject", "Swap Request Approved");
  
      await SentNotificationEmail.SEND(formData);
  
      // Update state
      message.success("Swap request accepted!");
      setSwapRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );
  
      const isRequester = requesterCardData.uid === userId;
      const role = isRequester ? "requester" : "receiver";
  
      setCurrentTransaction({
        transactionId: transactionDoc.id,
        ratedUserId: requesterCardData.uid,
        role: role,
      });
  
      setIsRatingVisible(true);
    } catch (error) {
      console.error("Failed to accept swap request: ", error);
      message.error("Failed to accept swap request.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeny = async (requestId: string) => {
    try {
      setLoading(true);
      const swapRequestRef = doc(db, "swapRequests", requestId);
      await updateDoc(swapRequestRef, { status: "denied" });

      // Send notification to the requester
      const swapRequestSnap = await getDoc(swapRequestRef);
      const requesterId = swapRequestSnap.data()?.requesterId;

      if (requesterId) {
        const notificationRef = collection(db, "notifications");
        await addDoc(notificationRef, {
          userId: requesterId,
          type: "swap_denied",
          message: `Your swap request has been denied.`,
          createdAt: serverTimestamp(),
          read:false
        });
      }

      message.success("Swap request denied!");
      setLoading(false);
      setSwapRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );
    } catch (error) {
      console.error("Failed to deny swap request: ", error);
      message.error("Failed to deny swap request.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <CustomLoader />
      </div>
    );
  }
 console.log(ratingStatus)
  return (
    <div className="px-8 py-4 text-white">
      {isRatingVisible && currentTransaction && (
        <RatingForm
          visible={isRatingVisible}
          onClose={() => setIsRatingVisible(false)}
          transactionId={currentTransaction.transactionId}
          ratedUserId={currentTransaction.ratedUserId}
          role={currentTransaction.role}
        />
      )}
      <h1 className="text-2xl font-bold mb-4">Swap Requests</h1>
      <div className="mb-4 flex items-center">
        <DatePicker
          className="mr-4"
          format="YYYY-MM-DD"
          onChange={(date) => setFilterDate(date ? dayjs(date) : null)}
        />
        <Select
          defaultValue="desc"
          onChange={(value) => setSortOrder(value as "asc" | "desc")}
        >
          <Option value="desc">New to Old</Option>
          <Option value="asc">Old to New</Option>
        </Select>
      </div>
      <List
        dataSource={filteredRequests}
        renderItem={(request) => {
          const receiverCard = cardsMap.get(request.receiverCardId);
          const requesterCard = cardsMap.get(request.requesterCardId);
          const requesterDisplayName =
            usersMap.get(request.requesterId) || "Unknown Requester";

          return (
            <List.Item
              key={request.id}
              className="bg-[#1c1f25] mb-4 rounded-md"
            >
              <List.Item.Meta
                className="p-4 pt-1"
                title={
                  <div className="flex flex-col md:flex-row justify-between md:items-center text-white">
                    <p className="text-lg">{`Requester: ${requesterDisplayName}`}</p>
                    <p className="mt-2">{`Requested on: ${request.createdAt
                      ?.toDate()
                      .toLocaleDateString()}`}</p>
                  </div>
                }
                description={
                  <div className="flex flex-col">
                    <div className="flex flex-col md:flex-row justify-around items-center">
                      <div className="flex items-center text-white">
                        <Image
                          src={requesterCard?.imageUrl}
                          alt={`Card ${requesterCard?.cardNumber}`}
                          width={100}
                          height={100}
                        />
                        <div>
                          <p className="ml-4">{`Card Number: ${requesterCard?.cardNumber}`}</p>
                          <p className="ml-4">{`Player Name: ${requesterCard?.playerName}`}</p>
                          <p className="ml-4">{`Player Team: ${requesterCard?.playerTeam}`}</p>
                          <p className="ml-4">{`Type: ${requesterCard?.type}`}</p>
                          <p className="ml-4">{`Collection: ${requesterCard?.collection}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center mt-2 text-white mb-4">
                        <Image
                          src={receiverCard?.imageUrl}
                          alt={`Card ${receiverCard?.cardNumber}`}
                          width={100}
                          height={100}
                        />
                        <div>
                          <p className="ml-4">{`Card Number: ${receiverCard?.cardNumber}`}</p>
                          <p className="ml-4">{`Player Name: ${receiverCard?.playerName}`}</p>
                          <p className="ml-4">{`Player Team: ${receiverCard?.playerTeam}`}</p>
                          <p className="ml-4">{`Type: ${receiverCard?.type}`}</p>
                          <p className="ml-4">{`Collection: ${receiverCard?.collection}`}</p>
                        </div>
                      </div>
                    </div>
                    {request.status === "pending" ? (
                      <div className="w-full flex gap-2 justify-end">
                        <Button
                          className="bg-green-600 text-white"
                          onClick={() =>
                            handleAccept(
                              request.id,
                              request.requesterCardId,
                              request.receiverCardId
                            )
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          className="bg-red-600 text-white"
                          onClick={() => handleDeny(request.id)}
                        >
                          Deny
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full flex gap-2 justify-end">
                        <p
                          className={`${
                            request.status === "accepted"
                              ? "bg-green-600 text-white p-4 py-2 rounded-md"
                              : "bg-red-600 text-white p-4 py-2 rounded-md"
                          }`}
                        >
                          {request.status?.toUpperCase()}
                        </p>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};
