/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { RatingData } from "../../../../types";
import {
  getDocs,
  query,
  collection,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../../db";
import { Avatar, List, Rate } from "antd";
import { CustomLoader } from "../../../../components/loader";

export const RatingComponents: React.FC<{ uid: string | undefined }> = ({ uid }) => {
  const [rating, setRating] = useState<RatingData[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Map<string, RatingData>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);

  const fetchRatings = async () => {
    setLoading(true);
  const ratingsSnapshot = await getDocs(
    query(collection(db, "ratings"), where("ratedUserId", "==", uid))
  );
  const requestsList = ratingsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as RatingData)
  );
  setRating(requestsList);
  const requesterCardIds = requestsList.map(
    (request) => request.raterUserId
  );
  const userRefs = requesterCardIds.map((id) => doc(db, "users", id));
  const cardsSnap = await Promise.all(
    userRefs.map((cardRef) => getDoc(cardRef))
  );

  const raters = new Map<string, RatingData>();
  cardsSnap.forEach((cardSnap) => {
    if (cardSnap.exists()) {
      const cardData = cardSnap.data() as RatingData;
      raters.set(cardSnap.id, cardData); // Use doc ID as key
    }
  });

  setRatingsMap(raters);
  setLoading(false)
};

  useEffect(() => {

    fetchRatings();
  }, []);
  
  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <CustomLoader />
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">Ratings Received</h3>
      <List
        itemLayout="horizontal"
        dataSource={rating}
        className="w-full"
        renderItem={(request) => {
          const requesterCard = ratingsMap.get(request.raterUserId);
          return (
            <List.Item
              style={{
                background: "#13161b",
                padding: "16px 8px",
                borderRadius: "8px",
                width: "100%",
              }}
            >
              {requesterCard ? (
                <>
                  <div className="flex items-center w-full">
                    <Avatar src={requesterCard.photoURL} size={70} />
                    <div className="ml-3 text-white w-full">
                      <div className="flex w-full justify-between items-center">
                        <div className="flex gap-2">
                          <p>{requesterCard.displayName}</p>
                          <Rate value={request.rating || 0} />
                        </div>
                        <p>{request.createdAt.toDate().toLocaleDateString()}</p>
                      </div>

                      <div className="flex flex-col text-xs text-gray-200">
                        <p>Comment:</p>
                        <textarea
                          className="w-full p-2 text-whie bg-[#1c1f25]"
                          placeholder="Add a comment"
                          value={request.comment}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                "Loading card details..."
              )}
            </List.Item>
          );
        }}
      />
    </div>
  );
};
