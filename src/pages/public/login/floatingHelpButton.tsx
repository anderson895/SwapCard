import React, { useState } from 'react';
import { Button, Collapse, Modal } from 'antd';
import { FaQuestionCircle } from 'react-icons/fa';
const { Panel } = Collapse;// Adjust the import path as necessary

export const FloatingHelpButton: React.FC = () => {
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const faqData = [
    {
      question: 'How do I create an account?',
      answer: 'To create an account, you will need an active Facebook profile and a UAE phone number. After providing these details, your account will be reviewed by the site administrator for approval.',
    },
    {
      question: 'How do I post a swap?',
      answer: 'To post a swap, click the "Post Swap" button on your dashboard. Enter the details of the card you want to swap, upload a photo, and activate the post. Your swap will be visible to other users for up to 7 days.',
    },
    {
      question: 'How do I accept a swap request?',
      answer: `To accept a swap request, navigate to your swap post and review the request from another user. If you're satisfied, click 'Accept.' If not, you can decline the request and wait for another user to respond.`,
    },
    {
      question: 'What happens if my swap request is declined?',
      answer: 'If your swap request is declined, the swap post will stay active, allowing other users to respond. You can also modify your offer and submit it again',
    },
    {
      question: 'How can I view my swap history?',
      answer: 'You can view your swap history, including both successful and failed swaps, on your summary page. It displays the date, card details, and the status of each swap.',
    },
    {
      question: 'How do I receive notifications?',
      answer: 'You will receive notifications about your swap posts, such as new requests or status changes, at your registered email address. Be sure to keep your email up to date in your profile settings.',
    },
    {
      question: 'How can I rate and review another user?',
      answer: 'Once a swap is completed, you’ll have the option to rate and review the other user based on your experience. The ratings and reviews will be visible on the user’s profile.',
    },
    {
      question: 'How can I contact customer support?',
      answer: 'If you need assistance, you can reach our customer support team through the contact options listed in the "Customer Support" section of the Help page.',
    },
  ];
  return (
    <>
      <Button
        shape="circle"
        icon={<FaQuestionCircle size={32} />} // Increase the icon size
        className="fixed bottom-4 right-4 z-50"
        style={{
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          width: 60, // Increase button width
          height: 60, // Increase button height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setIsHelpModalVisible(true)}
      />
      
      <Modal
        title="Help"
        open={isHelpModalVisible}
        className='bg-[#13161b]'
        width={700}
        onOk={() => setIsHelpModalVisible(false)}
        onCancel={() => setIsHelpModalVisible(false)}
        style={{background:'#13161b',padding:'0px'}}
        footer={null}
      >
                 <Collapse accordion>
            {faqData.map((faq, index) => (
              <Panel header={<p className='text-black'>{faq.question}</p>} key={index}>
                <p>{faq.answer}</p>
              </Panel>
            ))}
          </Collapse>

      </Modal>
    </>
  );
};
